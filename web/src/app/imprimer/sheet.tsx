"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DOCS, SITU, STAGES, fcfa } from "@/lib/demo/consts";
import { contratBySlug } from "@/lib/demo/contrats";
import { DOCUMENTS, serviceBySlug } from "@/lib/demo/fiches";
import { unit } from "@/lib/demo/props";
import { useDemo } from "@/lib/demo/store";
import "./print.css";

const today = () => new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const Blank = ({ w }: { w?: number }) => <span className="fill" style={w ? { minWidth: `${w}mm` } : undefined} />;

/** Feuille A4 avec l'en-tête Immo Bell ; la barre du haut (impression, retour) n'apparaît pas sur le papier. */
function Sheet({ kind, title, children }: { kind: string; title: string; children: ReactNode }) {
  return (
    <div className="pfade">
      <div className="pbar"><button onClick={() => window.print()}>Imprimer / enregistrer en PDF</button><Link href="/imprimer">Toutes les fiches</Link></div>
      <article className="psheet">
        <header>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Immo Bell" />
          <div><span className="pk">{kind}</span><h1>{title}</h1></div>
        </header>
        {children}
        <footer><span>Immo Bell · Bonanjo, Douala · contact@immobell.cm · Service après-vente : 8 h à 18 h</span><span>Édité le {today()}</span></footer>
      </article>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: ReactNode }) => <tr><th>{k}</th><td>{v}</td></tr>;
const Missing = ({ what }: { what: string }) => <Sheet kind="Fiche" title="Introuvable"><p>{what} n&apos;existe pas ou n&apos;est pas accessible avec ce compte.</p></Sheet>;

export function Fiche({ kind, id }: { kind: string; id: string }) {
  const S = useDemo();
  if (kind === "service") {
    const s = serviceBySlug(id);
    if (!s) return <Missing what="Ce service" />;
    return (
      <Sheet kind={s.tag} title={s.title}>
        <p>{s.intro}</p>
        {s.blocks.map((b) => <section key={b.h}><h2>{b.h}</h2><ul>{b.li.map((x) => <li key={x}>{x}</li>)}</ul></section>)}
        {s.note && <p className="note">{s.note}</p>}
      </Sheet>
    );
  }
  if (kind === "bien") {
    const p = S.props.find((x) => x.ref === id && (x.validation === "validé" || x.owner === S.user?.email || S.user?.role === "admin" || S.user?.role === "legal"));
    if (!p) return <Missing what="Ce bien" />;
    return (
      <Sheet kind={`Fiche de bien · ${p.ref}`} title={p.title}>
        <table><tbody>
          <Row k="Type · opération" v={`${p.type} · ${p.mode}`} /><Row k="Quartier" v={`${p.q}, Douala`} />
          <Row k="Prix" v={`${fcfa(p.price)}${unit(p)}`} /><Row k="Pièces · superficie" v={`${p.rooms || "Terrain nu"} · ${p.surface} m²`} />
          <Row k="Disponibilité" v={p.status} /><Row k="Conditions" v={p.cond} />
        </tbody></table>
        <h2>Description</h2><p>{p.desc}</p>
        {p.eq.length > 0 && <><h2>Équipements</h2><ul>{p.eq.map((e) => <li key={e}>{e}</li>)}</ul></>}
        <p className="note">Dossier étudié par le pôle juridique avant attribution, réponse sous 72 h. Pour réserver : immobell.cm/biens/{p.ref}</p>
      </Sheet>
    );
  }
  if (kind === "dossier") {
    const r = S.requests.find((x) => x.code === id);
    if (!r) return <Missing what="Ce dossier" />;
    const p = S.props.find((x) => x.ref === r.ref), need = SITU[r.situation ?? "CDI"] ?? SITU.CDI;
    return (
      <Sheet kind={`Fiche de dossier · ${r.code}`} title={r.name}>
        <table><tbody>
          <Row k="Bien" v={`${p?.title ?? r.ref} (${r.ref})`} /><Row k="Date souhaitée" v={r.date} /><Row k="Téléphone" v={r.phone} />
          <Row k="Situation" v={r.situation ?? "—"} /><Row k="Revenu net mensuel" v={r.rev ? fcfa(r.rev) : "—"} /><Row k="Garant solidaire" v={r.garant ? "Oui" : "Non"} />
          <Row k="Étape" v={STAGES[r.stage ?? 0]} /><Row k="Décision" v={r.status === "refusée" ? `Rejeté : ${r.reason ?? ""}` : r.status === "validée" ? "Accepté" : "En cours d'analyse"} />
        </tbody></table>
        <h2>Pièces du dossier</h2>
        <table className="grid"><tbody>{need.map((k) => <tr key={k}><td>{DOCS[k]}</td><td style={{ width: "28mm" }}>{r.checks?.[k] ? "☑ reçue" : "☐ manquante"}</td></tr>)}</tbody></table>
        <h2>Observations de l&apos;analyste</h2><div className="box" />
        <div className="sig"><div>Analyste juridique</div><div>Date et signature</div></div>
      </Sheet>
    );
  }
  if (kind === "contrat") {
    const c = contratBySlug(id);
    if (!c) return <Missing what="Ce contrat" />;
    return (
      <Sheet kind={c.sub} title={c.title}>
        <h2>Entre les soussignés</h2>
        <h3 className="party">{c.parts[0]} · Immo Bell</h3>
        <table className="idt"><tbody>
          <Row k="Nom de l'employeur ou raison sociale" v="" /><Row k="Forme juridique · capital (FCFA)" v="" /><Row k="RCCM n° · NIU n°" v="" /><Row k="Siège" v="Bonanjo, Douala" />
          <Row k="Représentée par (nom et prénoms)" v="" /><Row k="En qualité de" v="" />
        </tbody></table>
        <h3 className="party">{c.parts[1]}</h3>
        <table className="idt"><tbody>
          <Row k="Nom et prénoms" v="" /><Row k="Né(e) le · à" v="" /><Row k="Nationalité" v="" /><Row k="CNI ou passeport n°" v="" /><Row k="Domicile" v="" /><Row k="Téléphone · e-mail" v="" />
        </tbody></table>
        <p>Il est convenu ce qui suit.</p>
        {c.articles.map((a, i) => (
          <section key={a.t} style={{ breakInside: "avoid" }}>
            <h2>Article {i + 1} · {a.t}</h2>
            {a.p.map((x) => <p key={x}>{x}</p>)}
          </section>
        ))}
        <p style={{ marginTop: 14 }}>Fait à Douala, le ____ / ____ / ________, {c.copies}.</p>
        <div className="sig"><div>{c.parts[0]}<br /><small>(nom, signature et cachet, précédés de « lu et approuvé »)</small></div><div>{c.parts[1]}<br /><small>(nom et signature, précédés de « lu et approuvé »)</small></div></div>
      </Sheet>
    );
  }
  if (kind === "document") {
    const d = DOCUMENTS.find((x) => x.slug === id);
    if (!d) return <Missing what="Ce document" />;
    if (d.slug === "etat-des-lieux") {
      return (
        <Sheet kind="Document à remplir" title={d.title}>
          <p>{d.sub}</p>
          <table><tbody><Row k="Bien" v={<Blank w={95} />} /><Row k="Bailleur" v={<Blank w={95} />} /><Row k="Locataire" v={<Blank w={95} />} /><Row k="Date · type" v="Entrée ☐   Sortie ☐   Le ____ / ____ / ________" /></tbody></table>
          <h2>Pièces</h2>
          <table className="grid"><thead><tr><th>Pièce</th><th>Sols</th><th>Murs · plafond</th><th>Équipements</th><th>Observations</th></tr></thead>
            <tbody>{["Séjour", "Chambre 1", "Chambre 2", "Cuisine", "Salle d'eau", "Toilettes", "Extérieur"].map((x) => <tr key={x}><td>{x}</td><td /><td /><td /><td /></tr>)}</tbody></table>
          <h2>Compteurs et clés</h2>
          <table><tbody><Row k="Compteur d'eau" v="Index : ______" /><Row k="Compteur d'électricité" v="Index : ______" /><Row k="Clés remises" v="Nombre : ____" /></tbody></table>
          <div className="sig"><div>Le bailleur ou l&apos;agent Immo Bell</div><div>Le locataire</div></div>
        </Sheet>
      );
    }
    if (d.slug === "devis") {
      const q = S.quotes.find((x) => x.code === id);
      return (
        <Sheet kind="Document à remplir" title={d.title}>
          <p>{d.sub}</p>
          <table><tbody><Row k="Numéro" v={<Blank w={60} />} /><Row k="Client" v={<Blank w={95} />} /><Row k="Prestataire agréé" v={<Blank w={95} />} /><Row k="Date" v="____ / ____ / ________" /></tbody></table>
          <h2>Prestation</h2>
          <table className="grid"><thead><tr><th>Désignation</th><th style={{ width: "18mm" }}>Qté</th><th style={{ width: "30mm" }}>Prix (FCFA)</th></tr></thead><tbody>{[0, 1, 2, 3, 4].map((i) => <tr key={i}><td>&nbsp;</td><td /><td /></tr>)}</tbody></table>
          <table><tbody><Row k="Total (FCFA)" v={<Blank w={60} />} /><Row k="Délai d'exécution" v={<Blank w={60} />} /></tbody></table>
          {q && <p className="note">Référence de la demande : {q.code}</p>}
          <div className="sig"><div>Bon pour accord · le client</div><div>Le prestataire</div></div>
        </Sheet>
      );
    }
    return (
      <Sheet kind="Document à remplir" title={d.title}>
        <p>{d.sub}</p>
        <table><tbody><Row k="Signalement" v={<Blank w={60} />} /><Row k="Bien" v={<Blank w={95} />} /><Row k="Nature" v="Plomberie ☐  Électricité ☐  Serrurerie ☐  Autre ☐" /><Row k="Niveau" v="Urgent ☐   Sous 24 h ☐   Planifié ☐" /><Row k="Prestataire" v={<Blank w={95} />} /><Row k="Arrivée · fin" v="____ h ____  /  ____ h ____" /></tbody></table>
        <h2>Constat</h2><div className="box" /><h2>Travaux réalisés</h2><div className="box" /><h2>Suites à prévoir</h2><div className="box" style={{ height: "14mm" }} />
        <div className="sig"><div>Le prestataire</div><div>Le client, pour réception</div></div>
      </Sheet>
    );
  }
  return <Missing what="Cette fiche" />;
}
