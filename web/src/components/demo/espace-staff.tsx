"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { ModalFrame } from "@/components/shell/modal-host";
import { advanceIncident, askDocument, cancelByOwner, checkPiece, decideRequest, nextStage, removeReview, saveNote, setAvailability, setQuoteStatus, setValidation, toggleUser } from "@/lib/demo/actions";
import { ADM_ROLES, CANCEL_WHY, DECISIONS, DOCS, PACK_RATE, REJ, ROLES, SITU, STAGES, V2, fcfa, fdate, fdt } from "@/lib/demo/consts";
import { DAY, iso, today } from "@/lib/demo/dates";
import { Ic } from "@/lib/demo/icons";
import { MODES, TYPES, f1, isMine, nrev, sc10 } from "@/lib/demo/props";
import { logAct, mutate, notify, notifyAdmins, type Demo, type Prop, type Req, type User } from "@/lib/demo/store";
import { QUART } from "@/lib/demo/svg";
import { buildZip, saveFile } from "@/lib/demo/export";
import { openModal, toast } from "@/lib/demo/ui";
import { AdminCases, LitigesTab, can, litigesBadge, reportReview } from "./litiges";
import { Code, Due, Empty, Kpi, Note, Pill, RPill, StatusBanner, Table, Track } from "./common";
import { EHead, useTab } from "./espace-view";

const wa = (tel: string, txt: string) => `https://wa.me/237${String(tel || "").replace(/\D/g, "").slice(-9)}?text=${encodeURIComponent(txt)}`;
const titleOf = (S: Demo, ref: string) => S.props.find((p) => p.ref === ref)?.title ?? ref;

/** Export ZIP réservé à l'administration et au pôle juridique. */
function doExport(S: Demo, kind: "dossier" | "locataire" | "bien" | "liste", key: string, rf = "") {
  if (!(S.user && (S.user.role === "admin" || S.user.role === "legal"))) return toast("Export réservé à l'administration et au pôle juridique.");
  let list: Req[] = [], name = "", label = "";
  if (kind === "dossier") { list = S.requests.filter((x) => x.code === key); name = "dossier_" + key; label = "un dossier"; }
  else if (kind === "locataire") { list = S.requests.filter((x) => x.by === key); name = "locataire_" + key.split("@")[0]; label = "dossiers d'un locataire"; }
  else if (kind === "bien") { list = S.requests.filter((x) => x.ref === key); name = "bien_" + key; label = "dossiers d'un bien"; }
  else { list = key === "admin" ? S.requests.filter((r) => !rf || r.status === rf) : key === "file" ? S.requests.filter((r) => r.status === "en attente") : S.requests.filter((r) => r.status !== "en attente"); name = "dossiers_" + (key === "admin" ? "liste" : key) + "_" + new Date().toISOString().slice(0, 10); label = "liste affichée"; }
  if (!list.length) return toast("Aucun dossier à exporter.");
  saveFile(name + ".zip", buildZip(S, list, label));
  mutate((s) => logAct(s, `Export ZIP de ${list.length} dossier(s) (${label})`));
  toast(`Export prêt : ${list.length} dossier(s).`);
}
const ExpRow = ({ S, r }: { S: Demo; r: Req }) => (
  <div className="acts exp"><span className="small muted">Exporter (ZIP) :</span>
    <button className="btn ghost sm" onClick={() => doExport(S, "dossier", r.code)}>Ce dossier</button>
    <a className="btn ghost sm" href={`/imprimer/dossier/${r.code}`} target="_blank" rel="noreferrer">Fiche à imprimer</a>
    <button className="btn ghost sm" onClick={() => doExport(S, "locataire", r.by)}>Tous les dossiers du locataire</button>
    <button className="btn ghost sm" onClick={() => doExport(S, "bien", r.ref)}>Tous les dossiers du bien</button></div>
);
const Dl = ({ items }: { items: [string, ReactNode][] }) => <div className="dl">{items.map(([a, b]) => <div key={a}><span>{a}</span><b>{b}</b></div>)}</div>;
const Bars = ({ items }: { items: [string, number, string?][] }) => { const mx = Math.max(1, ...items.map((x) => x[1])); return <div className="hbars">{items.map(([l, v, t]) => <div key={l} className="hbar"><span className="small" title={t}>{l}</span><div className="tr"><i style={{ width: `${(v / mx) * 100}%` }} /></div><b>{v}</b></div>)}</div>; };
function Stack({ list }: { list: Prop[] }) {
  const n = list.length || 1, a = list.filter((p) => p.status === "libre").length, b = list.filter((p) => p.status === "réservé").length, o = list.filter((p) => p.status === "occupé").length;
  return (<><div className="stack" role="img" aria-label={`${a} libres, ${b} réservés, ${o} occupés`}><i style={{ width: `${(a / n) * 100}%`, background: "var(--ok)" }} /><i style={{ width: `${(b / n) * 100}%`, background: "var(--gold)" }} /><i style={{ width: `${(o / n) * 100}%`, background: "var(--bad)" }} /></div>
    <div className="row between small"><span>{a} libre{a > 1 ? "s" : ""}</span><span>{b} réservé{b > 1 ? "s" : ""}</span><span>{o} occupé{o > 1 ? "s" : ""}</span></div></>);
}

/* ---------- rejet d'un dossier (motif obligatoire) ---------- */
function RejectModal({ S, code, onClose }: { S: Demo; code: string; onClose: () => void }) {
  const r = S.requests.find((x) => x.code === code);
  const [why, setWhy] = useState(""), [note, setNote] = useState("");
  if (!r) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!why) return toast("Choisissez un motif de rejet.");
    if (why === "Autre motif" && note.length < 5) return toast("Précisez le motif (5 caractères minimum).");
    decideRequest(code, "refusée", why, note); toast(`Dossier ${code} rejeté. Le motif a été transmis au demandeur.`); onClose();
  };
  return (
    <ModalFrame label={`Rejeter le dossier ${code}`} narrow onClose={onClose}>
      <div style={{ padding: 28, display: "grid", gap: 14 }}>
        <div><div className="eyebrow">Dossier {code}</div><h2 style={{ marginTop: 6 }}>Rejeter le dossier</h2><p className="small muted" style={{ marginTop: 6 }}>{r.name} · {titleOf(S, r.ref)}</p></div>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <label className="f">Motif du rejet<select value={why} onChange={(e) => setWhy(e.target.value)} required><option value="">Choisir un motif…</option>{REJ.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="f">Précision pour le demandeur (facultative, obligatoire si « Autre motif »)<textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={3} placeholder="Ex. : l'attestation de travail est périmée." /></label>
          <Note>Le motif est transmis au demandeur par notification et par message, et enregistré dans l&apos;historique.</Note>
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}><button type="button" className="btn ghost" onClick={onClose}>Annuler</button><button className="btn bad" type="submit">Confirmer le rejet</button></div>
        </form>
      </div>
    </ModalFrame>
  );
}

/* ---------- pôle juridique ---------- */
const LTABS = ["file", "commission", "traites"] as const;
export function LegalSpace({ S, u }: { S: Demo; u: User }) {
  const [tab, setTab] = useTab<(typeof LTABS)[number]>(LTABS);
  const [cur, setCur] = useState("");
  const [rej, setRej] = useState<string | null>(null);
  const Q = S.requests.filter((r) => r.status === "en attente").sort((a, b) => a.t - b.t);
  const F = S.props.filter((p) => p.validation === "validé" && p.type === "Fonds de commerce");
  const done = S.requests.filter((r) => r.status !== "en attente");
  const sel = Q.find((r) => r.code === cur) ?? Q[0];
  const tabs = [["file", "File d'étude", Q.length, 1], ["commission", "Commission d'attribution", F.length], ["traites", "Dossiers traités", done.length]] as const;
  return (
    <>
      <EHead u={u} tabs={tabs} value={tab} onChange={setTab} />
      {tab === "file" && (Q.length ? (
        <div className="split">
          <div className="list">
            <div className="lh"><div style={{ display: "grid", gap: 8, width: "100%" }}><b className="small">{Q.length} dossier(s) à étudier, du plus ancien au plus récent</b><button className="btn ghost sm" onClick={() => doExport(S, "liste", "file")}>Exporter la file (ZIP)</button></div></div>
            {Q.map((r) => <button key={r.code} className="li" onClick={() => setCur(r.code)} aria-current={sel?.code === r.code}><span className="av">{r.name[0]}</span><span><b>{r.name}</b><small>{r.ref} · {r.situation || "—"}</small></span><Due t={r.t} /></button>)}
          </div>
          {sel && <LegalDetail S={S} r={sel} onReject={() => setRej(sel.code)} />}
        </div>
      ) : <Empty>Aucun dossier en attente. Bon travail.</Empty>)}
      {tab === "commission" && (
        <>
          <p className="muted" style={{ marginBottom: 16 }}>Les cessions et locations-gérances de fonds de commerce passent en commission d&apos;attribution après évaluation contradictoire.</p>
          <div className="sim3">
            {F.map((p) => {
              const r = S.requests.find((x) => x.ref === p.ref && x.status === "en attente");
              return (
                <div key={p.ref} className="icard">
                  <div className="row between"><b>{p.title}</b><Pill s={p.status} /></div>
                  <div className="small muted">{p.ref} · {p.q} · {p.mode} · {fcfa(p.price)}</div>
                  <div className="small"><b>Éléments corporels :</b> matériel, agencement, stock.<br /><b>Éléments incorporels :</b> clientèle, enseigne, droit au bail.</div>
                  {r ? <><div className="small">Candidat : <b>{r.name}</b> <Due t={r.t} /></div><div className="acts"><button className="btn ok sm" onClick={() => decideRequest(r.code, "validée")}>Avis favorable</button><button className="btn bad sm" onClick={() => setRej(r.code)}>Avis défavorable</button></div></>
                    : <div className="small muted">Aucun candidat pour l&apos;instant.</div>}
                </div>
              );
            })}
          </div>
        </>
      )}
      {tab === "traites" && <><div className="acts" style={{ marginBottom: 14 }}><button className="btn ghost sm" onClick={() => doExport(S, "liste", "traites")}>Exporter les dossiers traités (ZIP)</button></div><Table head={["Code", "Bien", "Demandeur", "Situation", "Décision", "Motif", "Étape"]} empty="Aucun dossier traité."
        rows={done.map((r) => [<Code key="c">{r.code}</Code>, r.ref, r.name, r.situation || "—", <RPill key="s" s={r.status} />, r.status === "refusée" ? r.reason || "—" : "—", STAGES[r.stage ?? 0]])} /></>}
      {rej && <RejectModal S={S} code={rej} onClose={() => setRej(null)} />}
    </>
  );
}

function LegalDetail({ S, r, onReject }: { S: Demo; r: Req; onReject: () => void }) {
  const p = S.props.find((x) => x.ref === r.ref);
  const price = p?.price ?? 0, mode = p?.mode ?? "";
  const need = SITU[r.situation ?? "CDI"] ?? SITU.CDI, checks = r.checks ?? {};
  const income = (r.rev ?? 0) + (r.garant ? r.grev ?? 0 : 0), cap = income / 3;
  const ok = mode === "Vente" || mode === "Saisonnière" || price <= cap;
  const nok = need.filter((k) => checks[k]).length;
  return (
    <div className="detail">
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div><span className="small muted">Dossier {r.code}</span><h2>{r.name}</h2><div className="small muted">{p?.title ?? r.ref} · {r.ref}</div></div>
        <span className="row" style={{ gap: 8 }}><RPill s={r.status} /><Due t={r.t} /></span>
      </div>
      <Dl items={[["Situation", r.situation || "—"], ["Revenu net mensuel", r.rev ? fcfa(r.rev) : "—"], ["Garant", r.garant ? "Oui" + (r.grev ? " · " + fcfa(r.grev) : "") : "Non"], ["Loyer ou prix", fcfa(price)], ["Date souhaitée", fdate(r.date)], ["Téléphone", r.phone]]} />
      <div className={`verdict ${ok ? "" : "no"}`}>{mode === "Vente" ? "Vente : contrôle des fonds et du financement." : mode === "Saisonnière" ? "Séjour court : caution à l'arrivée, pièces d'identité." : ok ? `Solvabilité conforme : capacité ${fcfa(cap)} pour ${fcfa(price)}.` : `Solvabilité insuffisante : capacité ${fcfa(cap)} pour ${fcfa(price)}.`}</div>
      <div><b className="small">Pièces ({nok}/{need.length})</b>
        {need.map((k) => <label key={k} className="chk"><input type="checkbox" checked={!!checks[k]} onChange={(e) => checkPiece(r.code, k, e.target.checked)} /> {DOCS[k]}</label>)}
        <label className="chk"><input type="checkbox" checked={!!checks.bailleur} onChange={(e) => checkPiece(r.code, "bailleur", e.target.checked)} /> Ancien bailleur contacté</label></div>
      {r.note && <div className="small"><b>Message du demandeur :</b> {r.note}</div>}
      <label className="f">Notes privées<textarea key={r.code} defaultValue={S.notes[r.code] ?? ""} onBlur={(e) => saveNote(r.code, e.target.value)} placeholder="Visibles par l'équipe Immo Bell uniquement" /></label>
      <ExpRow S={S} r={r} />
      <div className="acts">
        <button className="btn ok" onClick={() => decideRequest(r.code, "validée")} disabled={nok < need.length} title={nok < need.length ? "Toutes les pièces doivent être cochées" : undefined}>Accepter le dossier</button>
        <button className="btn ghost" onClick={() => askDocument(r.code)}>Demander une pièce</button>
        <button className="btn bad" onClick={onReject}>Rejeter le dossier</button>
        <a className="btn wa" href={wa(r.phone, `Bonjour ${r.name}, ici le pôle juridique Immo Bell au sujet de votre demande ${r.code}.`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </div>
    </div>
  );
}

/* ---------- propriétaire ---------- */
const OTABS = ["dash", "cal", "biens", "recues", "avis", "releves", "nouveau", "litiges"] as const;
export function OwnerSpace({ S, u }: { S: Demo; u: User }) {
  const [tab, setTab] = useTab<(typeof OTABS)[number]>(OTABS);
  const [cancel, setCancel] = useState<string | null>(null);
  const [rep, setRep] = useState<string | null>(null);
  const mine = S.props.filter((p) => isMine(p, u.email));
  const ids = mine.map((p) => p.ref);
  const rq = S.requests.filter((r) => ids.includes(r.ref));
  const pend = mine.filter((p) => p.validation === "en attente");
  const revs = mine.flatMap((p) => (S.reviews[p.ref] ?? []).map((r, i) => [p, r, i] as const));
  const tabs = [["dash", "Tableau de bord"], ["cal", "Calendrier"], ["biens", "Mes biens", mine.length], ["recues", "Demandes reçues", rq.filter((r) => r.status === "en attente").length], ["avis", "Avis", revs.filter(([p, , i]) => !S.replies[p.ref + ":" + i]).length], ["releves", "Relevés"], ["nouveau", "Ajouter un bien"], ["litiges", "Litiges", litigesBadge(S, u.email), 1]] as const;
  const loc = mine.filter((p) => p.validation === "validé" && p.mode !== "Vente");
  const rented = loc.filter((p) => p.status !== "libre");
  const occ = loc.length ? Math.round((rented.length / loc.length) * 100) : 0;
  const month = iso(today()).slice(0, 7);
  const monthG = (p: Prop) => (p.mode === "Saisonnière" ? p.price * (S.cal[p.ref] ?? []).filter((d) => d.slice(0, 7) === month).length : p.status === "libre" ? 0 : p.price);
  const rate = (p: Prop) => PACK_RATE[p.pack ?? ""] ?? 0;
  const fee = (p: Prop) => { const g = monthG(p); return g * rate(p) + (p.pack === "Diaspora" && g ? 25000 : 0); };
  const gross = loc.reduce((s, p) => s + monthG(p), 0), fees = loc.reduce((s, p) => s + fee(p), 0);
  const cr = cancel ? S.requests.find((r) => r.code === cancel) : null;
  const router = useRouter();
  const shortP = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0).replace(".", ",") + " M" : n >= 1e3 ? Math.round(n / 1e3) + " k" : String(n));
  return (
    <>
      <EHead u={u} tabs={tabs} value={tab} onChange={setTab} />
      {tab === "dash" && (
        <>
          <div className="kpis">
            <Kpi label="Taux d'occupation" value={`${occ} %`} hint={`${rented.length} bien(s) loué(s) sur ${loc.length}`} />
            <Kpi label="Loyers du mois (estimés)" value={shortP(gross)} hint="FCFA, avant honoraires" color="var(--ok)" />
            <Kpi label="Net estimé" value={shortP(gross - fees)} hint="Après honoraires indicatifs" color="var(--ink)" />
            <Kpi label="Vues cumulées" value={mine.reduce((s, p) => s + p.views, 0)} hint="Toutes annonces" color="var(--accent)" />
            <Kpi label="Demandes en étude" value={rq.filter((r) => r.status === "en attente").length} hint="Traitées par Immo Bell" color="var(--bad)" onClick={() => setTab("recues")} />
          </div>
          {pend.length > 0 && <div className="verdict" style={{ background: "var(--warn-bg)", color: "var(--warn-t)", borderColor: "var(--warn)", marginBottom: 18 }}>{pend.length} bien(s) en attente de validation par l&apos;administrateur : {pend.map((p) => <span key={p.ref}>{p.title} <Due t={p.created} /> </span>)}</div>}
          <div className="two">
            <div className="box"><b>Vues par annonce</b><Bars items={[...mine].sort((a, b) => b.views - a.views).slice(0, 6).map((p) => [p.ref, p.views, p.title])} /></div>
            <div className="box"><b>Répartition de vos biens</b><Stack list={mine} />
              <div className="legend"><span><i style={{ background: "var(--ok)" }} />Libre</span><span><i style={{ background: "var(--gold)" }} />Réservé</span><span><i style={{ background: "var(--bad)" }} />Occupé</span></div>
              <p className="small muted">Le pack Diaspora inclut un rapport vidéo et une visioconférence chaque trimestre.</p>
              <button className="btn ghost sm" onClick={() => setTab("releves")} style={{ justifySelf: "start" }}>Voir les relevés</button></div>
          </div>
        </>
      )}
      {tab === "cal" && <OwnerCalendar S={S} mine={mine} />}
      {tab === "biens" && (
        <>
          <Table head={["Bien", "Validation", "Pack", "Disponibilité", "Vues", "Note", "Demandes", "Prix", "Visite 360°", "Diffusion", "Modifier"]} empty="Aucun bien enregistré."
            rows={mine.map((p) => [
              <span key="b"><b>{p.title}</b><br /><Code>{p.ref}</Code></span>, <Pill key="v" s={p.validation} />, p.pack || "Annonce seule",
              p.validation === "validé" ? <select key="a" style={{ width: "auto" }} value={p.status} aria-label={`Disponibilité de ${p.ref}`} onChange={(e) => setAvailability(p.ref, e.target.value as Prop["status"])}>{["libre", "réservé", "occupé"].map((x) => <option key={x}>{x}</option>)}</select> : <span key="a" className="muted small">Après validation</span>,
              p.views, nrev(S, p.ref) ? <span key="n" className="sb" style={{ minWidth: 30, height: 28, fontSize: ".8rem" }}>{f1(sc10(S, p.ref))}</span> : "—", S.requests.filter((r) => r.ref === p.ref).length,
              <input key="pr" inputMode="numeric" defaultValue={p.price} style={{ width: 130 }} aria-label={`Prix de ${p.ref}`} onBlur={(e) => { const v = parseInt(e.target.value.replace(/\D/g, ""), 10); if (v > 0 && v !== p.price) mutate((s) => { const q = s.props.find((x) => x.ref === p.ref); if (q) { q.price = v; logAct(s, `Prix de ${p.ref} : ${v}`); } }); }} />,
              <button key="t" className="btn ghost sm" onClick={() => openModal({ k: "tour", ref: p.ref })}>Gérer</button>,
              p.validation === "validé" ? <button key="d" className="btn sm" onClick={() => openModal({ k: "dif", ref: p.ref })}>Diffuser</button> : <span key="d" className="muted small">Après validation</span>,
              <button key="e" className="btn ghost sm" onClick={() => openModal({ k: "edit", ref: p.ref })}>Modifier</button>,
            ])} />
          <p className="note" style={{ marginTop: 14 }}>Le statut est visible par les visiteurs (vert : libre, rouge : occupé). Toute modification est consignée dans le journal.</p>
        </>
      )}
      {tab === "recues" && (
        <>
          <p className="note" style={{ marginBottom: 14 }}>Vous suivez les demandes. Immo Bell et le pôle juridique les traitent et vous informent de la décision.</p>
          <Table head={["Code", "Bien", "Demandeur", "Situation", "Avancement", "Statut", "Action"]} empty="Aucune demande reçue."
            rows={rq.map((r) => [<Code key="c">{r.code}</Code>, titleOf(S, r.ref), r.name, r.situation || "—", STAGES[r.stage ?? 0],
              <span key="s"><RPill s={r.status} />{r.status === "refusée" && <><br /><span className="small muted"><em style={{ fontStyle: "normal" }}>Motif :</em> {r.reason || "—"}</span></>}{r.status === "annulée" && r.cancel && <><br /><span className="small muted"><em style={{ fontStyle: "normal" }}>Annulée :</em> {r.cancel.why}</span></>}</span>,
              r.status === "validée" && (r.stage ?? 0) < 5 ? <button key="x" className="btn bad sm" onClick={() => setCancel(r.code)}>Annuler</button> : "—"])} />
        </>
      )}
      {tab === "avis" && (revs.length ? (
        <div className="revs" style={{ marginTop: 0 }}>
          {revs.map(([p, r, i]) => {
            const k = p.ref + ":" + i;
            return (
              <div key={k} className="rev2"><div className="rwho"><span className="av">{r.who[0]}</span><div><b>{r.who}</b><div className="small muted">{p.title} · {fdate(r.t)}</div></div><span className="sb" style={{ marginLeft: "auto", minWidth: 32, height: 32, fontSize: ".85rem" }}>{r.stars * 2}</span></div>
                <p className="small">« {r.text} »</p>
                {!r.removed && <button className="linkb small" onClick={() => setRep(k)}>Signaler ce commentaire</button>}
                {S.replies[k] ? <div className="reply"><b>Votre réponse :</b> {S.replies[k]}</div> : <ReplyForm k={k} />}</div>
            );
          })}
        </div>
      ) : <Empty>Aucun avis sur vos biens pour l&apos;instant.</Empty>)}
      {tab === "releves" && (
        <>
          <div className="box" style={{ marginBottom: 16 }}>
            <div className="row between"><b>Relevé de {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</b><button className="btn ghost sm" onClick={() => window.print()}>Imprimer</button></div>
            <Table head={["Bien", "Pack", "Loyers encaissés", "Honoraires", "Net reversé"]} empty=""
              rows={loc.length ? [...loc.map((p) => [<span key="b">{p.title}<br /><Code>{p.ref}</Code></span>, `${p.pack || "Annonce seule"}${rate(p) ? ` (${Math.round(rate(p) * 100)} %)` : ""}`, fcfa(monthG(p)), fcfa(fee(p)), <b key="n">{fcfa(monthG(p) - fee(p))}</b>]), [<b key="t">Total</b>, "", <b key="g">{fcfa(gross)}</b>, <b key="f">{fcfa(fees)}</b>, <b key="n">{fcfa(gross - fees)}</b>]] : []} />
          </div>
          <p className="note">Montants estimés à partir des statuts et des taux d&apos;honoraires indicatifs (Basic 8 %, Standard 12 %, Premium 18 %, Diaspora 18 % + 25 000 FCFA par mois), à confirmer avant le lancement. Les biens libres n&apos;encaissent rien.</p>
        </>
      )}
      {tab === "nouveau" && <OwnerForm u={u} done={() => setTab("biens")} />}
      {tab === "litiges" && <LitigesTab S={S} u={u} />}
      {cancel && cr && <CancelModal S={S} r={cr} onClose={() => setCancel(null)} />}
      {rep && <ReportModal k={rep} S={S} onClose={() => setRep(null)} />}
      <span hidden>{router ? "" : ""}</span>
    </>
  );
}

function OwnerCalendar({ S, mine }: { S: Demo; mine: Prop[] }) {
  const T = today(), days = Array.from({ length: 21 }, (_, i) => { const d = new Date(T); d.setDate(d.getDate() + i); return d.getTime(); });
  const toggle = (ref: string, k: string) => mutate((s) => { const a = (s.blocks[ref] = s.blocks[ref] ?? []); const i = a.indexOf(k); if (i >= 0) a.splice(i, 1); else a.push(k); logAct(s, `Calendrier ${ref} : nuit du ${k} ${i >= 0 ? "débloquée" : "bloquée"}`); });
  return (
    <>
      <p className="small muted" style={{ marginBottom: 12 }}>Trois semaines à venir. Pour les locations saisonnières, cliquez sur une nuit libre pour la bloquer ou la débloquer.</p>
      <div className="ocal"><table>
        <thead><tr><th className="bn">Bien</th>{days.map((t) => { const d = new Date(t); return <th key={t}>{d.toLocaleDateString("fr-FR", { weekday: "narrow" })}<br />{d.getDate()}</th>; })}</tr></thead>
        <tbody>{mine.filter((p) => p.validation === "validé").map((p) => (
          <tr key={p.ref}><th className="bn">{p.title.length > 26 ? p.title.slice(0, 25) + "…" : p.title}<br /><span className="small muted">{p.ref}</span></th>
            {days.map((t) => {
              const k = iso(t); let cl: string, lab: string;
              if (p.mode === "Saisonnière") { const bk = (S.cal[p.ref] ?? []).includes(k), bl = (S.blocks[p.ref] ?? []).includes(k); cl = bk ? "c-o" : bl ? "c-b" : "c-l"; lab = bk ? "réservé par un client" : bl ? "bloqué" : "libre"; }
              else { cl = p.status === "occupé" ? "c-o" : p.status === "réservé" ? "c-r" : "c-l"; lab = p.status; }
              return <td key={t}><button type="button" className={cl} disabled={!(p.mode === "Saisonnière" && cl !== "c-o")} onClick={() => toggle(p.ref, k)} aria-label={`${p.ref} ${fdate(t)} : ${lab}`} title={`${fdate(t)} : ${lab}`} /></td>;
            })}</tr>
        ))}</tbody>
      </table></div>
      <div className="legend"><span><i className="c-l" />Libre</span><span><i className="c-r" />Réservé (dossier en étude)</span><span><i className="c-o" />Occupé ou nuit réservée</span><span><i className="c-b" />Bloqué par vous</span></div>
    </>
  );
}

function OwnerForm({ u, done }: { u: User; done: () => void }) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget), v = (k: string) => String(f.get(k) ?? "").trim();
    let ref = "";
    mutate((s) => {
      const q = v("q"), pre = `IB-${q.slice(0, 3).toUpperCase()}-`;
      // Numéro tiré au hasard : le serveur voit aussi des biens que ce navigateur ne voit pas (en attente d'autres propriétaires).
      do ref = pre + String(100 + Math.floor(Math.random() * 900)); while (s.props.some((x) => x.ref === ref));
      s.props.push({ ref, title: v("title"), type: v("type"), mode: v("mode"), q, price: +v("price").replace(/\s/g, "") || 0, rooms: +v("rooms") || 0, surface: +v("surf") || 0, status: "libre", validation: "en attente", owner: u.email, pack: v("pack"), views: 0, h: Math.floor(Math.random() * 360), eq: v("eq").split(",").map((x) => x.trim()).filter(Boolean), desc: v("desc"), cond: v("cond") || "À préciser avec Immo Bell.", created: Date.now() });
      notifyAdmins(s, `Bien ${ref} soumis par ${u.name} : validation requise.`, "valid"); logAct(s, `Bien ${ref} soumis`);
    });
    toast(`Bien ${ref} soumis. Validation après étude de dossier sous 72 h.`); done();
  };
  return (
    <form className="panel" style={{ maxWidth: 760 }} onSubmit={submit}>
      <div className="note">Le bien sera visible après validation par l&apos;administrateur, sous 72 h. Les fonds de commerce sont acceptés.</div>
      <label className="f">Titre de l&apos;annonce<input name="title" required placeholder="Appartement 3 pièces, Bonanjo" /></label>
      <div className="cols2"><label className="f">Type<select name="type">{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label><label className="f">Opération<select name="mode">{MODES.map((t) => <option key={t}>{t}</option>)}</select></label></div>
      <div className="cols2"><label className="f">Quartier<select name="q">{Object.keys(QUART).map((t) => <option key={t}>{t}</option>)}</select></label><label className="f">Prix (FCFA)<input name="price" required inputMode="numeric" /></label></div>
      <div className="cols2"><label className="f">Pièces<input name="rooms" required inputMode="numeric" /></label><label className="f">Superficie (m²)<input name="surf" required inputMode="numeric" /></label></div>
      <label className="f">Pack de gestion Immo Bell<select name="pack"><option value="">Annonce seule</option><option>Basic</option><option>Standard</option><option>Premium</option><option>Diaspora</option></select></label>
      <label className="f">Équipements (séparés par des virgules)<input name="eq" placeholder="Climatisation, parking, gardien" /></label>
      <label className="f">Description<textarea name="desc" required /></label>
      <label className="f">Conditions du bailleur<textarea name="cond" placeholder="Dépôt de garantie, durée, pièces demandées" /></label>
      <label className="f">Photos réelles et documents de propriété<input type="file" multiple accept="image/*,.pdf" /></label>
      <button className="btn" type="submit">Soumettre pour validation</button>
    </form>
  );
}

function ReplyForm({ k }: { k: string }) {
  const [t, setT] = useState("");
  return (
    <form className="sendrow" onSubmit={(e) => { e.preventDefault(); mutate((s) => { s.replies[k] = t.trim(); }); }}>
      <label className="sr-only" htmlFor={`rp-${k}`}>Répondre</label>
      <input id={`rp-${k}`} value={t} onChange={(e) => setT(e.target.value)} required placeholder="Répondre publiquement" />
      <button className="btn sm" type="submit">Répondre</button>
    </form>
  );
}

function CancelModal({ S, r, onClose }: { S: Demo; r: Req; onClose: () => void }) {
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); cancelByOwner(r.code, String(f.get("why")), String(f.get("note"))); toast("Réservation annulée. Le locataire est prévenu."); onClose(); };
  return (
    <ModalFrame label={`Annuler la réservation ${r.code}`} narrow onClose={onClose}>
      <form onSubmit={submit} style={{ padding: 26, display: "grid", gap: 14 }}>
        <div><div className="eyebrow">Annuler une réservation</div><h2 style={{ marginTop: 6 }}>{r.code}</h2><p className="small muted">{titleOf(S, r.ref)} · {r.name}</p></div>
        <div className="verdict" style={{ background: "var(--warn-bg)", color: "var(--warn-t)", borderColor: "var(--warn)" }}><b>Ce qui se passe</b><span className="small">Le locataire est prévenu tout de suite avec votre motif. Le bien repasse « libre ». L&apos;administration est alertée et propose d&apos;autres biens au locataire. Il peut déclarer un litige. Les frais éventuels suivent votre convention de mandat.</span></div>
        <label className="f">Motif de l&apos;annulation<select name="why" required>{CANCEL_WHY.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="f">Précisions pour le locataire<textarea name="note" rows={3} maxLength={400} required placeholder="Expliquez simplement la situation" /></label>
        <label className="chk"><input type="checkbox" required /> Je confirme l&apos;annulation et je comprends qu&apos;elle est consignée.</label>
        <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}><button type="button" className="btn ghost" onClick={onClose}>Retour</button><button className="btn bad" type="submit">Annuler la réservation</button></div>
      </form>
    </ModalFrame>
  );
}

export function ReportModal({ k, S, onClose }: { k: string; S: Demo; onClose: () => void }) {
  const [ref, i] = k.split(":"), r = (S.reviews[ref] ?? [])[+i];
  if (!r) return null;
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); reportReview(k, String(f.get("why")), String(f.get("desc"))); toast("Signalement envoyé. Un administrateur va l'examiner."); onClose(); };
  return (
    <ModalFrame label="Signaler un commentaire" narrow onClose={onClose}>
      <form onSubmit={submit} style={{ padding: 26, display: "grid", gap: 14 }}>
        <div><div className="eyebrow">Signalement</div><h2 style={{ marginTop: 6 }}>Signaler un commentaire</h2></div>
        <blockquote className="small" style={{ borderLeft: "3px solid var(--gold)", paddingLeft: 12, margin: 0 }}>« {r.text} »<br /><span className="muted">{r.who} · {ref}</span></blockquote>
        <label className="f">Raison<select name="why">{["Propos injurieux ou diffamatoires", "Informations fausses", "Hors sujet ou publicité", "Conflit d'intérêts", "Autre"].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="f">Explication<textarea name="desc" rows={3} minLength={10} maxLength={600} required placeholder="Pourquoi ce commentaire pose problème" /></label>
        <Note>Le commentaire reste visible jusqu&apos;à la décision. Un administrateur examine le signalement et peut le retirer ou le maintenir.</Note>
        <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}><button type="button" className="btn ghost" onClick={onClose}>Annuler</button><button className="btn" type="submit">Envoyer le signalement</button></div>
      </form>
    </ModalFrame>
  );
}

/* ---------- administrateur ---------- */
const ATABS = ["dash", "valid", "dem", "urg", "devis", "avis", "comptes", "audit", "archive", "rapport", "cases", "presta", "equipe", "v2"] as const;
export function AdminSpace({ S, u }: { S: Demo; u: User }) {
  const [xv, setXv] = useState("Toutes");
  const [tab, setTab] = useTab<(typeof ATABS)[number]>(ATABS);
  const [rej, setRej] = useState<string | null>(null);
  const [cur, setCur] = useState("");
  const [rf, setRf] = useState("");
  const act = S.props.filter((p) => p.validation === "validé");
  const pend = S.requests.filter((r) => r.status === "en attente");
  const toVal = S.props.filter((p) => p.validation === "en attente");
  const urg = S.incidents.filter((i) => i.status !== "clôturé");
  const dv = S.quotes.filter((q) => q.status !== "signé");
  const conv = S.requests.length ? Math.round((S.requests.filter((r) => r.status === "validée").length / S.requests.length) * 100) : 0;
  const nCases = S.cases.filter((c) => !c.assignee && c.status !== "résolu").length;
  const nProv = S.providers.filter((p) => p.status === "en attente").length + S.quotes.filter((q) => q.status === "reçu" && !q.prest).length;
  const tabs = [["dash", "Tableau de bord"], ["valid", "Biens à valider", toVal.length, 1], ["dem", "Demandes", pend.length], ["urg", "Urgences", urg.length, 1], ["devis", "Devis", dv.length], ["avis", "Avis"], ["comptes", "Comptes"], ["audit", "Journal"], ["archive", "Archive"], ["rapport", "Rapport"], ["cases", "Litiges", nCases, 1], ["presta", "Prestataires", nProv], ...(can(u, "equipe") ? [["equipe", "Équipe"] as const] : []), ["v2", "Feuille V2"]] as const;
  const L = S.requests.filter((r) => !rf || r.status === rf);
  const sel = L.find((r) => r.code === cur) ?? L[0];
  const packs = act.filter((p) => p.pack && p.status !== "libre" && p.mode !== "Vente").reduce((s, p) => s + p.price * (PACK_RATE[p.pack ?? ""] ?? 0) + (p.pack === "Diaspora" ? 25000 : 0), 0);
  const wk = [3, 5, 4, 6, 4, S.requests.filter((r) => Date.now() - r.t < 7 * DAY).length], mw = Math.max(...wk);
  const rfc = (k: string) => S.requests.filter((r) => !k || r.status === k).length;
  return (
    <>
      <EHead u={u} tabs={tabs} value={tab} onChange={setTab} />
      {tab === "dash" && (
        <>
          <div className="kpis">
            <Kpi label="Biens actifs" value={act.length} hint="Publiés" color="var(--ink)" />
            <Kpi label="Demandes en attente" value={pend.length} hint="Ouvrir" color="var(--gold)" onClick={() => setTab("dem")} />
            <Kpi label="Biens à valider" value={toVal.length} hint="Ouvrir" color="var(--bad)" onClick={() => setTab("valid")} />
            <Kpi label="Urgences ouvertes" value={urg.length} hint="Ouvrir" color="var(--bad)" onClick={() => setTab("urg")} />
            <Kpi label="Devis en cours" value={dv.length} hint="Ouvrir" color="var(--accent)" onClick={() => setTab("devis")} />
            <Kpi label="Taux de conversion" value={`${conv} %`} hint="Ouvrir" color="var(--ok)" onClick={() => setTab("dem")} />
          </div>
          <div className="two">
            <div className="box"><b>Demandes reçues par semaine</b><div className="vbars">{wk.map((v, i) => <div key={i}><i style={{ height: `${(v / mw) * 100}%` }} /><span>{i === 5 ? "Cette sem." : "S-" + (5 - i)}</span></div>)}</div></div>
            <div className="box"><b>Disponibilité du parc</b><Stack list={act} /><b style={{ marginTop: 8 }}>Honoraires mensuels estimés (packs)</b><div className="price num">{fcfa(packs)}</div><p className="small muted">Sur la base des taux indicatifs, biens loués uniquement.</p></div>
          </div>
          <div className="two" style={{ marginTop: 18 }}>
            <div className="box"><b>Biens les plus consultés</b><Bars items={[...act].sort((a, b) => b.views - a.views).slice(0, 6).map((p) => [p.ref, p.views, p.title])} /></div>
            <div className="box"><b>Échéances 72 h</b>
              {pend.length || toVal.length ? [...pend.map((r) => [r.code, r.name, r.t, "dem"] as const), ...toVal.map((p) => [p.ref, p.title, p.created, "valid"] as const)].sort((a, b) => a[2] - b[2]).map(([k, n, t, to]) => (
                <button key={k} className="li" onClick={() => setTab(to)}><span className="av">{n[0]}</span><span><b>{n}</b><small>{k}</small></span><Due t={t} /></button>
              )) : <p className="small muted">Rien en attente.</p>}</div>
          </div>
        </>
      )}
      {tab === "valid" && (
        <>
          <p className="note" style={{ marginBottom: 14 }}>Validation après étude de dossier sous 72 h : photos réelles, documents de propriété, conformité de l&apos;annonce.</p>
          <Table head={["Bien", "Propriétaire", "Soumis le", "Échéance", "Actions"]} empty="Aucun bien en attente de validation."
            rows={toVal.map((p) => [<span key="b"><b>{p.title}</b><br /><Code>{p.ref}</Code> <span className="small muted">{p.type} · {p.q} · {fcfa(p.price)}</span></span>, p.owner === "demo" ? "Mme Ngo Bell" : p.owner, fdt(p.created), <Due key="d" t={p.created} />,
              <div key="a" className="row"><button className="btn ok sm" onClick={() => setValidation(p.ref, "validé")}>Valider</button><button className="btn bad sm" onClick={() => setValidation(p.ref, "refusé")}>Refuser</button></div>])} />
          <h3 style={{ margin: "28px 0 12px" }}>Conformité des annonces publiées</h3>
          <Table head={["Bien", "Statut", "Note", "Action"]} empty=""
            rows={act.map((p) => [<span key="b">{p.title} <Code>{p.ref}</Code></span>, <Pill key="s" s={p.status} />, nrev(S, p.ref) ? f1(sc10(S, p.ref)) : "—",
              <div key="a" className="row"><button className="btn sm" onClick={() => openModal({ k: "dif", ref: p.ref })}>Diffuser</button><button className="btn ghost sm" onClick={() => openModal({ k: "tour", ref: p.ref })}>Visite 360°</button><button className="btn bad sm" onClick={() => setValidation(p.ref, "archivé")}>Archiver</button></div>])} />
        </>
      )}
      {tab === "dem" && (
        <div className="split">
          <div className="list">
            <div className="lh"><div style={{ display: "grid", gap: 8, width: "100%" }}><b className="small">{L.length} dossier(s) affiché(s)</b>
              <div className="seg rfbar" role="group" aria-label="Filtrer par statut">{[["", "Tous"], ["en attente", "En cours d'analyse"], ["validée", "Acceptés"], ["refusée", "Rejetés"]].map(([k, l]) => <button key={k} onClick={() => setRf(k)} aria-pressed={rf === k}>{l} <b>{rfc(k)}</b></button>)}</div>
              {L.length ? null : <span className="small muted">Aucun dossier avec ce statut.</span>}{L.length ? <button className="btn ghost sm" onClick={() => doExport(S, "liste", "admin", rf)}>Exporter la liste ({L.length}) en ZIP</button> : null}</div></div>
            {L.map((r) => <button key={r.code} className="li" onClick={() => setCur(r.code)} aria-current={sel?.code === r.code}><span className="av">{r.name[0]}</span><span><b>{r.name}</b><small>{r.code} · {r.ref}</small></span>{r.status === "en attente" ? <Due t={r.t} /> : <RPill s={r.status} />}</button>)}
          </div>
          {sel && (
            <div className="detail">
              <div className="row between"><div><span className="small muted">{sel.code}</span><h2>{sel.name}</h2><div className="small muted">{titleOf(S, sel.ref)}</div></div><RPill s={sel.status} /></div>
              {sel.status === "refusée" ? null : <Track k={sel.stage ?? 0} />}
              <Dl items={[["Téléphone", sel.phone], ["Situation", sel.situation || "—"], ["Revenu", sel.rev ? fcfa(sel.rev) : "—"], ["Date souhaitée", fdate(sel.date)], ["Analyste", "Me Ekwalla"], ["Reçue le", fdt(sel.t)]]} />
              {sel.note && <p className="small"><b>Message :</b> {sel.note}</p>}
              {(sel.status === "validée" || sel.status === "refusée") && <StatusBanner r={sel} />}
              <ExpRow S={S} r={sel} />
              <div className="acts">
                {sel.status === "en attente" && <><button className="btn ok" onClick={() => decideRequest(sel.code, "validée")}>Accepter le dossier</button><button className="btn bad" onClick={() => setRej(sel.code)}>Rejeter le dossier</button></>}
                {sel.status === "validée" && (sel.stage ?? 0) < 5 && <button className="btn" onClick={() => nextStage(sel.code)}>Passer à « {STAGES[(sel.stage || 3) + 1]} »</button>}
                <a className="btn wa" href={wa(sel.phone, `Bonjour ${sel.name}, Immo Bell au sujet de votre demande ${sel.code}.`)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === "avis" && <Table head={["Bien", "Auteur", "Note", "Avis", "Action"]} empty="Aucun avis à modérer." rows={Object.entries(S.reviews).flatMap(([ref, a]) => a.map((x, i) => [<Code key="r">{ref}</Code>, x.who, <span key="n" className="sb" style={{ minWidth: 30, height: 28, fontSize: ".8rem" }}>{x.stars * 2}</span>, x.text, <button key="b" className="btn bad sm" onClick={() => removeReview(ref, i)}>Supprimer</button>]))} />}
      {tab === "urg" && <Table head={["Code", "Nature / niveau", "Bien", "Description", "Statut", "Action"]} empty="Aucun signalement."
        rows={S.incidents.map((i) => [<Code key="c">{i.code}</Code>, <span key="n">{i.type}<br /><span className={`lvl ${i.level === "Urgent" ? "" : i.level === "Sous 24 h" ? "m" : "l"}`}>{i.level}</span></span>, i.ref, i.desc,
          <span key="s"><Pill s={i.status} />{i.prest && <><br /><span className="small muted">{i.prest}</span></>}</span>,
          i.status === "reçu" ? <button key="a" className="btn ok sm" onClick={() => advanceIncident(i.code, "dispatché")}>Dispatcher</button> : i.status === "clôturé" ? <span key="a" className="small muted">{i.rapport || "Rapport transmis"}</span> : <span key="a" className="small muted">Chez le prestataire</span>])} />}
      {tab === "devis" && <Table head={["Code", "Prestation", "Trajet", "Date", "Statut", "Action"]} empty="Aucune demande de devis."
        rows={S.quotes.map((q) => [<Code key="c">{q.code}</Code>, <span key="p">{q.type}<br /><span className="small muted">{q.note}</span></span>, `${q.from} vers ${q.to}`, fdate(q.date), <Pill key="s" s={q.status} />,
          q.status === "reçu" ? <button key="a" className="btn ok sm" onClick={() => setQuoteStatus(q.code, "devis envoyé")}>Envoyer le devis</button> : q.status === "devis envoyé" ? <button key="a" className="btn sm" onClick={() => setQuoteStatus(q.code, "signé")}>Devis signé</button> : <span key="a" className="muted small">Engagement suivi</span>])} />}
      {tab === "comptes" && <Table head={["Nom", "Email", "Rôle", "Statut", "Action"]} empty=""
        rows={S.users.map((x) => [x.name, x.email, ROLES[x.role] ?? x.role, <Pill key="s" s={x.status ?? "actif"} />, <button key="a" className="btn ghost sm" onClick={() => toggleUser(x.email)}>{x.status === "actif" ? "Suspendre" : "Réactiver"}</button>])} />}
      {tab === "audit" && <Table head={["Date", "Auteur", "Action"]} empty="Journal vide." rows={S.audit.slice(0, 60).map((a) => [fdt(a.t), a.who, a.act])} />}
      {tab === "archive" && (
        <>
          <Table head={["Bien", "État"]} empty="Aucun bien archivé." rows={S.props.filter((p) => ["refusé", "archivé"].includes(p.validation)).map((p) => [<span key="b">{p.title} <Code>{p.ref}</Code></span>, <Pill key="s" s={p.validation} />])} />
          <h3 style={{ margin: "24px 0 12px" }}>Demandes refusées</h3>
          <Table head={["Code", "Bien", "Demandeur"]} empty="Aucune demande refusée." rows={S.requests.filter((r) => r.status === "refusée").map((r) => [r.code, r.ref, r.name])} />
        </>
      )}
      {tab === "rapport" && <Rapport S={S} act={act} toVal={toVal} pend={pend} urg={urg} dv={dv} conv={conv} />}
      {tab === "cases" && <><AsBar S={S} u={u} /><AdminCases S={S} u={u} /></>}
      {tab === "presta" && <><AsBar S={S} u={u} /><AdminPresta S={S} u={u} /></>}
      {tab === "equipe" && <><AsBar S={S} u={u} /><AdminTeam S={S} u={u} /></>}
      {tab === "v2" && (
        <>
          <p className="muted" style={{ maxWidth: "66ch", marginBottom: 14 }}>On ne peut pas penser à tout d&apos;un coup : voici ce que la version 1 prépare et ce que la version 2 ajoutera, classé par priorité.</p>
          <div className="chips" role="group" aria-label="Priorité">{["Toutes", "Haute", "Moyenne", "Basse"].map((k) => <button key={k} className="chip" aria-pressed={xv === k} onClick={() => setXv(k)}>{k}</button>)}</div>
          <div className="mini" style={{ marginTop: 14 }}>{V2.filter((v) => xv === "Toutes" || v[1] === xv).map(([c, p, t, d]) => <div key={t}><div className="row between"><span className="eyebrow">{c}</span><span className={`pill ${p === "Haute" ? "refusé" : p === "Moyenne" ? "réservé" : "à-préparer"}`}>{p}</span></div><h3>{t}</h3><p className="muted small">{d}</p></div>)}</div>
          <h2 style={{ fontSize: "1.1rem", margin: "26px 0 10px" }}>Décisions à prendre avec l&apos;équipe</h2>
          <ol className="xdec">{DECISIONS.map((d) => <li key={d}>{d}</li>)}</ol>
        </>
      )}
      {rej && <RejectModal S={S} code={rej} onClose={() => setRej(null)} />}
    </>
  );
}


/** Démonstration : agir sous l'identité d'un autre administrateur pour voir les droits de chaque rôle. */
function AsBar({ S, u }: { S: Demo; u: User }) {
  const A = S.users.filter((a) => a.role === "admin" && a.status === "actif");
  return (
    <div className="xas"><label htmlFor="xas" className="small"><b>Agir en tant que</b> <span className="muted">(démonstration : changez d&apos;administrateur pour voir les droits de chaque rôle)</span></label>
      <select id="xas" value={u.email} onChange={(e) => mutate((s) => { const a = s.users.find((x) => x.email === e.target.value); if (a) s.user = { name: a.name, email: a.email, phone: "", role: "admin", arole: a.arole, status: "actif" }; })}>
        {A.map((a) => <option key={a.email} value={a.email}>{a.name} · {ADM_ROLES[a.arole ?? "super"].n}</option>)}
      </select></div>
  );
}

function Rapport({ S, act, toVal, pend, urg, dv, conv }: { S: Demo; act: Prop[]; toVal: Prop[]; pend: Req[]; urg: unknown[]; dv: unknown[]; conv: number }) {
  const t = `RAPPORT D'ACTIVITÉ IMMO BELL — ${fdate(Date.now())}\nBiens actifs : ${act.length}\nBiens en attente de validation : ${toVal.length}\nDemandes : ${S.requests.length} (en attente : ${pend.length})\nTaux de conversion : ${conv} %\nVues cumulées : ${act.reduce((s, p) => s + p.views, 0)}\nBiens libres : ${act.filter((p) => p.status === "libre").length} | réservés : ${act.filter((p) => p.status === "réservé").length} | occupés : ${act.filter((p) => p.status === "occupé").length}\nUrgences ouvertes : ${urg.length} | Devis en cours : ${dv.length}`;
  return (
    <>
      <textarea id="rep" readOnly rows={9} aria-label="Rapport" value={t} />
      <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={() => navigator.clipboard?.writeText(t).then(() => toast("Rapport copié."))}>Copier le rapport</button></div>
    </>
  );
}

const METIERS = ["Déménagement / aménagement", "Assainissement", "Plomberie", "Électricité", "Jardinage", "BTP"];
function AdminPresta({ S, u }: { S: Demo; u: User }) {
  const P = S.providers, Q = S.quotes.filter((q) => q.status === "reçu" && !q.prest), ok = can(u, "presta");
  const [pick, setPick] = useState<Record<string, string>>({});
  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (!ok) return toast("Votre rôle ne permet pas cette action.");
    const f = new FormData(e.currentTarget), v = (k: string) => String(f.get(k) ?? "").trim(), email = v("email").toLowerCase();
    if (S.users.some((x) => x.email === email)) return toast("Cette adresse est déjà utilisée.");
    mutate((s) => {
      const id = "P" + (s.providers.length + 1 + Math.floor(Math.random() * 90));
      s.providers.push({ id, name: v("name"), metier: v("metier"), zone: v("zone"), phone: v("phone"), email, status: "agréé", dispo: "disponible", tarif: "", t: Date.now() });
      s.users.push({ name: v("name"), email, role: "provider", status: "actif" });
      logAct(s, `Ajout du prestataire ${v("name")} (${v("metier")})`);
    });
    e.currentTarget.reset(); toast("Prestataire ajouté. Une invitation de connexion lui est envoyée (démonstration).");
  };
  const act = (id: string, st: string) => ok && mutate((s) => {
    const p = s.providers.find((x) => x.id === id); if (!p) return;
    p.status = st; const us = s.users.find((x) => x.email === p.email); if (us) us.status = st === "suspendu" ? "suspendu" : "actif";
    logAct(s, `Prestataire ${p.name} : ${st}`);
  });
  const assign = (code: string, id: string) => ok && id && mutate((s) => {
    const q = s.quotes.find((x) => x.code === code), p = s.providers.find((x) => x.id === id); if (!q || !p) return;
    q.prest = p.id; q.prestEmail = p.email; q.status = "attribué";
    notify(s, p.email, `Nouvelle demande de devis ${q.code} (${q.type}).`); notify(s, q.by, `Votre demande ${q.code} est confiée à ${p.name}. Vous recevrez son devis ici.`);
    logAct(s, `Devis ${q.code} attribué à ${p.name}`);
  });
  return (
    <>
      <div className="two">
        <form className="box" onSubmit={add}><b>Ajouter un prestataire</b><p className="small muted">L&apos;administration contrôle et agrée chaque prestataire. Il reçoit un accès à son espace et ne voit que les demandes qui lui sont attribuées.</p>
          <label className="f">Nom ou raison sociale<input name="name" required maxLength={60} /></label>
          <div className="cols2"><label className="f">Activité<select name="metier">{METIERS.map((m) => <option key={m}>{m}</option>)}</select></label><label className="f">Téléphone<input name="phone" inputMode="tel" required /></label></div>
          <label className="f">E-mail (identifiant de connexion)<input name="email" type="email" required /></label>
          <label className="f">Zones d&apos;intervention<input name="zone" required placeholder="Bonanjo, Akwa…" /></label>
          <button className="btn" type="submit" disabled={!ok}>Ajouter et inviter</button>{!ok && <p className="small muted">Votre rôle ne permet pas d&apos;ajouter un prestataire.</p>}</form>
        <div className="box"><b>Demandes de devis à attribuer</b>
          {Q.length ? <div style={{ display: "grid", gap: 10 }}>{Q.map((q) => {
            const m = /déménag/i.test(q.type) ? METIERS[0] : /assain/i.test(q.type) ? METIERS[1] : METIERS.find((x) => x === q.type);
            const opts = P.filter((p) => p.status === "agréé" && (!m || p.metier === m)), val = pick[q.code] ?? opts[0]?.id ?? "";
            return (
              <div key={q.code} className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 170 }}><Code>{q.code}</Code> <b className="small">{q.type}{q.pack ? " · " + q.pack : ""}</b><div className="small muted">{q.from}{q.to ? " → " + q.to : ""} · {q.date}</div></div>
                <select value={val} onChange={(e) => setPick({ ...pick, [q.code]: e.target.value })} aria-label={`Prestataire pour ${q.code}`}>{opts.length ? opts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>) : <option value="">Aucun prestataire agréé</option>}</select>
                <button className="btn sm" disabled={!opts.length || !ok} onClick={() => { assign(q.code, val); toast("Demande attribuée."); }}>Attribuer</button>
              </div>
            );
          })}</div> : <p className="small muted">Aucune demande en attente d&apos;attribution.</p>}</div>
      </div>
      <h2 style={{ fontSize: "1.1rem", margin: "22px 0 10px" }}>Prestataires ({P.length})</h2>
      <Table head={["Nom", "Activité", "Zones", "Contact", "Statut", "Action"]} empty="Aucun prestataire."
        rows={P.map((p) => [<b key="n">{p.name}</b>, p.metier, p.zone, <span key="c">{p.phone}<br /><span className="small muted">{p.email}</span></span>,
          <span key="s" className={`pill ${p.status === "agréé" ? "validé" : p.status === "suspendu" ? "refusé" : "réservé"}`}>{p.status === "agréé" ? "Agréé" : p.status === "suspendu" ? "Suspendu" : "En attente"}</span>,
          ok ? (p.status === "agréé" ? <button key="a" className="btn ghost sm" onClick={() => act(p.id, "suspendu")}>Suspendre</button> : <button key="a" className="btn sm" onClick={() => act(p.id, "agréé")}>{p.status === "en attente" ? "Agréer" : "Réactiver"}</button>) : "—"])} />
    </>
  );
}

function AdminTeam({ S, u }: { S: Demo; u: User }) {
  const A = S.users.filter((x) => x.role === "admin");
  const [jr, setJr] = useState("");
  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget), v = (k: string) => String(f.get(k) ?? "").trim(), email = v("email").toLowerCase();
    if (S.users.some((x) => x.email === email)) return toast("Cette adresse est déjà utilisée.");
    mutate((s) => { s.users.push({ name: v("name"), email, role: "admin", arole: v("role"), status: "actif" }); logAct(s, `Ajout de l'administrateur ${v("name")} (${ADM_ROLES[v("role")].n})`); });
    e.currentTarget.reset(); toast("Administrateur ajouté. Une invitation lui est envoyée (démonstration).");
  };
  const setRole = (email: string, arole: string) => mutate((s) => { const a = s.users.find((x) => x.email === email); if (a) { a.arole = arole; logAct(s, `Rôle de ${a.name} : ${ADM_ROLES[arole].n}`); } });
  return (
    <>
      <div className="two">
        <form className="box" onSubmit={add}><b>Ajouter un administrateur</b>
          <label className="f">Nom<input name="name" required maxLength={60} /></label><label className="f">E-mail<input name="email" type="email" required /></label>
          <label className="f">Rôle<select name="role" defaultValue="moderateur">{Object.entries(ADM_ROLES).map(([k, r]) => <option key={k} value={k}>{r.n}</option>)}</select></label>
          <button className="btn" type="submit">Ajouter et inviter</button><p className="note">Le journal enregistre chaque action sous le nom de l&apos;administrateur qui l&apos;a faite.</p></form>
        <div className="box"><b>Rôles et droits</b>{Object.values(ADM_ROLES).map((r) => <div key={r.n}><b className="small">{r.n}</b><div className="small muted">{r.d}</div></div>)}</div>
      </div>
      <h2 style={{ fontSize: "1.1rem", margin: "22px 0 10px" }}>Équipe ({A.length})</h2>
      <Table head={["Nom", "E-mail", "Rôle", "Statut", "Actions consignées", "Gérer"]} empty="Aucun administrateur."
        rows={A.map((a) => [<b key="n">{a.name}</b>, a.email,
          <select key="r" value={a.arole ?? "super"} disabled={a.email === u.email} onChange={(e) => setRole(a.email, e.target.value)} aria-label={`Rôle de ${a.name}`}>{Object.entries(ADM_ROLES).map(([k, r]) => <option key={k} value={k}>{r.n}</option>)}</select>,
          <Pill key="s" s={a.status ?? "actif"} />, <button key="j" className="linkb" onClick={() => setJr(a.email)}>{S.audit.filter((x) => x.by === a.email).length} action(s)</button>,
          a.email === u.email ? <span key="g" className="small muted">Vous</span> : <button key="g" className="btn ghost sm" onClick={() => toggleUser(a.email)}>{a.status === "actif" ? "Suspendre" : "Réactiver"}</button>])} />
      {jr ? <><h2 style={{ fontSize: "1.1rem", margin: "22px 0 10px" }}>Journal de {S.users.find((x) => x.email === jr)?.name ?? jr}</h2><Table head={["Date", "Action"]} empty="Aucune action consignée." rows={S.audit.filter((a) => a.by === jr).map((a) => [fdt(a.t), a.act])} /></> : <p className="small muted" style={{ marginTop: 12 }}>Cliquez sur le nombre d&apos;actions pour afficher le journal d&apos;un administrateur.</p>}
    </>
  );
}

void Ic;
