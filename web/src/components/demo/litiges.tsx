"use client";

import { useState, type FormEvent } from "react";
import { ModalFrame } from "@/components/shell/modal-host";
import { ADM_ROLES, OBJETS, VERDICTS, fdate, fdt } from "@/lib/demo/consts";
import { logAct, mutate, notify, notifyAdmins, type Case, type Demo, type User } from "@/lib/demo/store";
import { isMine } from "@/lib/demo/props";
import { closeModal } from "@/lib/demo/ui";
import { Code, Empty, Note, Table } from "./common";

const CST: Record<string, [string, string]> = { "ouvert": ["Ouvert", "réservé"], "pris en charge": ["Pris en charge", "dispatché"], "escaladé": ["Escaladé", "refusé"], "résolu": ["Résolu", "validé"] };
const CasePill = ({ c }: { c: Case }) => <span className={`pill ${CST[c.status]?.[1] ?? ""}`}>{CST[c.status]?.[0] ?? c.status}</span>;
const kindL = (c: Case) => (c.kind === "signalement" ? "Signalement" : "Litige");
const replyLeft = (c: Case) => { const l = Math.round((c.replyDue - Date.now()) / 3600e3); return l > 0 ? `${l} h pour répondre` : "Délai de réponse dépassé"; };
const userName = (S: Demo, em: string) => S.users.find((u) => u.email === em)?.name ?? em;
const ownerEmail = (S: Demo, ref: string) => { const p = S.props.find((x) => x.ref === ref); return !p ? null : p.owner === "demo" || !p.owner ? "ngo@exemple.cm" : p.owner; };
const fv = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export const can = (u: User, perm: string) => u.role === "admin" && (ADM_ROLES[u.arole ?? "super"]?.p ?? []).includes(perm);
const nextCode = (S: Demo) => "LIT-" + String(Math.max(0, ...S.cases.map((c) => +c.code.slice(4) || 0)) + 1).padStart(4, "0");
const hist = (s: Demo, c: Case, act: string, internal = false) => c.hist.push({ t: Date.now(), who: s.user ? s.user.name : "Système", act, internal });
const find = (s: Demo, code: string) => s.cases.find((c) => c.code === code);
type Dec = { verdict: string; t: number; by: string; motif: string; contest?: boolean };

/** Nombre de litiges qui attendent la réponse de l'utilisateur. */
export const litigesBadge = (S: Demo, email: string) => S.cases.filter((c) => c.against === email && !c.reply && c.status !== "résolu" && c.kind === "litige").length;

/* ---------- actions ---------- */
function declare(f: FormData) {
  mutate((s) => {
    const u = s.user!, req = s.requests.find((r) => r.code === fv(f, "req"));
    let against: string | null = null, againstName = "";
    const ref = req ? req.ref : "—";
    if (req) { if (u.role === "owner") { against = req.by; againstName = req.name; } else { against = ownerEmail(s, req.ref); againstName = against ? userName(s, against) : ""; } }
    const c: Case = { code: nextCode(s), kind: "litige", lvl: 1, t: Date.now(), replyDue: Date.now() + 72 * 3600e3, reply: null, status: "ouvert", assignee: null, decision: null, hist: [], objet: fv(f, "objet"), ref, by: u.email, byName: u.name, against: against ?? "", againstName, desc: fv(f, "desc") };
    s.cases.unshift(c);
    hist(s, c, "Litige déclaré");
    if (against) { hist(s, c, `${againstName} est invitée à répondre sous 72 h`); notify(s, against, `Litige ${c.code} déclaré à votre encontre (${c.objet}). Vous avez 72 h pour répondre depuis l'onglet « Litiges ».`, { v: "espace", tab: "litiges" }); }
    notifyAdmins(s, `Nouveau litige ${c.code} : ${c.objet}.`, "cases");
    logAct(s, `Litige ${c.code} déclaré : ${c.objet}`);
  });
}
const reply = (code: string, text: string) => mutate((s) => {
  const c = find(s, code); if (!c || c.reply) return;
  c.reply = { t: Date.now(), text }; c.hist.push({ t: Date.now(), who: s.user!.name, act: "Réponse déposée" });
  notify(s, c.by, `${c.code} : l'autre partie a répondu.`); if (c.assignee) notify(s, c.assignee, `${c.code} : la partie adverse a répondu.`);
  logAct(s, `Réponse au dossier ${c.code}`);
});
const take = (code: string) => mutate((s) => {
  const c = find(s, code); if (!c || !s.user) return;
  const esca = c.status === "escaladé" && c.lvl === 2;
  if (!(esca ? can(s.user, "escalade") : can(s.user, "litiges"))) return;
  const prev = c.assignee && c.assignee !== s.user.email ? c.assigneeName : null;
  c.assignee = s.user.email; c.assigneeName = s.user.name; c.status = "pris en charge";
  hist(s, c, prev ? `Cas repris à ${prev}` : "Prise en charge");
  notify(s, c.by, `${c.code} : un administrateur a pris votre dossier en charge.`); if (c.against) notify(s, c.against, `${c.code} : un administrateur a pris le dossier en charge.`);
  logAct(s, `Litige ${c.code} : prise en charge`);
});
const release = (code: string) => mutate((s) => {
  const c = find(s, code); if (!c || c.assignee !== s.user?.email) return;
  c.assignee = null; c.assigneeName = undefined; c.status = c.lvl === 2 ? "escaladé" : "ouvert";
  hist(s, c, "Cas libéré, retour dans la file"); logAct(s, `Litige ${c.code} : libéré`);
});
const escalate = (code: string, why: string) => mutate((s) => {
  const c = find(s, code); if (!c) return;
  c.lvl = 2; c.assignee = null; c.assigneeName = undefined; c.status = "escaladé";
  hist(s, c, `Escaladé : ${why}`); notifyAdmins(s, `Cas ${c.code} escaladé : ${why}`, "cases"); logAct(s, `Litige ${c.code} : escalade`);
});
const addNote = (code: string, text: string) => mutate((s) => { const c = find(s, code); if (c) { hist(s, c, "Note interne : " + text, true); logAct(s, `Litige ${c.code} : note interne`); } });
const decide = (code: string, verdict: string, motif: string) => mutate((s) => {
  const c = find(s, code); if (!c || c.assignee !== s.user?.email) return;
  const prev = c.decision as Dec | null;
  c.decision = { t: Date.now(), by: s.user.name, verdict, motif, contest: prev ? !!prev.contest : false };
  c.status = "résolu"; hist(s, c, `Décision rendue : ${verdict}`);
  if (c.review) {
    const [rf, ri] = c.review.split(":"), r = (s.reviews[rf] ?? [])[+ri];
    if (r && verdict === "Commentaire retiré") { r.removed = true; r.text = "Commentaire retiré par la modération."; }
  }
  [c.by, c.against].filter(Boolean).forEach((e) => notify(s, e, `${c.code} : décision rendue (${verdict}). Motif disponible dans l'onglet « Litiges ».`));
  logAct(s, `Litige ${c.code} : décision « ${verdict} »`);
});
const contest = (code: string, why: string) => mutate((s) => {
  const c = find(s, code); const d = c?.decision as Dec | null;
  if (!c || !d || d.contest) return;
  d.contest = true; c.lvl = 2; c.status = "escaladé"; c.assignee = null; c.assigneeName = undefined;
  hist(s, c, `Décision contestée par ${s.user!.name} : ${why}`); notifyAdmins(s, `Contestation sur ${c.code} : arbitrage final requis.`, "cases"); logAct(s, `Litige ${c.code} : contestation`);
});
const reopen = (code: string) => mutate((s) => {
  const c = find(s, code); if (!c || !s.user || !can(s.user, "escalade")) return;
  c.status = "pris en charge"; c.assignee = s.user.email; c.assigneeName = s.user.name; hist(s, c, "Cas rouvert"); logAct(s, `Litige ${c.code} : rouvert`);
});

/** Signalement d'un commentaire par le propriétaire. */
export function reportReview(key: string, why: string, desc: string) {
  mutate((s) => {
    const [ref, i] = key.split(":"), r = (s.reviews[ref] ?? [])[+i];
    if (!r || !s.user || s.cases.some((c) => c.review === key && c.status !== "résolu")) return;
    const au = s.users.find((x) => x.role === "visitor" && x.name.split(" ")[0] === r.who.split(" ")[0] && (x.name.split(" ").slice(-1)[0] ?? "")[0] === (r.who.split(" ").slice(-1)[0] || "")[0]);
    const c: Case = { code: nextCode(s), kind: "signalement", lvl: 1, t: Date.now(), replyDue: Date.now() + 72 * 3600e3, reply: null, status: "ouvert", assignee: null, decision: null, hist: [], objet: "Commentaire signalé : " + why.toLowerCase(), ref, review: key, by: s.user.email, byName: s.user.name, against: au?.email ?? "", againstName: `${r.who} (auteur du commentaire)`, desc };
    s.cases.unshift(c); hist(s, c, "Commentaire signalé");
    if (au) notify(s, au.email, `Votre commentaire sur ${ref} a été signalé (${c.code}). Vous pouvez répondre depuis l'onglet « Litiges ».`);
    notifyAdmins(s, `Signalement ${c.code} sur un commentaire de ${ref}.`, "cases");
    logAct(s, `Signalement ${c.code} : commentaire ${key}`);
  });
}

/* ---------- vue des parties (client, propriétaire) ---------- */
export function LitigesTab({ S, u }: { S: Demo; u: User }) {
  const [openNew, setOpenNew] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const L = S.cases.filter((c) => c.by === u.email || c.against === u.email).sort((a, b) => b.t - a.t);
  const todo = L.filter((c) => c.against === u.email && !c.reply && c.status !== "résolu" && c.kind === "litige");
  return (
    <>
      <div className="row between" style={{ gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div><h2 style={{ fontSize: "1.2rem" }}>Litiges et signalements</h2><p className="small muted" style={{ maxWidth: "62ch" }}>Un désaccord avec un locataire, un propriétaire ou un commentaire ? Déclarez-le ici. L&apos;autre partie répond sous 72 h, puis un administrateur prend le dossier en charge et tranche.</p></div>
        <button className="btn" onClick={() => setOpenNew(true)}>Déclarer un litige</button>
      </div>
      <div className="flow" style={{ marginBottom: 20 }}>{[["Déclaration", "Vous décrivez le problème."], ["Droit de réponse", "L'autre partie répond sous 72 h."], ["Prise en charge", "Un administrateur est assigné."], ["Arbitrage", "Décision motivée, contestable une fois."]].map(([a, b], i) => <div key={a}><span className="eyebrow">Étape {i + 1}</span><b>{a}</b><span className="muted small">{b}</span></div>)}</div>
      {todo.length > 0 && <div className="verdict" style={{ background: "var(--warn-bg)", color: "var(--warn-t)", borderColor: "var(--warn)", marginBottom: 14 }}><b>{todo.length} litige(s) attendent votre réponse</b><span className="small">Vous disposez de 72 h pour exposer votre version.</span></div>}
      <div style={{ display: "grid", gap: 14 }}>{L.length ? L.map((c) => <CaseCard key={c.code} c={c} u={u} open={() => setDetail(c.code)} />) : <Empty>Aucun litige ni signalement.</Empty>}</div>
      {openNew && <NewCase S={S} u={u} onClose={() => setOpenNew(false)} />}
      {detail && <CaseDetail S={S} u={u} code={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

function CaseCard({ c, u, open }: { c: Case; u: User; open: () => void }) {
  const adv = c.against === u.email, [txt, setTxt] = useState("");
  const d = c.decision as Dec | null;
  return (
    <article className="box">
      <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
        <div><Code>{c.code}</Code> <b>{c.objet}</b><div className="small muted">{kindL(c)} · {c.ref} · {fdate(c.t)} · {c.by === u.email ? "Vous avez déclaré" : "Déclaré contre vous"}</div></div>
        <CasePill c={c} />
      </div>
      <p className="small">{c.desc}</p>
      {c.reply ? <div className="reply"><b>Réponse :</b> {c.reply.text}</div> : c.status !== "résolu" && c.kind === "litige" ? <p className="small muted">{replyLeft(c)}</p> : null}
      {adv && !c.reply && c.status !== "résolu" && (
        <form className="sendrow" onSubmit={(e) => { e.preventDefault(); reply(c.code, txt.trim()); }}>
          <label className="sr-only" htmlFor={`xr-${c.code}`}>Votre réponse</label>
          <input id={`xr-${c.code}`} value={txt} onChange={(e) => setTxt(e.target.value)} required minLength={10} maxLength={600} placeholder="Votre version des faits" autoComplete="off" />
          <button className="btn sm" type="submit">Répondre</button>
        </form>
      )}
      {d && <div className="verdict dec"><b>Décision : {d.verdict}</b><span className="small">{fdate(d.t)} · {d.by}</span><span>{d.motif}</span></div>}
      <div className="acts"><button className="btn ghost sm" onClick={open}>Voir le détail</button></div>
    </article>
  );
}

function NewCase({ S, u, onClose }: { S: Demo; u: User; onClose: () => void }) {
  const owner = u.role === "owner";
  const ids = S.props.filter((p) => isMine(p, u.email)).map((p) => p.ref);
  const R = owner ? S.requests.filter((r) => ids.includes(r.ref)) : S.requests.filter((r) => r.by === u.email);
  return (
    <ModalFrame label="Déclarer un litige" narrow onClose={onClose}>
      <form onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); declare(new FormData(e.currentTarget)); onClose(); }} style={{ padding: 26, display: "grid", gap: 14 }}>
        <div><div className="eyebrow">Litige</div><h2 style={{ marginTop: 6 }}>Déclarer un litige</h2></div>
        <label className="f">Concerne<select name="req">{R.map((r) => <option key={r.code} value={r.code}>{r.code} · {S.props.find((p) => p.ref === r.ref)?.title ?? r.ref}{owner ? " · " + r.name : ""}</option>)}<option value="">Autre sujet (sans demande)</option></select></label>
        <label className="f">Objet<select name="objet">{OBJETS.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label className="f">Que s&apos;est-il passé ?<textarea name="desc" rows={4} minLength={20} maxLength={800} required placeholder="Faits, dates, montants. L'autre partie pourra répondre." /></label>
        <Note>L&apos;autre partie est prévenue et répond sous 72 h. Vous suivez le dossier dans l&apos;onglet « Litiges ». Un administrateur prend ensuite le cas en charge.</Note>
        <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}><button type="button" className="btn ghost" onClick={onClose}>Annuler</button><button className="btn" type="submit">Déclarer</button></div>
      </form>
    </ModalFrame>
  );
}

/* ---------- détail d'un cas ---------- */
export function CaseDetail({ S, u, code, onClose }: { S: Demo; u: User; code: string; onClose: () => void }) {
  const c = S.cases.find((x) => x.code === code);
  if (!c) return null;
  const adm = u.role === "admin", mine = c.assignee === u.email;
  const d = c.decision as Dec | null;
  const esca = c.status === "escaladé" && c.lvl === 2;
  const rev = c.review ? (S.reviews[c.review.split(":")[0]] ?? [])[+c.review.split(":")[1]] : null;
  const V = c.kind === "signalement" ? ["Commentaire retiré", "Commentaire maintenu"] : VERDICTS;
  const sub = (fn: (f: FormData) => void) => (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); fn(f); e.currentTarget.reset(); };
  let actions = null;
  if (adm) {
    if (c.status === "résolu") actions = can(u, "escalade") ? <div className="acts"><button className="btn ghost sm" onClick={() => reopen(c.code)}>Rouvrir (super-administrateur)</button></div> : null;
    else if (!c.assignee) actions = (esca ? can(u, "escalade") : can(u, "litiges")) ? <div className="acts"><button className="btn" onClick={() => take(c.code)}>Prendre en charge</button></div> : <p className="note">{esca ? "Cas escaladé : réservé au super-administrateur." : "Votre rôle (lecture seule) ne permet pas de prendre ce cas en charge."}</p>;
    else if (mine || can(u, "escalade")) {
      const arb = esca ? can(u, "escalade") : can(u, "arbitrer");
      actions = (
        <>
          {!mine && <div className="acts"><button className="btn ghost sm" onClick={() => take(c.code)}>Reprendre ce cas (réaffectation)</button></div>}
          <form className="sendrow" onSubmit={sub((f) => addNote(c.code, fv(f, "text")))}><label className="sr-only" htmlFor="xn">Note interne</label><input id="xn" name="text" required maxLength={300} placeholder="Note interne (invisible pour les parties)" /><button className="btn ghost sm" type="submit">Ajouter</button></form>
          {arb ? (
            <form className="box" onSubmit={sub((f) => decide(c.code, fv(f, "verdict"), fv(f, "motif")))}>
              <b>Rendre la décision</b>
              <label className="f">Décision<select name="verdict">{V.map((v) => <option key={v}>{v}</option>)}</select></label>
              <label className="f">Motif (obligatoire, communiqué aux parties)<textarea name="motif" rows={3} minLength={15} maxLength={600} required /></label>
              <button className="btn ok" type="submit">Rendre la décision</button>
            </form>
          ) : <p className="note">Votre rôle ne permet pas d&apos;arbitrer. Rassemblez les éléments puis escaladez.</p>}
          <form className="box" onSubmit={sub((f) => escalate(c.code, fv(f, "why")))}>
            <b>Escalader</b>
            <label className="f">Raison de l&apos;escalade<input name="why" required minLength={8} maxLength={200} placeholder="Ex. montant élevé, partie sensible, besoin d'un avis juridique" /></label>
            <div className="acts"><button className="btn bad sm" type="submit">Escalader au super-administrateur</button>{mine && <button className="btn ghost sm" type="button" onClick={() => release(c.code)}>Libérer le cas</button>}</div>
          </form>
        </>
      );
    } else actions = <p className="note">Cas pris en charge par {c.assigneeName ?? c.assignee}. Lecture seule.</p>;
  } else if (c.status === "résolu" && d && !d.contest && (c.by === u.email || c.against === u.email)) {
    actions = (
      <form className="box" onSubmit={sub((f) => contest(c.code, fv(f, "why")))}>
        <b>Contester la décision</b>
        <p className="small muted">Une seule contestation est possible. Le cas est alors examiné par le super-administrateur.</p>
        <label className="f">Pourquoi contestez-vous ?<textarea name="why" rows={3} minLength={15} required /></label>
        <button className="btn bad sm" type="submit">Contester</button>
      </form>
    );
  }
  return (
    <ModalFrame label={`Dossier ${c.code}`} onClose={onClose}>
      <div style={{ padding: 26, display: "grid", gap: 14 }}>
        <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
          <div><div className="eyebrow">{kindL(c)}{c.lvl === 2 ? " · niveau 2" : ""}</div><h2 style={{ marginTop: 6 }}>{c.objet}</h2><p className="small muted"><Code>{c.code}</Code> · {c.ref} · {fdate(c.t)}</p></div>
          <CasePill c={c} />
        </div>
        <div className="kv">
          <div><span>Déclarant</span><b>{c.byName || userName(S, c.by)}</b></div><div><span>Partie adverse</span><b>{c.againstName || userName(S, c.against)}</b></div>
          <div><span>Assigné à</span><b>{c.assigneeName ?? "Personne pour l'instant"}</b></div><div><span>Droit de réponse</span><b>{c.reply ? "Réponse reçue" : c.kind === "litige" ? replyLeft(c) : "Auteur informé"}</b></div>
        </div>
        <div className="box"><b>Exposé</b><p className="small">{c.desc}</p>
          {rev && <blockquote className="small" style={{ borderLeft: "3px solid var(--gold)", paddingLeft: 12, margin: 0 }}>« {rev.text} » <span className="muted">{rev.who}{rev.removed ? " · retiré" : ""}</span></blockquote>}
          {c.reply && <div className="reply"><b>Réponse de la partie adverse ({fdate(c.reply.t)}) :</b> {c.reply.text}</div>}</div>
        {d && <div className="verdict dec"><b>Décision : {d.verdict}</b><span className="small">{fdate(d.t)} · {d.by}{d.contest ? " · contestée" : ""}</span><span>{d.motif}</span></div>}
        <div><b className="small">Historique</b>
          <ul className="xhist">{c.hist.filter((h) => adm || !h.internal).map((h, i) => <li key={i}><span className="small muted">{fdt(h.t)}</span> <b className="small">{h.who}</b> {h.act}{h.internal && <span className="pill à-préparer">Interne</span>}</li>)}</ul></div>
        {actions}
        <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn ghost" onClick={onClose}>Fermer</button></div>
      </div>
    </ModalFrame>
  );
}

/* ---------- file des litiges (administrateur) ---------- */
export function AdminCases({ S, u }: { S: Demo; u: User }) {
  const [F, setF] = useState<"new" | "mine" | "esc" | "all" | "done">("new");
  const [detail, setDetail] = useState<string | null>(null);
  const open = (c: Case) => c.status !== "résolu";
  const fl = { new: (c: Case) => !c.assignee && open(c), mine: (c: Case) => c.assignee === u.email && open(c), esc: (c: Case) => c.status === "escaladé", all: () => true, done: (c: Case) => c.status === "résolu" };
  const lab = { new: "À prendre", mine: "Mes dossiers", esc: "Escaladés", all: "Tous", done: "Résolus" } as const;
  const L = S.cases.filter(fl[F]).sort((a, b) => a.t - b.t);
  return (
    <>
      <div className="verdict dec" style={{ marginBottom: 14 }}><b>Un problème arrive, il apparaît ici</b><span className="small">Cliquez sur « Prendre en charge » : le cas vous est assigné jusqu&apos;à résolution ou escalade. Tous les administrateurs (sauf lecture seule) peuvent prendre un cas.</span></div>
      <div className="chips" role="group" aria-label="Filtrer">
        {(Object.keys(lab) as (keyof typeof lab)[]).map((k) => <button key={k} className="chip" onClick={() => setF(k)} aria-pressed={F === k}>{lab[k]} <span className="n">{S.cases.filter(fl[k]).length}</span></button>)}
      </div>
      <Table head={["Code", "Type", "Objet", "Parties", "Délai", "Statut", "Assigné à", "Action"]} empty="Aucun cas dans cette liste."
        rows={L.map((c) => [
          <button key="c" className="linkb" onClick={() => setDetail(c.code)}><Code>{c.code}</Code></button>, kindL(c) + (c.lvl === 2 ? " · niv. 2" : ""), c.objet,
          <span key="p">{c.byName || userName(S, c.by)}<br /><span className="small muted">contre {c.againstName || "—"}</span></span>,
          c.status === "résolu" ? "—" : c.kind === "litige" ? (c.reply ? "Réponse reçue" : replyLeft(c)) : "—", <CasePill key="s" c={c} />, c.assigneeName ?? "—",
          c.assignee ? <button key="a" className="btn ghost sm" onClick={() => setDetail(c.code)}>Ouvrir</button> : <button key="a" className="btn sm" onClick={() => take(c.code)}>Prendre en charge</button>,
        ])} />
      {detail && <CaseDetail S={S} u={u} code={detail} onClose={() => { setDetail(null); closeModal(); }} />}
    </>
  );
}
