/* Contenu des fiches imprimables des services (textes repris du site ; les points non arrêtés sont signalés « à confirmer »). */
import { ACTS, ASS_D, DOCS, PACKS, SITU } from "./consts";

export interface Service { slug: string; title: string; tag: string; intro: string; blocks: { h: string; li: string[] }[]; note?: string }

const TBC = "Le contenu détaillé et les tarifs sont à confirmer avec l'équipe Immo Bell : un devis personnalisé est remis avant toute intervention.";
const act = (k: string) => ACTS.find((a) => a.k === k)!;
const prestataire = (k: string): Service => ({
  slug: k.toLowerCase().normalize("NFD").replace(/[^a-z]/g, ""), title: k, tag: "Prestataire agréé",
  intro: act(k).d, blocks: [{ h: "Comment ça se passe", li: ["Vous décrivez votre besoin dans « Services » ou « Mon espace »", "Un prestataire agréé Immo Bell vous remet son devis", "Vous acceptez, l'intervention est suivie jusqu'au rapport", "Le rapport d'intervention vous est remis, avec ses photos"] }], note: TBC,
});

export const SERVICES: Service[] = [
  {
    slug: "gestion-locative", title: "Gestion locative", tag: "Gérer, entretenir, valoriser",
    intro: "Immo Bell recense les biens de Bonanjo et de Douala, prend en charge la gestion locative et assure un suivi réactif. Les bailleurs gagnent du temps, les locataires un service à la hauteur du quartier.",
    blocks: [
      { h: "Pour le bailleur", li: ["Annonce publiée après validation (photos réelles, documents de propriété)", "Étude de chaque dossier de location avant attribution", "Calendrier, relevés et suivi des demandes dans « Mon espace »", "Diffusion sur les plateformes partenaires, depuis le compte du propriétaire"] },
      { h: "Pour le locataire", li: ["Réponse sous 72 h après dépôt d'un dossier complet", "Suivi en 6 étapes, de la demande à la remise des clés", "Urgences dispatchées à un prestataire agréé", "Service après-vente de 8 h à 18 h"] },
    ],
    note: "Immo Bell n'est pas propriétaire des biens : elle étudie les dossiers et gère les demandes.",
  },
  {
    slug: "pole-juridique", title: "Pôle juridique", tag: "Sécuriser chaque bail",
    intro: "Étude des dossiers de location et des fonds de commerce, conseils au grand public, encadrement juridique interne et externe.",
    blocks: [
      { h: "Étape 1 · Collecter et vérifier", li: ["Bailleur : CNI, documents de propriété, vérification des locaux", "Demandeur : identité, titre de séjour valide, avis d'imposition et NIU", "Factures et contrats du demandeur", "Contact de l'ancien bailleur pour vérifier le respect des engagements"] },
      { h: "Étape 2 · Mesurer la solvabilité", li: ["Revenu net et capacité locative (le loyer ne dépasse pas un tiers du revenu net)", "Avis d'imposition", "Demande d'un dépôt de garantie"] },
      { h: "Étape 3 · Conclure", li: ["CNI des héritiers ou des personnes à contacter", "Visite et état des lieux contradictoire", "Signature du bail", "Lettre d'engagement et déclaration sur l'honneur", "Assurance loyers impayés"] },
      ...Object.entries(SITU).map(([s, ks]) => ({ h: `Pièces demandées · ${s}`, li: ks.map((k) => DOCS[k]) })),
    ],
  },
  {
    slug: "demenagement", title: "Déménagement et aménagement", tag: "Service phare",
    intro: "Trois produits, du plus simple au plus complet.",
    blocks: PACKS.map((p) => ({ h: `${p.k}${p.feat ? " · le plus complet" : ""}`, li: [p.d, ...p.inc] })), note: TBC,
  },
  {
    slug: "assainissement", title: "Assainissement en milieu professionnel et privé", tag: "Service phare", intro: ASS_D,
    blocks: [
      { h: "Milieu professionnel", li: ["Bureaux, commerces, restaurants, entrepôts", "Contrat d'entretien ou intervention ponctuelle"] },
      { h: "Milieu privé", li: ["Logements, villas, copropriétés", "Diagnostic, curage, vidange"] },
    ], note: TBC,
  },
  prestataire("Plomberie"), prestataire("Électricité"), prestataire("Jardinage"), prestataire("BTP"),
  { slug: "location-vehicules", title: "Location de véhicules", tag: "Logistique", intro: "Location sous 24 h et location-gérance de petits véhicules et fourgonnettes.", blocks: [{ h: "Disponibilité", li: ["Sur demande"] }], note: TBC },
  { slug: "demenagements-logistique", title: "Déménagements (avant ou après location)", tag: "Logistique", intro: "Contrat de déménagement avec fiche d'inventaire en annexe, devis signé et suivi de l'engagement.", blocks: [{ h: "Disponibilité", li: ["Dès le 30 octobre 2026"] }], note: TBC },
  { slug: "achats-international", title: "Achats à l'international", tag: "Logistique", intro: "Achat et acheminement de matériel depuis l'étranger, par exemple la Chine.", blocks: [{ h: "Disponibilité", li: ["Sur devis"] }], note: TBC },
  { slug: "flotte-yango", title: "Flotte Yango Immo Bell", tag: "Logistique", intro: "Toyota Yaris pour Yango, en location ou en taxi.", blocks: [{ h: "Disponibilité", li: ["Lancement prévu le 1er janvier 2027"] }], note: TBC },
];

export const serviceBySlug = (s: string) => SERVICES.find((x) => x.slug === s);

export const DOCUMENTS = [
  { slug: "etat-des-lieux", title: "État des lieux contradictoire", sub: "À remplir le jour de l'entrée ou de la sortie, signé par les deux parties." },
  { slug: "devis", title: "Devis", sub: "Prestation, montant, délai et signature du client." },
  { slug: "rapport-intervention", title: "Rapport d'intervention", sub: "Compte rendu remis au client après une urgence ou une intervention." },
] as const;
