"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Figs, Table, Tabs } from "./common";

const TABS = [["dossier", "Étude du dossier"], ["pieces", "Pièces demandées"], ["fonds", "Fonds de commerce"], ["conseils", "Conseils"], ["procedure", "Procédure"], ["securite", "Sécurité juridique"], ["admin", "Dossiers et assurances"]] as const;
type Tab = (typeof TABS)[number][0];

type Step = { k: string; h: string; li: string[]; extra?: ReactNode };
const Steps = ({ items }: { items: Step[] }) => (
  <div className="steps">
    {items.map((s) => (
      <div key={s.h} className="step">
        <span className="k">{s.k}</span><h3>{s.h}</h3>
        <ul>{s.li.map((x) => <li key={x}>{x}</li>)}</ul>
        {s.extra}
      </div>
    ))}
  </div>
);

const CONSEILS = [["Accompagnement", "De la recherche du bien à la remise des clés, à chaque étape de la location."], ["Gestion de la copropriété", "Règles de vie commune, charges et décisions de l'immeuble."], ["Décès du locataire", "Sort du bail et du logement, héritiers et personnes à contacter."], ["Squat", "Réagir face à une occupation sans droit, avec huissier et avocat."], ["Protection contre les dégradations", "Prévenir par l'état des lieux contradictoire, le dépôt de garantie et l'assurance."], ["Partenaires mobilisables", "Avocat, huissier de justice et assurance, selon la situation."]];
const PROC: [string, string, string[]][] = [["Entrée en relation", "Étude du dossier avant attribution", ["Analyste juridique"]], ["État des lieux", "Physique et financier, signé le cas échéant", ["Bailleur", "Agent Immo Bell", "Locataire"]], ["Approbation", "Transmission du dossier, commission d'attribution pour les fonds de commerce", ["Chef de projet", "Commission d'attribution"]], ["Suivi des échéanciers", "Contrôle des paiements prévus", ["Analyste juridique"]], ["Cas particuliers", "Décès, impayés, sous-location", ["Analyste juridique", "Huissier de justice", "Avocat", "Assurance"]]];

export function JuridiqueView() {
  const [tab, setTab] = useState<Tab>("dossier");
  const router = useRouter();
  return (
    <section className="section">
      <div className="phero">
        <div>
          <h2 style={{ margin: "8px 0 8px" }}>Sécuriser chaque bail</h2>
          <p className="muted" style={{ maxWidth: "62ch", marginBottom: 28 }}>Étude des dossiers de location et des fonds de commerce, conseils au grand public, encadrement juridique interne et externe.</p>
        </div>
        <Figs names={["ch_juriste"]} />
      </div>
      <Tabs label="Pôle juridique" tabs={TABS} value={tab} onChange={setTab} />

      {tab === "dossier" && (
        <Steps items={[
          { k: "Étape 1", h: "Collecter et vérifier", li: ["Bailleur : CNI, documents de propriété, vérification des locaux", "Demandeur : identité, titre de séjour valide, avis d'imposition et NIU", "Factures et contrats du demandeur", "Contact de l'ancien bailleur pour vérifier le respect des engagements"] },
          { k: "Étape 2", h: "Mesurer la solvabilité", li: ["Revenu net et capacité locative", "Avis d'imposition", "Demande d'un dépôt de garantie"], extra: <button className="btn ghost sm" onClick={() => router.push("/simulateur")} style={{ justifySelf: "start" }}>Ouvrir le simulateur</button> },
          { k: "Étape 3", h: "Conclure", li: ["CNI des héritiers ou des personnes à contacter", "Visite et état des lieux contradictoire", "Signature du bail", "Lettre d'engagement et déclaration sur l'honneur", "Assurance loyers impayés"] },
        ]} />
      )}
      {tab === "pieces" && (
        <Steps items={[
          { k: "Situation professionnelle", h: "CDI", li: ["3 dernières fiches de paie", "Contrat de travail", "Attestation de travail effective", "Garant solidaire : étude de son dossier"] },
          { k: "Situation professionnelle", h: "CDD", li: ["Contrôle du contrat de stage", "Garant solidaire : étude de son dossier"] },
          { k: "Dans tous les cas", h: "Pièces communes", li: ["CNI ou passeport", "Titre de séjour valide", "Avis d'imposition et NIU", "Factures et contrats"] },
        ]} />
      )}
      {tab === "fonds" && (
        <>
          <Steps items={[
            { k: "Temps 1", h: "Propriétaire du fonds", li: ["CNI", "Documents de propriété", "Évaluation contradictoire des éléments corporels et incorporels"] },
            { k: "Temps 2", h: "Repreneur ou locataire", li: ["CNI ou passeport, titre de séjour valide", "Avis d'imposition et NIU", "Fiches de paie et contrat de travail", "Garant solidaire", "Analyse financière de l'activité", "Factures et contrats", "Contact de l'ancien propriétaire"] },
            { k: "Temps 3", h: "Conclusion", li: ["CNI des héritiers ou personnes à contacter", "État des lieux contradictoire si location du fonds", "Contrat de vente ou de location-gérance", "Lettre d'engagement et déclaration sur l'honneur"] },
          ]} />
          <p className="note" style={{ marginTop: 20 }}>Repères : éléments corporels = matériel, stock, agencement. Éléments incorporels = clientèle, enseigne, droit au bail.</p>
        </>
      )}
      {tab === "conseils" && (
        <div style={{ display: "grid" }}>
          {CONSEILS.map(([a, b], i) => <details key={a} open={i === 0}><summary>{a}</summary><div className="in">{b}</div></details>)}
        </div>
      )}
      {tab === "procedure" && (
        <Table head={["Étape", "Contenu", "Qui intervient"]} empty=""
          rows={PROC.map(([a, b, w], i) => [<b key="a">{i + 1}. {a}</b>, <span key="b" className="muted">{b}</span>, <div key="w" className="who">{w.map((x) => <span key={x}>{x}</span>)}</div>])} />
      )}
      {tab === "securite" && (
        <>
          <Steps items={[
            { k: "Mandat", h: "Convention de mandat de gestion", li: ["Convention Immo Bell validée par un avocat", "Encadre la délégation de gestion confiée par le bailleur"] },
            { k: "Veille", h: "Loi camerounaise", li: ["Veille sur la réglementation de la gestion immobilière", "Formation juridique interne prévue"] },
            { k: "Modèles", h: "Contrats types", li: ["Bail d'habitation", "Bail commercial", "Vente de terrain"] },
          ]} />
          <p className="note" style={{ marginTop: 20 }}>Les contrats sont rédigés et suivis par le pôle juridique. La plateforme ne génère pas de contrat automatiquement.</p>
        </>
      )}
      {tab === "admin" && (
        <Steps items={[
          { k: "Dossiers locatifs", h: "Pièces et complétude", li: ["Dossiers du bailleur et du locataire", "Courriers, scans, classement, quittancement", "Closing : état des lieux, bail, lettre d'engagement"] },
          { k: "Baux et assurances", h: "Rédaction et suivi", li: ["États des lieux et avenants", "Suivi des attestations d'assurance", "Dossiers sinistre : pièces et transmission"] },
          { k: "Circuit de traitement", h: "Du dépôt à l'escalade", li: ["Réception et contrôle, suivi et relance des échéances", "Transmission aux responsables, escalade si blocage", "Décès, impayés, sous-location : analyste juridique, huissier, avocat, assurance"] },
        ]} />
      )}
    </section>
  );
}
