"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cancelRequestByClient, markMessagesRead, markNotifsRead, sendMessage, uploadDoc } from "@/lib/demo/actions";
import { DOCS, PERSONAS, ROLES, SITU, fdate, fdt } from "@/lib/demo/consts";
import { Ic } from "@/lib/demo/icons";
import { CHAR, ROLE_CH, pub, sc10 } from "@/lib/demo/props";
import { loginAs, useDemo, type Demo, type Req, type Role, type User } from "@/lib/demo/store";
import { openModal } from "@/lib/demo/ui";
import { AdminSpace, LegalSpace, OwnerSpace } from "./espace-staff";
import { ProviderSpace } from "./espace-provider";
import { LitigesTab, litigesBadge } from "./litiges";
import { CH, Code, Empty, Kpi, Note, Pill, RPill, StatusBanner, Table, Track } from "./common";
import { Art, Card } from "./property";

/** Onglet courant d'un espace : lu dans l'adresse (?tab=…), sinon le premier onglet valide. */
export function useTab<T extends string>(valid: readonly T[]): [T, (t: T) => void] {
  const params = useSearchParams(), router = useRouter();
  const q = params.get("tab") as T | null;
  const [tab, setTab] = useState<T>(q && valid.includes(q) ? q : valid[0]);
  useEffect(() => { if (q && valid.includes(q)) setTab(q); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  return [tab, (t: T) => { setTab(t); router.replace(`/espace?tab=${t}`, { scroll: false }); }];
}

/** En-tête commun des espaces : rôle, accueil, personnage, bascule de profil et onglets. */
export function EHead<T extends string>({ u, tabs, value, onChange }: { u: User; tabs: readonly (readonly [T, string, number?, (number | boolean)?])[]; value: T; onChange: (t: T) => void }) {
  const first = u.name.split(" ")[0];
  return (
    <div className="ehead">
      <div className="ewho">
        <div><span className="role">{ROLES[u.role]}</span><h1>Bonjour, {first === "Mme" || first === "Me" ? u.name : first}</h1><div className="sub">{PERSONAS[u.role]?.d ?? ""}</div></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ehero" src={CH(CHAR[ROLE_CH[u.role]] ?? "ch_conseillere")} alt="" aria-hidden="true" />
        <div className="persona" role="group" aria-label="Changer de profil (démonstration)"><span>Démo, voir en tant que :</span>
          {Object.entries(ROLES).map(([k, l]) => <button key={k} type="button" onClick={() => loginAs(k as Role)} aria-pressed={u.role === k}>{l}</button>)}</div>
      </div>
      <div className="etabs" role="tablist">
        {tabs.map(([k, l, n, red]) => <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}>{l}{n ? <span className={`n ${red ? "red" : ""}`}>{n}</span> : null}</button>)}
      </div>
    </div>
  );
}

export function EspaceView() {
  const S = useDemo();
  const u = S.user;
  if (!u) return <Login />;
  switch (u.role) {
    case "owner": return <OwnerSpace S={S} u={u} />;
    case "legal": return <LegalSpace S={S} u={u} />;
    case "provider": return <ProviderSpace S={S} u={u} />;
    case "admin": return <AdminSpace S={S} u={u} />;
    default: return <ClientSpace S={S} u={u} />;
  }
}

function Login() {
  const router = useRouter();
  return (
    <section className="section">
      <h1 style={{ fontSize: "1.8rem" }}>Mon espace</h1>
      <p className="muted" style={{ margin: "8px 0 18px" }}>Connectez-vous, ou explorez la démonstration avec l&apos;un des cinq profils.</p>
      <div className="row"><button className="btn" onClick={() => openModal({ k: "auth", m: "login" })}>Connexion</button><button className="btn ghost" onClick={() => openModal({ k: "auth", m: "signup" })}>Créer un compte</button></div>
      <div className="login-personas">
        {(Object.keys(PERSONAS) as Role[]).map((k) => (
          <button key={k} className="pcard" onClick={() => { loginAs(k); router.push("/espace"); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pfig" src={CH(CHAR[ROLE_CH[k]])} alt="" aria-hidden="true" /><b>{ROLES[k]}</b><span>{PERSONAS[k].name}</span><span>{PERSONAS[k].d}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- espace client ---------- */
const CTABS = ["dash", "res", "docs", "msg", "favs", "sav", "notifs", "litiges"] as const;
type CTab = (typeof CTABS)[number];

function ClientSpace({ S, u }: { S: Demo; u: User }) {
  const [tab, setTab] = useTab<CTab>(CTABS);
  const router = useRouter();
  const R = S.requests.filter((r) => r.by === u.email);
  const act = R.filter((r) => r.status === "en attente" || (r.status === "validée" && (r.stage ?? 0) < 5));
  const docs = S.docs[u.email] ?? {};
  const miss = Object.values(docs).filter((v) => v === "manquant").length;
  const unread = S.msgs.filter((m) => m.with === u.email && m.from === "immo" && m.unread).length;
  const unreadN = S.notifs.filter((n) => n.email === u.email && !n.read).length;
  const tabs = [["dash", "Tableau de bord"], ["res", "Mes réservations", act.length], ["docs", "Mes documents", miss, 1], ["msg", "Messages", unread, 1], ["favs", "Favoris", S.favs.length], ["sav", "Urgences et devis"], ["notifs", "Notifications", unreadN], ["litiges", "Litiges", litigesBadge(S, u.email), 1]] as const;
  useEffect(() => { if (tab === "msg") markMessagesRead(u.email); if (tab === "notifs") markNotifsRead(u.email); }, [tab, u.email]);
  return (
    <>
      <EHead u={u} tabs={tabs} value={tab} onChange={setTab} />
      {tab === "dash" && (
        <>
          <div className="kpis">
            <Kpi label="Demandes en cours" value={act.length} hint="Réponse sous 72 h" onClick={() => setTab("res")} />
            <Kpi label="Pièces manquantes" value={miss} hint="À déposer" color="var(--bad)" onClick={() => setTab("docs")} />
            <Kpi label="Messages non lus" value={unread} hint="Conseiller Immo Bell" color="var(--ok)" onClick={() => setTab("msg")} />
            <Kpi label="Favoris" value={S.favs.length} hint="Biens suivis" color="var(--ink)" onClick={() => setTab("favs")} />
          </div>
          {act[0] ? <><h2 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Prochaine étape</h2><ResCard S={S} r={act[0]} setTab={setTab} /></>
            : <div className="empty">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="efig" src={CH("ch_conseillere_reflexion")} alt="" aria-hidden="true" />Aucune demande en cours. <button className="btn sm" onClick={() => router.push("/biens")}>Trouver un bien</button></div>}
          <h2 style={{ fontSize: "1.2rem", margin: "26px 0 10px" }}>Suggestions pour vous</h2>
          <div className="grid3">{pub(S).filter((p) => p.status === "libre" && !R.some((r) => r.ref === p.ref)).sort((a, b) => sc10(S, b.ref) - sc10(S, a.ref)).slice(0, 3).map((p) => <Card key={p.ref} p={p} />)}</div>
        </>
      )}
      {tab === "res" && (R.length ? <div style={{ display: "grid", gap: 14 }}>{R.map((r) => <ResCard key={r.code} S={S} r={r} setTab={setTab} />)}</div> : <Empty>Aucune réservation. Réservez un bien depuis sa fiche.</Empty>)}
      {tab === "docs" && <DocsTab u={u} docs={docs} />}
      {tab === "msg" && <MsgTab S={S} u={u} />}
      {tab === "favs" && (() => { const l = S.favs.map((r) => S.props.find((p) => p.ref === r)).filter((p): p is NonNullable<typeof p> => !!p); return l.length ? <div className="grid3">{l.map((p) => <Card key={p.ref} p={p} />)}</div> : <Empty>Aucun favori. Touchez le cœur sur une annonce pour la retrouver ici.</Empty>; })()}
      {tab === "sav" && (
        <>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 10 }}>Mes signalements d&apos;urgence</h2>
          <Table head={["Code", "Nature", "Bien", "Statut", "Rapport"]} empty="Aucun signalement." rows={S.incidents.filter((r) => r.by === u.email).map((r) => [<Code key="c">{r.code}</Code>, r.type, r.ref, <Pill key="s" s={r.status} />, r.rapport || "—"])} />
          <h2 style={{ fontSize: "1.1rem", margin: "24px 0 10px" }}>Mes demandes de devis</h2>
          <Table head={["Code", "Prestation", "Date souhaitée", "Statut"]} empty="Aucune demande de devis." rows={S.quotes.filter((r) => r.by === u.email).map((r) => [<Code key="c">{r.code}</Code>, r.type, fdate(r.date), <Pill key="s" s={r.status} />])} />
          <div className="row" style={{ marginTop: 16 }}><button className="btn ghost sm" onClick={() => router.push("/services?tab=urgences")}>Signaler une urgence</button><button className="btn ghost sm" onClick={() => router.push("/services?tab=logistique")}>Demander un devis</button></div>
        </>
      )}
      {tab === "notifs" && (() => { const l = S.notifs.filter((n) => n.email === u.email); return l.length ? <div style={{ display: "grid" }}>{l.map((n, i) => <details key={i} open><summary>{n.text}<span className="small muted">{fdt(n.t)}</span></summary></details>)}</div> : <Empty>Aucune notification. Vous serez prévenu du statut de vos demandes.</Empty>; })()}
      {tab === "litiges" && <LitigesTab S={S} u={u} />}
    </>
  );
}

function ResCard({ S, r, setTab }: { S: Demo; r: Req; setTab: (t: CTab) => void }) {
  const router = useRouter();
  const p = S.props.find((x) => x.ref === r.ref);
  const k = r.status === "refusée" ? 0 : r.stage ?? 0;
  const reviewed = p && (S.reviews[p.ref] ?? []).some((x) => x.who === S.user?.name);
  return (
    <article className="box">
      <div className="row between" style={{ alignItems: "flex-start", gap: 14 }}>
        <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 120, borderRadius: 8, overflow: "hidden", flex: "none" }}>{p ? <Art p={p} /> : null}</div>
          <div><b>{p?.title ?? r.ref}</b><div className="small muted">{p?.q} · {r.ref}</div>
            <div className="small" style={{ marginTop: 4 }}>Code <Code>{r.code}</Code> · {p?.mode === "Saisonnière" && r.end ? `${fdate(r.date)} → ${fdate(r.end)}` : "Entrée souhaitée le " + fdate(r.date)}</div></div>
        </div>
        <RPill s={r.status} />
      </div>
      <StatusBanner r={r} />{r.status === "refusée" ? null : <Track k={k} />}
      <div className="acts">
        {r.status === "en attente" && <button className="btn sm" onClick={() => setTab("docs")}>Compléter mon dossier</button>}
        <button className="btn ghost sm" onClick={() => setTab("msg")}>Contacter Immo Bell</button>
        {r.status === "refusée" && <button className="btn sm" onClick={() => router.push("/biens")}>Voir d&apos;autres biens</button>}
        <button className="btn ghost sm" onClick={() => router.push(`/biens/${r.ref}`)}>Voir le bien</button>
        {k >= 5 && p && !reviewed && <button className="btn ghost sm" onClick={() => router.push(`/biens/${r.ref}#s-avis`)}>Laisser un avis</button>}
        {r.status === "en attente" && <button className="btn bad sm" onClick={() => cancelRequestByClient(r.code)}>Annuler la demande</button>}
      </div>
    </article>
  );
}

function DocsTab({ u, docs }: { u: User; docs: Record<string, string> }) {
  const router = useRouter();
  const keys = Object.keys(docs).length ? Object.keys(docs) : SITU.CDI;
  const sub: Record<string, string> = { "reçu": "Contrôlé par l'analyste juridique", "à valider": "Déposé, en cours de contrôle", "non requis": "Non requis pour votre situation", "manquant": "À déposer" };
  return (
    <div className="two">
      <div className="docs">
        {keys.map((k) => {
          const s = docs[k] ?? "manquant";
          return (
            <div key={k} className="doc"><Ic n="file" />
              <div><b className="small">{DOCS[k] ?? k}</b><div className="small muted">{sub[s]}</div>
                {s === "manquant" && <input type="file" accept="image/*,.pdf" aria-label={`Déposer : ${DOCS[k] ?? k}`} onChange={(e) => { if (e.target.files?.length) uploadDoc(u.email, k); }} />}</div>
              <span className={`st ${s === "reçu" || s === "non requis" ? "ok" : s === "à valider" ? "wait" : "no"}`}>{s}</span>
            </div>
          );
        })}
      </div>
      <div className="box"><b>Pourquoi ces pièces ?</b>
        <p className="small muted">Le pôle juridique vérifie l&apos;identité, la situation professionnelle et la solvabilité (loyer au plus égal au tiers du revenu net). Vos documents ne sont visibles que par Immo Bell.</p>
        <Note>Démonstration : le nom du fichier est enregistré, pas son contenu.</Note>
        <button className="btn ghost sm" onClick={() => router.push("/juridique")}>Voir la liste complète</button></div>
    </div>
  );
}

function MsgTab({ S, u }: { S: Demo; u: User }) {
  const router = useRouter();
  const th = S.msgs.filter((m) => m.with === u.email);
  const [text, setText] = useState("");
  return (
    <div className="two">
      <div>
        <div className="thread" id="thread">
          {th.length ? th.map((m, i): ReactNode => <div key={i} className={`msg ${m.from === "me" ? "me" : ""}`}><span>{m.text}</span><small>{m.from === "me" ? "Vous" : "Immo Bell"} · {fdt(m.t)}</small></div>) : <p className="small muted">Écrivez à votre conseiller Immo Bell.</p>}
        </div>
        <form className="sendrow" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { sendMessage(text.trim()); setText(""); } }}>
          <label className="sr-only" htmlFor="m-text">Votre message</label>
          <input id="m-text" required placeholder="Votre message" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn" type="submit">Envoyer</button>
        </form>
      </div>
      <div className="box"><b>Votre conseiller</b>
        <div className="row" style={{ gap: 10 }}><span className="av">IB</span><div><b className="small">Équipe Immo Bell</b><div className="small muted">Répond de 8 h à 18 h</div></div></div>
        <p className="small muted">Pour une urgence (fuite, panne électrique, serrure), utilisez plutôt le signalement d&apos;urgence : il est dispatché sous 24 h.</p>
        <button className="btn ghost sm" onClick={() => router.push("/services?tab=urgences")}>Signaler une urgence</button></div>
    </div>
  );
}
