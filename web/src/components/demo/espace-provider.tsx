"use client";

import { useState, type FormEvent } from "react";
import { advanceIncident, closeIncident } from "@/lib/demo/actions";
import { fcfa, fdate } from "@/lib/demo/consts";
import { Ic } from "@/lib/demo/icons";
import { logAct, mutate, notify, notifyAdmins, type Demo, type User } from "@/lib/demo/store";
import { Code, Empty, Note, Pill, Table } from "./common";
import { EHead, useTab } from "./espace-view";

const wa = (tel: string, txt: string) => `https://wa.me/237${String(tel || "").replace(/\D/g, "").slice(-9)}?text=${encodeURIComponent(txt)}`;
const NEXT: Record<string, [string, string]> = { "dispatché": ["en route", "Je suis en route"], "en route": ["sur place", "Je suis sur place"], "sur place": ["clôturé", "Terminer"] };
const TABS = ["inter", "hist", "devis", "profil"] as const;
type Tab = (typeof TABS)[number];

export function ProviderSpace({ S, u }: { S: Demo; u: User }) {
  const [tab, setTab] = useTab<Tab>(TABS);
  const me = S.providers.find((p) => p.email === u.email);
  const mine = S.incidents.filter((i) => ["dispatché", "en route", "sur place"].includes(i.status));
  const hist = S.incidents.filter((i) => i.status === "clôturé");
  const nq = me ? S.quotes.filter((q) => q.prest === me.id && q.status === "attribué").length : 0;
  const tabs = [["inter", "Mes interventions", mine.length, 1], ["hist", "Historique", hist.length], ["devis", "Demandes de devis", nq, 1], ["profil", "Mon profil"]] as const;
  return (
    <>
      <EHead u={u} tabs={tabs} value={tab} onChange={setTab} />
      {tab === "inter" && (mine.length ? (
        <div className="sim3">
          {mine.map((i) => {
            const p = S.props.find((x) => x.ref === i.ref), nx = NEXT[i.status];
            return (
              <div key={i.code} className="icard" style={{ "--c": i.level === "Urgent" ? "var(--bad)" : "var(--gold)" } as React.CSSProperties}>
                <div className="row between"><Code>{i.code}</Code><span className={`lvl ${i.level === "Urgent" ? "" : i.level === "Sous 24 h" ? "m" : "l"}`}>{i.level}</span></div>
                <b>{i.type}</b><p className="small">{i.desc}</p>
                <div className="small muted"><Ic n="pin" className="sm" /> {p ? `${p.title}, ${p.q}` : i.ref} · {i.profil}</div>
                <div className="small">Statut : <Pill s={i.status} /></div>
                {nx[0] === "clôturé" ? <Rapport code={i.code} /> : (
                  <div className="acts">
                    <button className="btn sm" onClick={() => advanceIncident(i.code, nx[0])}>{nx[1]}</button>
                    <a className="btn wa sm" href={wa(i.phone, `Bonjour, prestataire Immo Bell pour le signalement ${i.code}. J'arrive.`)} target="_blank" rel="noopener noreferrer">Prévenir le client</a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : <Empty>Aucune intervention en cours.</Empty>)}
      {tab === "hist" && <Table head={["Code", "Nature", "Bien", "Rapport", "Date"]} empty="Aucune intervention terminée." rows={hist.map((i) => [<Code key="c">{i.code}</Code>, i.type, i.ref, i.rapport || "—", fdate(i.t)])} />}
      {tab === "devis" && <Devis S={S} meId={me?.id} />}
      {tab === "profil" && <Profil me={me} />}
    </>
  );
}

function Rapport({ code }: { code: string }) {
  const [t, setT] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); closeIncident(code, t.trim()); }} style={{ display: "grid", gap: 8 }}>
      <label className="f">Rapport d&apos;intervention<textarea value={t} onChange={(e) => setT(e.target.value)} required placeholder="Travaux réalisés, pièces changées" /></label>
      <button className="btn ok sm" type="submit">Clôturer avec rapport</button>
    </form>
  );
}

function Devis({ S, meId }: { S: Demo; meId?: string }) {
  if (!meId) return <Empty>Votre compte n&apos;est pas relié à une fiche prestataire.</Empty>;
  const me = S.providers.find((p) => p.id === meId)!;
  const Q = S.quotes.filter((q) => q.prest === meId).sort((a, b) => b.t - a.t);
  const accept = (code: string) => mutate((s) => { const q = s.quotes.find((x) => x.code === code); if (q && q.prest === meId) { q.status = "accepté"; notify(s, q.by, `${me.name} a accepté votre demande ${q.code} et prépare son devis.`); } });
  const refuse = (code: string) => mutate((s) => { const q = s.quotes.find((x) => x.code === code); if (q && q.prest === meId) { q.status = "reçu"; q.prest = null; q.prestEmail = null; notifyAdmins(s, `${me.name} a refusé la demande ${q.code} : à réattribuer.`, "presta"); logAct(s, `${me.name} refuse le devis ${q.code}`); } });
  const send = (code: string, e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget), a = parseInt(String(f.get("amount")).replace(/\D/g, ""), 10);
    if (!(a > 0)) return;
    mutate((s) => { const q = s.quotes.find((x) => x.code === code); if (q && q.prest === meId) { q.amount = a; q.delay = String(f.get("delay")); q.status = "devis envoyé"; notify(s, q.by, `Devis ${q.code} reçu : ${fcfa(a)}, délai ${q.delay}.`); } });
  };
  return (
    <>
      <p className="note" style={{ marginBottom: 14 }}>Vous ne voyez que les demandes attribuées par Immo Bell ou choisies par le client. Les coordonnées du client restent chez Immo Bell : répondez ici.</p>
      {Q.length ? Q.map((q) => (
        <article key={q.code} className="box" style={{ marginBottom: 12 }}>
          <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}>
            <div><Code>{q.code}</Code> <b>{q.type}{q.pack ? " · " + q.pack : ""}</b><div className="small muted">{q.from}{q.to ? " → " + q.to : ""} · pour le {q.date || "—"}</div></div>
            <Pill s={q.status} />
          </div>
          <p className="small">{q.note || "Aucun détail."}</p>
          {q.status === "attribué" && <div className="acts"><button className="btn ok sm" onClick={() => accept(q.code)}>Accepter la demande</button><button className="btn ghost sm" onClick={() => refuse(q.code)}>Refuser</button></div>}
          {q.status === "accepté" && (
            <form className="cols2" onSubmit={(e) => send(q.code, e)}>
              <label className="f">Montant du devis (FCFA)<input name="amount" inputMode="numeric" required /></label>
              <label className="f">Délai d&apos;exécution<input name="delay" required placeholder="Ex. 3 jours" /></label>
              <button className="btn sm" type="submit" style={{ gridColumn: "1/-1", justifySelf: "start" }}>Envoyer le devis</button>
            </form>
          )}
          {q.amount ? <p className="small"><b>Devis envoyé :</b> {fcfa(q.amount)} · {q.delay}</p> : null}
        </article>
      )) : <Empty>Aucune demande de devis pour l&apos;instant.</Empty>}
    </>
  );
}

function Profil({ me }: { me?: Demo["providers"][number] }) {
  const [ok, setOk] = useState(false);
  if (!me) return <Empty>Aucune fiche prestataire.</Empty>;
  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    mutate((s) => { const p = s.providers.find((x) => x.id === me.id); if (p) { p.zone = String(f.get("zone")); p.phone = String(f.get("phone")); p.tarif = String(f.get("tarif")); p.dispo = String(f.get("dispo")); logAct(s, `Profil mis à jour : ${p.name}`); } });
    setOk(true);
  };
  return (
    <form className="box" style={{ maxWidth: 560 }} onSubmit={save}>
      <b>{me.name}</b><p className="small muted">{me.metier} · {me.status === "agréé" ? "agréé par Immo Bell" : "en attente d'agrément"}</p>
      <label className="f">Zones d&apos;intervention<input name="zone" defaultValue={me.zone} required /></label>
      <label className="f">Téléphone<input name="phone" defaultValue={me.phone} required /></label>
      <label className="f">Tarifs indicatifs<input name="tarif" defaultValue={me.tarif ?? ""} maxLength={120} /></label>
      <label className="f">Disponibilité<select name="dispo" defaultValue={me.dispo}><option value="disponible">Disponible</option><option value="indisponible">Indisponible</option></select></label>
      <button className="btn" type="submit" style={{ justifySelf: "start" }}>Enregistrer</button>
      {ok && <p role="status" className="small" style={{ color: "var(--ok-t)" }}>Profil enregistré.</p>}
      <Note>Un changement de zone ou d&apos;activité est contrôlé par l&apos;équipe Immo Bell.</Note>
    </form>
  );
}
