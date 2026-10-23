"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ACTS, ASS_D, PACKS, METIERS, fcfa } from "@/lib/demo/consts";
import { searchFor, setFilters } from "@/lib/demo/filters";
import { Ic } from "@/lib/demo/icons";
import { CHAR, TEAM, TYPES, pub, shortP } from "@/lib/demo/props";
import { QUART } from "@/lib/demo/svg";
import { loginAs, useDemo } from "@/lib/demo/store";
import { CH, Xic } from "./common";
import { Art, Card, SearchForm } from "./property";
import { HeroSphere } from "./hero-sphere";
import { openChat } from "./awa-assistant";

const WaveLine = () => (
  <svg className="wl" viewBox="0 0 520 30" aria-hidden="true" focusable="false"><path pathLength={1} d="M0 11C60 -2 120 -2 180 9S300 22 360 9 480 -2 520 8" /><path pathLength={1} d="M0 25C60 12 120 12 180 23S300 36 360 23 480 12 520 22" /></svg>
);

export function HomeView() {
  const S = useDemo(), router = useRouter();
  const P = pub(S), top = P.filter((p) => p.status === "libre").sort((a, b) => b.views - a.views).slice(0, 4);
  const types = TYPES.map((t) => [t, P.filter((p) => p.type === t)] as const).filter((x) => x[1].length);
  const qs = Object.keys(QUART).map((q) => [q, P.filter((p) => p.q === q)] as const).filter((x) => x[1].length);
  const serv = (m: string, pk?: string) => router.push(`/services?tab=prest&m=${encodeURIComponent(m)}${pk ? `&p=${pk}` : ""}`);
  const persona = (r: string) => { loginAs(r as "visitor" | "owner" | "legal" | "provider" | "admin"); router.push("/espace"); };
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">Gestion locative et valorisation immobilière à Bonanjo, Douala</div>
          <h1 style={{ marginTop: 14 }}>Un nom de prestige, une gestion d&apos;excellence</h1>
          <WaveLine />
          <p className="lead">Nous accompagnons les personnes physiques et morales dans le processus de gestion des biens meubles et immeubles à travers :</p>
          <ul className="lead" style={{ margin: "0 0 14px", paddingLeft: "1.2em" }}>
            <li>La gestion locative 360 degrés</li>
            <li>La gestion des fonds de commerce</li>
            <li>Le management des aménagements et déménagements</li>
            <li>L&apos;entretien de l&apos;appareillage et des biens</li>
          </ul>
          <div className="trust"><span><Ic n="shield" /> Dossiers vérifiés</span><span><Ic n="clock" /> Réponse sous 72 h</span><span><Ic n="phone" /> SAV de 8 h à 18 h</span></div>
          <button className="hero-ai" onClick={() => openChat()}><Ic n="spark" />Décrivez votre projet à Awa, notre conseillère IA</button>
        </div>
        <div className="hero-sphere"><HeroSphere /><p className="sph-hint">Glissez la boule pour la faire tourner</p></div>
        <div className="parts" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `-${(i * 0.53).toFixed(2)}s`, animationDuration: `${6 + (i % 5)}s`, width: 3 + (i % 4), height: 3 + (i % 4) }} />)}</div>
      </section>
      <SearchForm />
      <div className="marq" role="group" style={{ marginTop: 36 }} aria-label={`Quartiers couverts : ${Object.keys(QUART).join(", ")}`}>
        <div className="marq-t" aria-hidden="true">{[0, 1].map((k) => Object.keys(QUART).map((q) => <span key={k + q}>{q}</span>))}</div>
      </div>

      <section className="section xhome" aria-labelledby="xh-h">
        <div className="row between" style={{ gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div><div className="eyebrow">Au-delà de la gestion locative</div><h2 id="xh-h" style={{ marginTop: 6 }}>Nos services phares</h2></div>
          <button className="btn ghost" onClick={() => router.push("/services?tab=prest")}>Voir nos 6 activités</button>
        </div>
        <div className="xflag">
          <article className="xcard gold"><div className="xcap"><Xic k="truck" s={30} /><span className="eyebrow">Service phare</span></div><h3>Déménagement et aménagement</h3>
            <p className="muted">Trois formules selon votre besoin, de l&apos;unique transport au service complet.</p>
            <ul className="xpacks">{PACKS.map((p) => <li key={p.k}><b>{p.k}</b><span className="small muted">{p.d}</span></li>)}</ul>
            <div className="acts"><button className="btn accent" onClick={() => serv(METIERS[0])}>Demander un devis</button><button className="btn ghost" onClick={() => router.push("/services?tab=prest")}>Comparer les formules</button></div></article>
          <article className="xcard gold"><div className="xcap"><Xic k="drop" s={30} /><span className="eyebrow">Service phare</span></div><h3>Assainissement professionnel et privé</h3><p className="muted">{ASS_D}</p>
            <ul className="xpacks"><li><b>Entreprises</b><span className="small muted">Bureaux, commerces, restaurants, sites industriels.</span></li><li><b>Particuliers</b><span className="small muted">Logements, villas, copropriétés.</span></li></ul>
            <div className="acts"><button className="btn accent" onClick={() => serv(METIERS[1])}>Demander un devis</button></div></article>
        </div>
        <div className="xrow">{ACTS.map((a) => <button key={a.k} className="xmini" onClick={() => serv(a.k)}><Xic k={a.ic} s={22} /><b>{a.k}</b><span className="small muted">{a.d}</span></button>)}</div>
      </section>

      <section className="section"><div className="sec-head"><div><h2>Parcourir par type de bien</h2></div></div>
        <div className="hscroll">{types.map(([t, l]) => <button key={t} className="tile" onClick={() => { searchFor({ types: [t] }); router.push("/biens"); }}><div className="ti"><Art p={l[0]} /></div><b>{t}</b><span>{l.length} bien{l.length > 1 ? "s" : ""}</span></button>)}</div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="sec-head"><div><h2>Les biens les plus consultés</h2></div><button className="btn ghost" onClick={() => router.push("/biens")}>Voir tous les biens</button></div>
        <div className="grid4 grid3">{top.map((p) => <Card key={p.ref} p={p} />)}</div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="sec-head"><div><h2>Explorer Douala par quartier</h2></div></div>
        <div className="qtiles">{qs.map(([q, l], i) => <button key={q} className="qtile" onClick={() => { searchFor({ qs: [q] }); router.push("/biens"); }} style={{ "--x": `${20 + ((i * 17) % 70)}%` } as React.CSSProperties}><b>{q}</b><span>{l.length} bien{l.length > 1 ? "s" : ""} · dès {shortP(Math.min(...l.map((p) => p.price)))} FCFA</span></button>)}</div></section>
      <section className="section team" aria-labelledby="t-team"><div className="sec-head"><div><h2 id="t-team">Une équipe à vos côtés</h2><p className="muted" style={{ marginTop: 6 }}>Chaque profil a son espace. Cliquez sur un personnage pour le découvrir.</p></div></div>
        <div className="stagefig">{TEAM.map(([k, n, r, go], i) => <button key={k} className="tm" onClick={() => (go === "biens" ? router.push("/biens") : persona(go))} style={{ "--d": `${i * 0.45}s` } as React.CSSProperties}><span className="tm-fig"><img src={CH(CHAR[k])} alt="" aria-hidden="true" /></span><b>{n}</b><span>{r}</span></button>)}</div></section>
      <section className="section band"><div className="wrap"><div className="sec-head"><div><h2>Comment ça marche</h2><p className="muted" style={{ marginTop: 6 }}>Un parcours d&apos;exemple, de la recherche à la remise des clés.</p></div></div><HowItWorks /></div></section>
      <section className="section"><h2 style={{ margin: "8px 0 24px", maxWidth: "22ch" }}>La référence premium de l&apos;immobilier à Douala</h2>
        <div className="mini mini5">
          {[["Sécuriser et rentabiliser", "Le patrimoine des bailleurs et des propriétaires."], ["Un service à la hauteur de Bonanjo", "Pour les locataires : cadres, expatriés, touristes d'affaires, à court ou long terme."], ["Digitaliser la gestion locative", "Recensement géo-référencé, réservation en ligne, suivi des demandes."], ["Logistique et transport", "Déménagements, location de véhicules et achats à l'international dans la zone de Douala 1er."], ["Valoriser les terrains et maisons", "À vendre ou à valoriser à Bonanjo et en périphérie."]].map(([a, b]) => <div key={a}><h3>{a}</h3><p className="muted small">{b}</p></div>)}
        </div>
        <div className="row" style={{ marginTop: 20 }}><button className="btn" onClick={() => router.push("/services")}>Découvrir nos services</button><button className="btn ghost" onClick={() => persona("owner")}>Publier mon bien</button></div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="hero" style={{ padding: 0 }}>
        <div><h2 style={{ margin: "8px 0 14px" }}>Un dossier sécurisé, pour le bailleur comme pour le locataire</h2>
          <p className="muted" style={{ maxWidth: "56ch" }}>Vérification des pièces, mesure de la solvabilité, état des lieux contradictoire, assurance loyers impayés. Conseils sur la copropriété, le décès du locataire ou le squat.</p>
          <div className="row" style={{ marginTop: 22 }}><button className="btn" onClick={() => router.push("/juridique")}>Découvrir le pôle juridique</button><button className="btn ghost" onClick={() => router.push("/simulateur")}>Simuler mon budget</button></div></div>
        <div className="panel"><div className="eyebrow">Règle de solvabilité</div><div className="price">Loyer maximal = revenu net annuel ÷ 12 ÷ 3</div><p className="muted small">Pour 6 000 000 FCFA par an : 500 000 FCFA par mois, soit 166 667 FCFA de loyer maximal.</p></div></div></section>
    </>
  );
}

/* ---------- démonstration animée en quatre scènes ---------- */
const DEMO: [string, string][] = [["Rechercher", "immobell.cm/biens?q=akwa"], ["Déposer son dossier", "immobell.cm/reserver/IB-AKW-003"], ["Étude juridique", "immobell.cm/espace/demandes"], ["Remise des clés", "immobell.cm/espace/demandes/RES-2026-0412"]];

function HowItWorks() {
  const S = useDemo();
  const P = pub(S).filter((p) => p.q === "Akwa").slice(0, 3);
  const [i, setI] = useState(0), [play, setPlay] = useState(true), [t1, setT1] = useState(""), [t2, setT2] = useState(""), [shown, setShown] = useState(0), [bars, setBars] = useState(0), [pct, setPct] = useState(0);
  const reduced = useRef(false);
  useEffect(() => { reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduced.current) setPlay(false); }, []);
  /* Chaque scène déroule ses effets avec des minuteries nettoyées au changement de scène. */
  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [], rm = reduced.current;
    const later = (f: () => void, ms: number) => ts.push(setTimeout(f, rm ? 0 : ms));
    setShown(0); setBars(0); setPct(0);
    if (i === 0) [1, 2, 3].forEach((n, k) => later(() => setShown(n), 300 + k * 280));
    if (i === 1) {
      const type = (txt: string, set: (s: string) => void, ms: number, cb: () => void) => { if (rm) { set(txt); cb(); return; } let k = 0; const st = () => { set(txt.slice(0, ++k)); if (k < txt.length) ts.push(setTimeout(st, ms)); else cb(); }; st(); };
      setT1(""); setT2("");
      type("Natacha Biyick", setT1, 45, () => type("Étudiante, avec garant", setT2, 35, () => [1, 2, 3, 4].forEach((n, k) => later(() => setShown(n), 200 + k * 260))));
    }
    if (i === 2) { later(() => setBars(1), 150); later(() => setShown(1), 1300); if (rm) setPct(1); else { const t0 = performance.now() + 150; let raf = 0; const st = (t: number) => { const k = Math.max(0, Math.min(1, (t - t0) / 1000)); setPct(k); if (k < 1) raf = requestAnimationFrame(st); }; raf = requestAnimationFrame(st); ts.push(setTimeout(() => cancelAnimationFrame(raf), 2000)); } }
    if (i === 3) { later(() => setShown(1), 200); later(() => setShown(2), 900); }
    return () => ts.forEach(clearTimeout);
  }, [i]);
  useEffect(() => { if (!play) return; const id = setInterval(() => setI((x) => (x + 1) % 4), 5600); return () => clearInterval(id); }, [play]);
  const [path, last] = [DEMO[i][1].replace(/(\/[^/]*)$/, ""), DEMO[i][1].match(/(\/[^/]*)$/)?.[1] ?? ""];
  return (
    <div className="demo" id="demo">
      <div className="dbar"><div className="dots" aria-hidden="true"><span /><span /><span /></div><div className="durl">{path}<b>{last}</b></div></div>
      <div className="dstage">
        <div className={`dscene ${i === 0 ? "on" : ""}`}><span className="lbl">1 · Rechercher</span><div className="dfields"><div><label>Où ?</label><div className="dval">Akwa</div></div><div><label>Budget max</label><div className="dval">150 000 FCFA</div></div></div>
          {P.map((p, k) => <div key={p.ref} className={`drow ${i === 0 && shown > k ? "show" : ""}`}><Art p={p} /><div><b className="small">{p.title}</b><div className="small muted">{p.type} · {p.surface} m²</div></div><b className="small num">{fcfa(p.price)}</b></div>)}</div>
        <div className={`dscene ${i === 1 ? "on" : ""}`}><span className="lbl">2 · Déposer son dossier</span><div className="dfields"><div><label>Nom</label><div className={`dval ${i === 1 && t1.length < 14 ? "typing" : ""}`}>{t1}</div></div><div><label>Situation</label><div className="dval">{t2}</div></div></div>
          <div className="dchk">{["CNI ou passeport", "Certificat de scolarité", "Titre de séjour valide", "Dossier du garant solidaire"].map((x, k) => <div key={x} className={i === 1 && shown > k ? "show" : ""}><i>✓</i>{x}</div>)}</div></div>
        <div className={`dscene ${i === 2 ? "on" : ""}`}><span className="lbl">3 · Étude juridique sous 72 h</span>
          <div className="dscores">{[["Pièces du dossier", 100], ["Solvabilité du garant", 92], ["Ancien bailleur contacté", 100]].map(([a, v]) => <div key={a} className="dscore"><span>{a}</span><span className="tr"><i style={{ width: bars ? `${v}%` : 0 }} /></span><b>{Math.round(+v * pct)} %</b></div>)}</div>
          <div className={`dflag ${i === 2 && shown ? "show" : ""}`}>Dossier validé en 46 h, notification envoyée</div></div>
        <div className={`dscene ${i === 3 ? "on" : ""}`}><span className="lbl">4 · Remise des clés</span>
          <Ic n="key" className={`dkey ${i === 3 && shown > 0 ? "show" : ""}`} />
          <div className={`dtoast ${i === 3 && shown > 1 ? "show" : ""}`}><span className="av">✓</span><div><b>État des lieux contradictoire signé</b><div className="small muted">Bail signé avec Natacha. Code RES-2026-0412 clôturé, clés remises.</div></div></div></div>
      </div>
      <div className="dctl">
        <button type="button" onClick={() => setI((i + 3) % 4)} aria-label="Étape précédente"><Ic n="left" className="sm" /></button>
        <div className="ddots">{DEMO.map((d, k) => <button key={d[0]} type="button" onClick={() => setI(k)} aria-label={`Étape ${k + 1} : ${d[0]}`} aria-current={k === i} />)}</div>
        <button type="button" onClick={() => setI((i + 1) % 4)} aria-label="Étape suivante"><Ic n="right" className="sm" /></button>
        <button type="button" onClick={() => setPlay(!play)} aria-label={play ? "Mettre en pause" : "Lire la démo"}><Ic n={play ? "pause" : "play"} className="sm" /></button>
        <span className="lab" aria-live="polite">{DEMO[i][0]}</span>
      </div>
    </div>
  );
}

void setFilters;
