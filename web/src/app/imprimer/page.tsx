import type { Metadata } from "next";
import Link from "next/link";
import { CONTRATS } from "@/lib/demo/contrats";
import { DOCUMENTS, SERVICES } from "@/lib/demo/fiches";

export const metadata: Metadata = { title: "Fiches à imprimer", description: "Fiches des services Immo Bell et documents à remplir, au format A4." };

export default function Page() {
  return (
    <section className="section">
      <h1 style={{ fontSize: "1.8rem" }}>Fiches à imprimer</h1>
      <p className="muted" style={{ maxWidth: "62ch", margin: "8px 0 22px" }}>Format A4 avec le logo Immo Bell. Ouvrez une fiche puis « Imprimer / enregistrer en PDF ».</p>
      <h2 style={{ fontSize: "1.15rem", margin: "18px 0 10px" }}>Nos services</h2>
      <ul className="small" style={{ columns: 2, columnGap: 32, lineHeight: 2 }}>{SERVICES.map((s) => <li key={s.slug}><Link href={`/imprimer/service/${s.slug}`}>{s.title}</Link></li>)}</ul>
      <h2 style={{ fontSize: "1.15rem", margin: "22px 0 10px" }}>Documents à remplir</h2>
      <ul className="small" style={{ lineHeight: 2 }}>{DOCUMENTS.map((d) => <li key={d.slug}><Link href={`/imprimer/document/${d.slug}`}>{d.title}</Link> <span className="muted">· {d.sub}</span></li>)}</ul>
      <h2 style={{ fontSize: "1.15rem", margin: "22px 0 10px" }}>Contrats de travail</h2>
      <ul className="small" style={{ lineHeight: 2 }}>{CONTRATS.map((c) => <li key={c.slug}><Link href={`/imprimer/contrat/${c.slug}`}>{c.title}</Link></li>)}</ul>
      <p className="note" style={{ marginTop: 8, maxWidth: "70ch" }}>Modèles à compléter, rédigés d&apos;après le Code du travail du Cameroun (loi n° 92/007 du 14 août 1992). À faire valider par un juriste ou un avocat avant tout usage.</p>
      <p className="muted small" style={{ marginTop: 22 }}>La fiche d&apos;un bien se trouve sur sa page (« Imprimer la fiche »), celle d&apos;un dossier dans « Mon espace ».</p>
    </section>
  );
}
