"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ACTS, ASS_D, METIERS, PACKS, QUARTS } from "@/lib/demo/consts";
import { code, logAct, mutate, notify, notifyAdmins, useDemo } from "@/lib/demo/store";
import { openModal, toast } from "@/lib/demo/ui";
import { Empty, Figs, Note, Pill, Tabs, Xic } from "./common";

const TABS = [["prest", "Prestations"], ["metier", "Cœur de métier"], ["offres", "Offres de gestion"], ["logistique", "Logistique"], ["urgences", "Urgences"]] as const;
type Tab = (typeof TABS)[number][0];

const Mini = ({ title, children, style }: { title: string; children?: ReactNode; style?: React.CSSProperties }) => <div style={style}><h3>{title}</h3>{children}</div>;
const Sm = ({ children }: { children: ReactNode }) => <p className="muted small">{children}</p>;
const H2 = ({ children }: { children: ReactNode }) => <h2 style={{ fontSize: "1.6rem", marginBottom: 18 }}>{children}</h2>;
const Opts = ({ list }: { list: readonly string[] }) => <>{list.map((x) => <option key={x}>{x}</option>)}</>;

export function ServicesView({ initial, metier, pack: pack0 }: { initial: Tab; metier?: string; pack?: string }) {
  const [tab, setTab] = useState<Tab>(initial);
  const [m, setM] = useState(metier && METIERS.includes(metier) ? metier : METIERS[0]);
  const [pack, setPack] = useState(PACKS.some((x) => x.k === pack0) ? pack0! : "Classique");
  const [prest, setPrest] = useState("");
  /* Arrivée depuis l'accueil avec une prestation choisie : on amène directement au formulaire de devis. */
  useEffect(() => { if (metier) setTimeout(() => document.getElementById("x-devis")?.scrollIntoView({ behavior: "smooth" }), 400); }, [metier]);
  const pick = (mk: string, p?: string, pr?: string) => {
    setTab("prest"); setM(mk); if (p) setPack(p); setPrest(pr ?? "");
    setTimeout(() => document.getElementById("x-devis")?.scrollIntoView({ behavior: "smooth" }), 60);
  };
  return (
    <section className="section">
      <div className="phero">
        <div>
          <h2 style={{ margin: "8px 0 12px" }}>Gérer, entretenir, valoriser</h2>
          <p className="muted" style={{ maxWidth: "64ch", marginBottom: 28 }}>Immo Bell recense les biens de Bonanjo, prend en charge la gestion locative et assure un suivi réactif. Les bailleurs gagnent du temps, les locataires un service à la hauteur du quartier.</p>
        </div>
        <Figs names={["ch_proprietaire", "ch_technicien"]} />
      </div>
      <Tabs label="Services" tabs={TABS} value={tab} onChange={setTab} />
      {tab === "prest" && <Prestations m={m} setM={setM} pack={pack} setPack={setPack} prest={prest} setPrest={setPrest} pick={pick} />}
      {tab === "metier" && <Metier />}
      {tab === "offres" && <Offres />}
      {tab === "logistique" && <Logistique />}
      {tab === "urgences" && <Urgences />}
    </section>
  );
}

function useNeedLogin(msg: string) {
  const S = useDemo();
  return () => { if (S.user) return false; openModal({ k: "auth", m: "login" }); toast(msg); return true; };
}

/* ---------- Prestations ---------- */
function Prestations({ m, setM, pack, setPack, prest, setPrest, pick }: {
  m: string; setM: (v: string) => void; pack: string; setPack: (v: string) => void; prest: string; setPrest: (v: string) => void; pick: (m: string, p?: string, pr?: string) => void;
}) {
  const S = useDemo(), need = useNeedLogin("Connectez-vous pour demander un devis.");
  const prov = S.providers.filter((p) => p.status === "agréé" && p.metier === m);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (need()) return;
    const f = new FormData(e.currentTarget), v = (k: string) => String(f.get(k) ?? "").trim(), c = code("DEV");
    mutate((s) => {
      const q = { code: c, type: m, pack: v("pack") || null, milieu: v("milieu") || null, from: v("from"), to: v("to"), date: v("date"), phone: v("phone"), note: v("note"), status: "reçu", by: s.user!.email || s.user!.phone || "", t: Date.now(), prest: null as string | null, prestEmail: null as string | null };
      const p = s.providers.find((x) => x.id === v("prest"));
      if (p && p.status === "agréé") { q.prest = p.id; q.prestEmail = p.email; q.status = "attribué"; notify(s, p.email, `Nouvelle demande de devis ${c} (${m}).`); }
      s.quotes.unshift(q);
      notifyAdmins(s, `Nouvelle demande de devis ${c} : ${m}${q.pack ? " · " + q.pack : ""}.`, "presta");
      logAct(s, `Nouvelle demande de devis ${c}`);
    });
    setPrest(""); e.currentTarget.reset(); toast(`Demande ${c} envoyée. Suivez-la dans « Mon espace ».`);
  };
  return (
    <>
      <p className="muted" style={{ maxWidth: "68ch", marginBottom: 22 }}>Immo Bell ne se limite pas à la gestion locative : six activités pour entretenir, déménager, construire et assainir. Deux services sont mis en avant.</p>
      <div className="xflag one" style={{ marginBottom: 22 }}>
        <article className="xcard gold" id="x-dem">
          <div className="xcap"><Xic k="truck" s={30} /><span className="eyebrow">Service phare</span></div>
          <h3>Déménagement et aménagement</h3><p className="muted">Trois produits, du plus simple au plus complet.</p>
          <div className="xpk">
            {PACKS.map((p) => (
              <div key={p.k} className={`xpack ${p.feat ? "feat" : ""}`}>
                <div className="row between"><b>{p.k}</b>{p.feat && <Pill s="Le plus complet" k="réservé" />}</div>
                <p className="small muted">{p.d}</p>
                <ul>{p.inc.map((i) => <li key={i}>{i}</li>)}</ul>
                <button className={`btn ${p.feat ? "accent" : "ghost"} sm`} onClick={() => pick(METIERS[0], p.k)}>Devis {p.k}</button>
              </div>
            ))}
          </div>
        </article>
        <article className="xcard gold" id="x-ass">
          <div className="xcap"><Xic k="drop" s={30} /><span className="eyebrow">Service phare</span></div>
          <h3>Assainissement en milieu professionnel et privé</h3><p className="muted">{ASS_D}</p>
          <div className="xpk one">
            <div className="xpack"><b>Milieu professionnel</b><p className="small muted">Bureaux, commerces, restaurants, entrepôts : contrat d&apos;entretien ou intervention ponctuelle.</p></div>
            <div className="xpack"><b>Milieu privé</b><p className="small muted">Logements, villas, copropriétés : diagnostic, curage, vidange.</p></div>
          </div>
          <div className="acts"><button className="btn accent" onClick={() => pick(METIERS[1])}>Demander un devis</button></div>
          <Note>Le contenu détaillé de ces formules est à confirmer avec l&apos;équipe.</Note>
        </article>
      </div>
      <h2 style={{ fontSize: "1.3rem", margin: "8px 0 14px" }}>Nos autres activités</h2>
      <div className="xrow" style={{ marginBottom: 30 }}>
        {ACTS.map((a) => (
          <article key={a.k} className="xmini static"><Xic k={a.ic} s={22} /><b>{a.k}</b><span className="small muted">{a.d}</span><button className="btn ghost sm" onClick={() => pick(a.k)}>Demander un devis</button></article>
        ))}
      </div>
      <div className="sim" id="x-devis">
        <form className="panel" onSubmit={submit}>
          <div className="eyebrow">Demander un devis</div>
          <label className="f">Prestation<select name="metier" value={m} onChange={(e) => { setM(e.target.value); setPrest(""); }}>{METIERS.map((x) => <option key={x}>{x}</option>)}</select></label>
          {m === METIERS[0] ? (
            <>
              <label className="f">Formule<select name="pack" value={pack} onChange={(e) => setPack(e.target.value)}>{PACKS.map((p) => <option key={p.k}>{p.k}</option>)}</select></label>
              <div className="cols2"><label className="f">Départ<select name="from"><Opts list={QUARTS} /></select></label><label className="f">Arrivée<select name="to"><Opts list={QUARTS} /></select></label></div>
            </>
          ) : <label className="f">Lieu de l&apos;intervention<select name="from"><Opts list={QUARTS} /></select></label>}
          {m === METIERS[1] && <label className="f">Milieu<select name="milieu"><option>Professionnel</option><option>Privé</option></select></label>}
          <div className="cols2"><label className="f">Date souhaitée<input name="date" type="date" required /></label><label className="f">Téléphone<input name="phone" inputMode="tel" required placeholder="6 XX XX XX XX" /></label></div>
          <label className="f">Prestataire<select name="prest" value={prest} onChange={(e) => setPrest(e.target.value)}><option value="">Immo Bell choisit pour vous</option>{prov.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="f">Détails<textarea name="note" placeholder="Volume, étage, surface, contraintes d'accès…" /></label>
          <button className="btn accent" type="submit">Envoyer la demande</button>
        </form>
        <div className="panel"><div className="eyebrow">Comment ça se passe</div>
          <div className="kv"><div><span>1. Demande</span><b>Code DEV-…</b></div><div><span>2. Prestataire</span><b>Attribué ou choisi par vous</b></div><div><span>3. Devis</span><b>Reçu dans votre espace</b></div></div>
          <p className="note">Vos coordonnées restent chez Immo Bell : le prestataire vous répond par la plateforme.</p></div>
      </div>
      <h2 style={{ fontSize: "1.3rem", margin: "34px 0 6px" }}>Prestataires agréés : {m}</h2>
      <p className="small muted" style={{ marginBottom: 14 }}>Chaque prestataire est ajouté et contrôlé par l&apos;équipe Immo Bell. Vous les contactez par une demande de devis.</p>
      <div className="xrow">
        {prov.length ? prov.map((p) => (
          <article key={p.id} className="xmini static"><b>{p.name}</b><span className="small muted">{p.metier} · {p.zone}</span><span className="small">{p.tarif || "Devis sur demande"}</span>
            <span className={`pill ${p.dispo === "disponible" ? "validé" : "réservé"}`}>{p.dispo === "disponible" ? "Disponible" : "Indisponible"}</span>
            <button className="btn ghost sm" onClick={() => pick(p.metier, undefined, p.id)}>Demander un devis</button></article>
        )) : <Empty>Aucun prestataire agréé pour cette activité pour le moment.</Empty>}
      </div>
    </>
  );
}

/* ---------- Cœur de métier ---------- */
function Metier() {
  const P = [["Gestion locative", "Location vide, meublée, saisonnière, colocation, bail de mobilité et location-gérance."], ["Vente de biens immobiliers", "Estimation juste, constitution du dossier technique et sécurisation juridique."], ["Salubrité et maintenance", "Gestion de la salubrité immobilière et maintenance de l'appareillage."], ["Suivi de la gestion locative", "Un point de contact unique pour le bailleur, de l'entrée à la sortie du locataire."], ["Crédit-bail immobilier", "Financement et construction."]];
  const V = [["Nettoyage dédié", "Entreprise de nettoyage au standard hôtelier, avant et après chaque location."], ["Service après-vente réactif", "Intervention sous 24 h selon le profil et l'urgence. SAV joignable de 8 h à 18 h."], ["Guide touristique et business", "Conciergerie pour les locataires de court séjour : orientation vers les loisirs et la culture de Douala."], ["Système d'évaluation", "Notation transparente des biens, des locataires et des propriétaires. Cette démonstration permet de noter les biens."]];
  return (
    <>
      <div className="sim" style={{ marginBottom: 48 }}>
        <div className="panel"><div className="eyebrow">Constat à Bonanjo</div>
          <ul className="muted" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}><li>Biens de haut standing non recensés au sein du Canton Bell</li><li>Gestion locative chronophage pour les bailleurs et propriétaires</li><li>Pas de service après-vente réactif ni de nettoyage professionnel</li><li>Aucune visibilité premium en ligne</li></ul></div>
        <div className="panel"><div className="eyebrow">Notre solution</div>
          <ul className="muted" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}><li>Recensement complet et base de données géo-référencée des biens</li><li>Délégation de gestion et permanence Immo Bell</li><li>Maintenance de l&apos;appareillage de salubrité et autres prestations</li><li>Un site web : cette plateforme</li><li>Service après-vente de 8 h à 18 h</li></ul></div>
      </div>
      <H2>Cœur de métier</H2>
      <div className="mini" style={{ marginBottom: 48 }}>{P.map(([a, b]) => <Mini key={a} title={a}><Sm>{b}</Sm></Mini>)}</div>
      <H2>Services premium inclus</H2>
      <div className="mini">{V.map(([a, b]) => <Mini key={a} title={a}><Sm>{b}</Sm></Mini>)}</div>
    </>
  );
}

/* ---------- Offres de gestion ---------- */
function Offres() {
  const router = useRouter();
  const K = [["Basic", "8 %", "Encaissement des loyers, quittances, rapport simplifié.", false], ["Standard", "12 %", "Basic, plus mise en ligne, visites et entretien courant.", false], ["Premium", "18 %", "Standard, plus locaux commerciaux et maintenance prioritaire.", true], ["Diaspora", "18 % + 25 000 F / mois", "Premium, plus rapport vidéo et visioconférence trimestrielle.", false]] as const;
  const W = [["Dossiers vérifiés", "Chaque locataire est étudié par le pôle juridique : pièces, solvabilité, garant."], ["Annonces contrôlées", "Photos réelles et informations validées par l'administrateur sous 72 h."], ["Mandat encadré", "Convention de mandat de gestion validée par un avocat."], ["Suivi transparent", "Rapport digital, notifications et code de référence pour chaque demande."]];
  void router;
  return (
    <>
      <p className="muted" style={{ maxWidth: "64ch", marginBottom: 24 }}>Quatre packs de gestion pour confier un bien à Immo Bell, sans remise offerte. Les tarifs sont affichés avant toute signature, avec un rapport digital pour suivre votre bien.</p>
      <div className="mini" style={{ marginBottom: 20 }}>
        {K.map(([a, b, d, f]) => (
          <div key={a} style={f ? { borderColor: "var(--gold)", borderWidth: 2 } : undefined}>
            <span className="eyebrow">Pack</span><h3>{a}</h3><div className="price">{b}</div><p className="muted small">{d}</p>
            <button className="btn ghost sm" style={{ justifySelf: "start" }} onClick={() => openModal({ k: "auth", m: "signup" })}>Confier mon bien</button>
          </div>
        ))}
      </div>
      <p className="note" style={{ marginBottom: 40 }}>Taux d&apos;honoraires indicatifs, à confirmer avant le lancement. Possibilité de passer du pack Basic au Premium après trois mois.</p>
      <H2>Pourquoi nous confier votre bien</H2>
      <div className="mini">{W.map(([a, b]) => <Mini key={a} title={a}><Sm>{b}</Sm></Mini>)}</div>
      <p className="muted small" style={{ marginTop: 20 }}>Vous êtes à l&apos;étranger ? Le pack Diaspora vous donne un rapport vidéo et une visioconférence chaque trimestre.</p>
    </>
  );
}

/* ---------- Logistique ---------- */
function Logistique() {
  const need = useNeedLogin("Connectez-vous pour demander un devis.");
  const L = [["Location de véhicules", "Location sous 24 h et location-gérance de petits véhicules et fourgonnettes.", "Sur demande"], ["Déménagements", "Avant ou après location. Contrat de déménagement avec fiche d'inventaire en annexe, devis signé et suivi de l'engagement.", "Dès le 30 octobre 2026"], ["Achats à l'international", "Achat et acheminement de matériel depuis l'étranger, par exemple la Chine.", "Sur devis"], ["Flotte Yango Immo Bell", "Toyota Yaris pour Yango, en location ou en taxi.", "Lancement prévu le 1er janvier 2027"]];
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (need()) return;
    const f = new FormData(e.currentTarget), v = (k: string) => String(f.get(k) ?? "").trim(), c = code("DEV");
    mutate((s) => {
      s.quotes.unshift({ code: c, type: v("type"), from: v("from"), to: v("to"), date: v("date"), phone: v("phone"), note: v("note"), status: "reçu", by: s.user!.email || s.user!.phone || "", t: Date.now() });
      notify(s, s.user!.email, `Demande de devis ${c} reçue. Réponse sous 48 h.`); logAct(s, `Nouvelle demande de devis ${c}`);
    });
    e.currentTarget.reset(); toast(`Demande envoyée. Code : ${c}`);
  };
  return (
    <>
      <p className="muted" style={{ maxWidth: "64ch", marginBottom: 24 }}>Immo Bell prolonge la gestion immobilière par une offre logistique dans la zone de Douala 1er : Bonanjo, Bonapriso, Akwa, Deido et Bali. Elle s&apos;adresse aux riverains, aux bailleurs et propriétaires, aux cadres et aux expatriés.</p>
      <div className="mini" style={{ marginBottom: 40 }}>{L.map(([a, b, d]) => <Mini key={a} title={a}><Sm>{b}</Sm><span className="pill réservé">{d}</span></Mini>)}</div>
      <div className="sim">
        <form className="panel" onSubmit={submit}><div className="eyebrow">Demander un devis</div>
          <label className="f">Prestation<select name="type"><option>Déménagement</option><option>Location de véhicule</option><option>Achat à l&apos;international</option><option>Autre besoin logistique</option></select></label>
          <div className="cols2"><label className="f">Départ<select name="from"><Opts list={QUARTS} /></select></label><label className="f">Arrivée<select name="to"><Opts list={QUARTS} /></select></label></div>
          <div className="cols2"><label className="f">Date souhaitée<input name="date" type="date" required /></label><label className="f">Téléphone<input name="phone" inputMode="tel" required placeholder="6 XX XX XX XX" /></label></div>
          <label className="f">Détails<textarea name="note" placeholder="Volume, étage, véhicule souhaité, produits à acheter" /></label>
          <button className="btn accent" type="submit">Envoyer la demande</button></form>
        <div className="panel"><div className="eyebrow">Comment ça se passe</div>
          <div className="kv"><div><span>1. Demande</span><b>Code DEV-…</b></div><div><span>2. Devis</span><b>Envoyé par Immo Bell</b></div><div><span>3. Signature</span><b>Suivi de l&apos;engagement</b></div></div>
          <p className="note">Le pôle juridique rédige le contrat et assure le suivi des engagements.</p></div>
      </div>
    </>
  );
}

/* ---------- Urgences ---------- */
function Urgences() {
  const S = useDemo(), need = useNeedLogin("Connectez-vous pour signaler une urgence.");
  const pub = S.props.filter((p) => p.validation === "validé");
  const U = [["Signalement", "Via le numéro unique Immo Bell ou le formulaire ci-dessous."], ["Analyse", "Selon le type de profil (locataire, propriétaire) et la nature de l'urgence."], ["Dispatch", "Vers un prestataire agréé : plomberie, électricité, serrurerie, sous 24 h."], ["Clôture", "Rapport d'intervention et évaluation du SAV pour la traçabilité."]];
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (need()) return;
    const f = new FormData(e.currentTarget), v = (k: string) => String(f.get(k) ?? "").trim(), c = code("URG");
    mutate((s) => {
      s.incidents.unshift({ code: c, ref: v("ref"), type: v("type"), profil: v("profil"), desc: v("desc"), phone: v("phone"), level: v("niv"), status: "reçu", prest: "", by: s.user!.email || s.user!.phone || "", t: Date.now() });
      notify(s, s.user!.email, `Signalement ${c} reçu. Analyse en cours.`); notifyAdmins(s, `Nouvelle urgence ${c} : ${v("type")}.`, "urg"); logAct(s, `Nouveau signalement ${c}`);
    });
    e.currentTarget.reset(); toast(`Signalement envoyé. Code : ${c}`);
  };
  return (
    <>
      <div className="flow" style={{ marginBottom: 28 }}>{U.map(([a, b], i) => <div key={a}><span className="eyebrow">Étape {i + 1}</span><b>{a}</b><span className="muted small">{b}</span></div>)}</div>
      <div className="sim">
        <form className="panel" onSubmit={submit}><div className="eyebrow">Signaler une urgence</div>
          <div className="cols2"><label className="f">Nature<select name="type"><option>Plomberie</option><option>Électricité</option><option>Serrurerie</option><option>Autre</option></select></label><label className="f">Votre profil<select name="profil"><option>Locataire</option><option>Propriétaire</option><option>Autre</option></select></label></div>
          <div className="cols2"><label className="f">Niveau<select name="niv"><option>Urgent</option><option>Sous 24 h</option><option>Non urgent</option></select></label><label className="f">Téléphone<input name="phone" inputMode="tel" required placeholder="6 XX XX XX XX" /></label></div>
          <label className="f">Bien concerné<select name="ref">{pub.map((p) => <option key={p.ref} value={p.ref}>{p.ref} · {p.title}</option>)}</select></label>
          <label className="f">Description<textarea name="desc" required placeholder="Que se passe-t-il ?" /></label>
          <button className="btn accent" type="submit">Envoyer le signalement</button></form>
        <div className="panel"><div className="eyebrow">Contact Immo Bell</div>
          <div className="kv"><div><span>Email</span><b>contact@immobell.cm</b></div><div><span>Adresse</span><b>Bonanjo, Douala</b></div><div><span>Service après-vente</span><b>8 h à 18 h</b></div><div><span>Numéro unique</span><b>à communiquer</b></div></div>
          <p className="note">Connectez-vous pour suivre l&apos;état de vos signalements dans « Mon espace ».</p></div>
      </div>
    </>
  );
}
