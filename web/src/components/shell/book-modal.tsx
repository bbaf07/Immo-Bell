"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Art, Badge, StatusPill } from "@/components/demo/property";
import { CH, Track } from "@/components/demo/common";
import { createRequest } from "@/lib/demo/actions";
import { confetti } from "@/lib/demo/dom-effects";
import { DOCS, SITU, fcfa } from "@/lib/demo/consts";
import { DAY, iso, nightsBetween, today } from "@/lib/demo/dates";
import { useSearch } from "@/lib/demo/filters";
import { Ic } from "@/lib/demo/icons";
import { deposit } from "@/lib/demo/props";
import { useDemo } from "@/lib/demo/store";
import { closeModal, openModal, toast } from "@/lib/demo/ui";
import { ModalFrame } from "./modal-host";

/* ---------- comparateur ---------- */
export function CompareModal() {
  const S = useDemo(), { cmp } = useSearch();
  const l = cmp.map((r) => S.props.find((p) => p.ref === r)).filter((p): p is NonNullable<typeof p> => !!p);
  const rows: [string, (p: (typeof l)[number]) => ReactNode][] = [
    ["Prix", (p) => fcfa(p.price) + (p.mode === "Vente" ? "" : p.mode === "Saisonnière" ? " / nuit" : " / mois")], ["Quartier", (p) => p.q], ["Type", (p) => p.type],
    ["Pièces", (p) => p.rooms || "Terrain nu"], ["Superficie", (p) => p.surface + " m²"], ["Disponibilité", (p) => <StatusPill s={p.status} />], ["Équipements", (p) => p.eq.join(", ")],
  ];
  return (
    <ModalFrame label="Comparateur">
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 18 }}>Comparateur de biens</h2>
        <div className="tw"><table>
          <thead><tr><th />{l.map((p) => <th key={p.ref}>{p.title}<br /><code className="ref">{p.ref}</code></th>)}</tr></thead>
          <tbody>{rows.map(([k, f]) => <tr key={k}><th>{k}</th>{l.map((p) => <td key={p.ref}>{f(p)}</td>)}</tr>)}</tbody>
        </table></div>
      </div>
    </ModalFrame>
  );
}

/* ---------- réservation en 4 étapes ---------- */
interface Draft { a: string; b: string; dur: string; occ: number; name: string; tel: string; mail: string; sit: string; rev: string; gar: boolean; docs: Record<string, boolean>; note: string; code: string }

function Solv({ price, mode, rev }: { price: number; mode: string; rev: string }) {
  const r = +String(rev || "").replace(/\s/g, "");
  if (!r || mode === "Vente" || mode === "Saisonnière") return <p className="small muted">Règle du pôle juridique : le loyer ne doit pas dépasser un tiers du revenu net mensuel.</p>;
  const cap = r / 3, ok = price <= cap;
  return <div className={`verdict ${ok ? "" : "no"}`} style={{ fontSize: ".88rem" }}>{ok ? "Solvabilité conforme" : "Loyer supérieur au tiers de vos revenus"} : capacité {fcfa(cap)} pour un loyer de {fcfa(price)}.{ok ? "" : " Un garant solidaire est fortement conseillé."}</div>;
}

export function BookModal({ ref0, a0, b0 }: { ref0: string; a0?: string; b0?: string }) {
  const S = useDemo(), router = useRouter(), { f } = useSearch();
  const p = S.props.find((x) => x.ref === ref0), u = S.user;
  const [st, setSt] = useState(1);
  const [d, setD] = useState<Draft>({ a: a0 ?? "", b: b0 ?? "", dur: "1 an renouvelable", occ: 1, name: u?.name ?? "", tel: u?.phone ?? "", mail: u?.email ?? "", sit: "CDI", rev: "", gar: false, docs: {}, note: "", code: "" });
  if (!p) return null;
  if (!u) {
    // Réserver exige un compte : la demande est rattachée à son auteur et suivie dans son espace.
    const then = { k: "book", ref: p.ref, a: a0, b: b0 } as const;
    return (
      <ModalFrame label="Réserver" narrow>
        <div style={{ padding: 28, display: "grid", gap: 14 }}>
          <h2>Connectez-vous pour réserver</h2>
          <p className="muted">Un compte est nécessaire : il permet de suivre votre dossier, de déposer vos pièces et de recevoir la réponse sous 72 h.</p>
          <div className="row"><button className="btn gold" onClick={() => openModal({ k: "auth", m: "login", then })}>Connexion</button><button className="btn ghost" onClick={() => openModal({ k: "auth", m: "signup", then })}>Créer un compte</button></div>
        </div>
      </ModalFrame>
    );
  }
  const seasonal = p.mode === "Saisonnière", T = today();
  const steps = ["Votre sélection", "Vos informations", "Pièces du dossier", "Confirmation"];
  const n = nightsBetween(d.a, d.b);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const next1 = (e: FormEvent) => {
    e.preventDefault();
    if (seasonal) {
      if (!(d.b > d.a)) return toast("Le départ doit être après l'arrivée.");
      const bk = new Set([...(S.cal[p.ref] ?? []), ...(S.blocks[p.ref] ?? [])]);
      for (let t = new Date(d.a).getTime(); iso(t) < d.b; t += DAY) if (bk.has(iso(t))) return toast("Certaines nuits sont déjà réservées. Choisissez d'autres dates.");
    }
    setSt(2);
  };
  const need = SITU[d.sit] ?? SITU.CDI;
  const send = (e: FormEvent) => {
    e.preventDefault();
    const code = createRequest({ ref: p.ref, a: d.a, b: d.b || undefined, occ: d.occ, dur: d.dur, name: d.name, tel: d.tel, mail: d.mail, sit: d.sit, rev: d.rev, gar: d.gar, docs: d.docs, note: d.note });
    set("code", code); setSt(4); confetti();
  };
  const r = S.requests.find((x) => x.code === d.code);
  return (
    <ModalFrame label={`Réserver ${p.title}`}>
      <div style={{ padding: 24 }}>
        <ol className="stepper" aria-label="Étapes">{steps.map((s, i) => <li key={s} className={i + 1 < st ? "done" : i + 1 === st ? "cur" : ""} aria-current={i + 1 === st ? "step" : undefined}>{s}</li>)}</ol>
        <div className="bk-grid">
          {st === 1 && (
            <form className="panel" style={{ padding: 18 }} onSubmit={next1}>
              <h3>Votre sélection</h3>
              {seasonal ? (
                <div className="cols2"><label className="f">Arrivée<input type="date" required min={iso(T)} value={d.a} onChange={(e) => set("a", e.target.value)} /></label><label className="f">Départ<input type="date" required min={iso(T + DAY)} value={d.b} onChange={(e) => set("b", e.target.value)} /></label></div>
              ) : (
                <div className="cols2">
                  <label className="f">{p.mode === "Vente" ? "Date de visite souhaitée" : "Date d'entrée souhaitée"}<input type="date" required min={iso(T)} value={d.a || f.date} onChange={(e) => set("a", e.target.value)} /></label>
                  {p.mode === "Vente" ? null : <label className="f">Durée envisagée<select value={d.dur} onChange={(e) => set("dur", e.target.value)}>{["1 an renouvelable", "2 ans", "3 ans et plus", "Quelques mois (mobilité)"].map((x) => <option key={x}>{x}</option>)}</select></label>}
                </div>
              )}
              <label className="f">Nombre d&apos;occupants<select value={d.occ} onChange={(e) => set("occ", +e.target.value)}>{[1, 2, 3, 4, 5, 6].map((x) => <option key={x}>{x}</option>)}</select></label>
              <div className="row between"><span /><button className="btn gold" type="submit">Suivant : vos informations <Ic n="right" className="sm" /></button></div>
            </form>
          )}
          {st === 2 && (
            <form className="panel" style={{ padding: 18 }} onSubmit={(e) => { e.preventDefault(); setSt(3); }}>
              <h3>Vos informations</h3>
              <div className="cols2"><label className="f">Nom complet<input required autoComplete="name" maxLength={80} value={d.name} onChange={(e) => set("name", e.target.value)} /></label><label className="f">Téléphone<input required inputMode="tel" autoComplete="tel" maxLength={20} value={d.tel} onChange={(e) => set("tel", e.target.value)} /></label></div>
              <label className="f">Email<input type="email" required autoComplete="email" maxLength={120} value={d.mail} onChange={(e) => set("mail", e.target.value)} /></label>
              <div className="cols2"><label className="f">Situation<select value={d.sit} onChange={(e) => set("sit", e.target.value)}>{Object.keys(SITU).map((x) => <option key={x}>{x}</option>)}</select></label>
                <label className="f">Revenu net mensuel (FCFA)<input required inputMode="numeric" value={d.rev} onChange={(e) => set("rev", e.target.value.replace(/\D/g, "").slice(0, 12))} aria-describedby="k-solv" /></label></div>
              <div id="k-solv" aria-live="polite"><Solv price={p.price} mode={p.mode} rev={d.rev} /></div>
              <label className="row small" style={{ gap: 8 }}><input type="checkbox" style={{ width: "auto" }} checked={d.gar} onChange={(e) => set("gar", e.target.checked)} /> J&apos;ai un garant solidaire</label>
              <div className="row between"><button className="btn ghost" type="button" onClick={() => setSt(1)}>Retour</button><button className="btn gold" type="submit">Suivant : pièces <Ic n="right" className="sm" /></button></div>
            </form>
          )}
          {st === 3 && (
            <form className="panel" style={{ padding: 18 }} onSubmit={send}>
              <h3>Pièces du dossier · {d.sit}</h3>
              <p className="small muted">Cochez les pièces que vous pouvez fournir. Vous pourrez déposer les fichiers dans votre espace. Les pièces sont contrôlées par l&apos;analyste juridique.</p>
              <div className="docs">{need.map((k) => <label key={k} className="doc"><input type="checkbox" checked={!!d.docs[k]} onChange={(e) => set("docs", { ...d.docs, [k]: e.target.checked })} style={{ width: 18, height: 18 }} /><Ic n="file" /><span><b className="small">{DOCS[k]}</b></span></label>)}</div>
              <label className="f">Message pour Immo Bell<textarea maxLength={1000} placeholder="Date d'entrée, employeur, questions" value={d.note} onChange={(e) => set("note", e.target.value)} /></label>
              <label className="row small" style={{ gap: 8 }}><input type="checkbox" required style={{ width: "auto" }} /> Je certifie l&apos;exactitude des informations et accepte l&apos;étude de mon dossier.</label>
              <div className="row between"><button className="btn ghost" type="button" onClick={() => setSt(2)}>Retour</button><button className="btn gold" type="submit">Envoyer ma demande</button></div>
            </form>
          )}
          {st === 4 && (
            <div className="panel conf" style={{ padding: 24 }}>
              <div className="bk-hero">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="f-awa" src={CH("ch_conseillere")} alt="Awa, la conseillère, tend les clés" /><div className="big">✓</div>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="f-joy" src={CH("ch_client_joie")} alt="Le client saute de joie" /></div>
              <h3>Demande envoyée</h3><div className="code">{d.code}</div>
              <p className="small muted" style={{ maxWidth: "46ch" }}>Gardez ce code : il identifie votre demande. L&apos;analyste juridique étudie votre dossier sous 72 h. Vous êtes prévenu à chaque étape.</p>
              <div style={{ width: "100%" }}><Track k={r?.stage ?? 0} /></div>
              <div className="row" style={{ justifyContent: "center" }}><button className="btn" onClick={() => { closeModal(); router.push("/espace?tab=res"); }}>Suivre dans mon espace</button><button className="btn ghost" onClick={closeModal}>Fermer</button></div>
            </div>
          )}
          {st < 4 && (
            <aside className="recap"><Art p={p} /><div><b>{p.title}</b><span className="small muted">{p.q} · {p.ref}</span><Badge p={p} cls="left" />
              <div className="tarifs small">{seasonal && d.a && d.b ? <div><span>{n} nuit{n > 1 ? "s" : ""}</span><b>{fcfa(n * p.price)}</b></div> : p.mode === "Vente" ? <div><span>Prix</span><b>{fcfa(p.price)}</b></div> : <><div><span>Loyer</span><b>{fcfa(p.price)} / mois</b></div><div><span>Dépôt</span><span>{fcfa(p.price * deposit(p))}</span></div></>}</div></div></aside>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}
