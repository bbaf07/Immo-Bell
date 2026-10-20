/* Modèles de contrats de travail (Code du travail du Cameroun, loi n° 92/007 du 14 août 1992).
   Documents types à compléter : à faire valider par un juriste ou un avocat avant tout usage. */

export interface Article { t: string; p: string[] }
export interface Contrat { slug: string; title: string; sub: string; parts: [string, string]; articles: Article[]; copies: string }

const L = "____________________";
const D = "____ / ____ / ________";

const COMMUN: Article[] = [
  { t: "Confidentialité et données personnelles", p: ["Le travailleur traite avec discrétion les informations de l'employeur, de ses clients, des propriétaires et des locataires, notamment les pièces d'identité, avis d'imposition, bulletins de paie et contrats qui lui sont confiés.", "Il ne copie, ne conserve et ne transmet ces documents que dans le cadre de ses fonctions et selon les consignes de l'employeur. Cette obligation se poursuit après la fin du contrat."] },
  { t: "Loyauté et argent des clients", p: ["Le travailleur ne perçoit aucune somme (loyer, dépôt de garantie, acompte, frais) à titre personnel : tout encaissement suit la procédure de l'employeur, contre reçu.", "Il informe l'employeur de tout intérêt personnel dans un bien ou chez un prestataire agréé."] },
  { t: "Règlement intérieur, hygiène et sécurité", p: ["Le travailleur respecte le règlement intérieur et les consignes d'hygiène et de sécurité, notamment lors des visites de biens et des interventions sur site."] },
  { t: "Protection sociale", p: ["L'employeur affilie le travailleur à la Caisse nationale de prévoyance sociale (CNPS) et opère les retenues légales. N° d'affiliation du travailleur : " + L + "."] },
  { t: "Droit applicable et litiges", p: ["Le présent contrat est régi par le Code du travail (loi n° 92/007 du 14 août 1992) et ses textes d'application. Les parties cherchent d'abord une solution amiable, au besoin devant l'inspecteur du travail ; à défaut, le tribunal compétent de Douala est saisi.", "Pour un travailleur de nationalité étrangère, le contrat est soumis au visa du ministre chargé du Travail avant tout commencement d'exécution."] },
];

const ESSAI_CDI: Article = {
  t: "Engagement à l'essai (facultatif)",
  p: [
    "☐ Pas de période d'essai.",
    "☐ Période d'essai de " + L + " (de 15 jours à 4 mois selon la catégorie professionnelle). Elle est stipulée par écrit, renouvelable une seule fois avec l'accord écrit du travailleur donné avant son terme, et ne dépasse pas 6 mois renouvellement compris (8 mois pour les cadres). Sans stipulation écrite, l'essai est réputé concluant.",
    "Pendant l'essai, l'employeur apprécie la qualité du travail et le rendement ; le travailleur apprécie les conditions de travail, de rémunération, d'hygiène, de sécurité et le climat de l'entreprise.",
  ],
};

export const CONTRATS: Contrat[] = [
  {
    slug: "cdi", title: "Contrat de travail à durée indéterminée", sub: "CDI : modèle à compléter", parts: ["Employeur", "Travailleur"],
    copies: "en deux exemplaires originaux, un pour chaque partie",
    articles: [
      { t: "Engagement et fonctions", p: ["L'employeur engage le travailleur en qualité de " + L + ", catégorie " + L + ", échelon " + L + ".", "Lieu de travail principal : Bonanjo, Douala, et sur les sites de visite et d'intervention selon les besoins du service. Rattachement hiérarchique : " + L + "."] },
      { t: "Prise de fonction", p: ["Le contrat prend effet le " + D + "."] },
      ESSAI_CDI,
      { t: "Rémunération", p: ["Salaire mensuel de base brut : " + L + " FCFA. Primes et avantages : " + L + ".", "Le salaire est versé chaque mois, au plus tard le " + L + ", par " + L + ", contre bulletin de paie. Il ne peut être inférieur au salaire minimum applicable à la catégorie du travailleur."] },
      { t: "Durée du travail et congés", p: ["Horaire hebdomadaire : " + L + " heures, du " + L + " au " + L + ", de ____ h à ____ h. Les heures supplémentaires sont demandées par écrit et rémunérées selon la loi.", "Le travailleur a droit au congé annuel payé et aux jours fériés légaux, dans les conditions du Code du travail."] },
      ...COMMUN,
      { t: "Rupture du contrat", p: ["Chaque partie peut mettre fin au contrat à durée indéterminée, sous réserve du préavis et de la notification écrite du motif de la rupture.", "Le préavis est de " + L + " (selon la catégorie et l'ancienneté, conformément à la loi ou à la convention collective applicable). Il n'est pas dû en cas de faute grave ni de force majeure. Les indemnités éventuelles sont réglées conformément à la loi."] },
    ],
  },
  {
    slug: "cdd", title: "Contrat de travail à durée déterminée", sub: "CDD : modèle à compléter", parts: ["Employeur", "Travailleur"],
    copies: "en trois exemplaires originaux : employeur, travailleur et inspection du travail",
    articles: [
      { t: "Engagement et fonctions", p: ["L'employeur engage le travailleur en qualité de " + L + ", catégorie " + L + ", échelon " + L + ".", "Lieu de travail principal : Bonanjo, Douala. Rattachement hiérarchique : " + L + "."] },
      { t: "Motif du contrat à durée déterminée", p: ["Le contrat est conclu pour le motif suivant (une seule case) :", "☐ remplacement d'un travailleur absent ou dont le contrat est suspendu (nom : " + L + ")", "☐ travail déterminé : " + L, "☐ accroissement temporaire ou occasionnel d'activité : " + L, "☐ travail saisonnier : " + L, "☐ tâche urgente de prévention d'accident ou de réparation : " + L] },
      { t: "Durée et terme", p: ["Le contrat prend effet le " + D + " et prend fin le " + D + " (ou à la survenance de l'événement précis suivant : " + L + ").", "Le contrat à durée déterminée ne peut dépasser deux ans. Il est renouvelable une fois ; à l'issue de ce renouvellement, la relation se poursuit en contrat à durée indéterminée. Les remplacements, travaux occasionnels et saisonniers suivent les règles propres que prévoit la loi."] },
      { ...ESSAI_CDI, p: ["☐ Pas de période d'essai.", "☐ Période d'essai de " + L + ", stipulée par écrit, renouvelable une seule fois avec l'accord écrit du travailleur, dans les limites fixées par la loi."] },
      { t: "Rémunération", p: ["Salaire mensuel de base brut : " + L + " FCFA. Primes et avantages : " + L + ". Salaire versé chaque mois contre bulletin de paie, jamais inférieur au salaire minimum applicable."] },
      { t: "Durée du travail et congés", p: ["Horaire hebdomadaire : " + L + " heures. Le travailleur bénéficie du congé annuel payé, au prorata de sa présence, et des jours fériés légaux."] },
      ...COMMUN,
      { t: "Fin et rupture anticipée", p: ["Le contrat prend fin de plein droit à son terme. Il ne peut être rompu avant le terme que pour faute grave, cas de force majeure ou accord écrit des deux parties.", "Tout contrat de plus de trois mois, ou qui oblige le travailleur à s'installer loin de sa résidence habituelle, est établi par écrit et une copie est remise à l'inspecteur du travail."] },
    ],
  },
  {
    slug: "convention-stage", title: "Convention de stage", sub: "Stage : modèle à compléter", parts: ["Entreprise d'accueil", "Stagiaire"],
    copies: "en trois exemplaires originaux : entreprise, stagiaire et établissement de formation",
    articles: [
      { t: "Objet", p: ["L'entreprise accueille le stagiaire pour une formation pratique en lien avec son cursus : " + L + " (établissement : " + L + ", niveau : " + L + ").", "Le stage n'est pas un contrat de travail : il ne remplace pas un emploi permanent."] },
      { t: "Durée et horaires", p: ["Du " + D + " au " + D + ", soit " + L + ".", "Horaires : de ____ h à ____ h, du " + L + " au " + L + "."] },
      { t: "Missions et tuteur", p: ["Les missions confiées sont : " + L + ".", "Tuteur dans l'entreprise : " + L + ", fonction : " + L + ". Il accueille, encadre et évalue le stagiaire."] },
      { t: "Gratification et frais", p: ["☐ Stage non rémunéré.", "☐ Gratification mensuelle de " + L + " FCFA.   ☐ Frais de transport pris en charge : " + L + "."] },
      { t: "Obligations du stagiaire", p: ["Le stagiaire respecte les horaires, le règlement intérieur et les consignes de sécurité. Il prévient le tuteur de toute absence.", "Il est tenu à la confidentialité sur les informations et les documents personnels des clients, propriétaires et locataires auxquels il a accès, pendant et après le stage."] },
      { t: "Assurance et sécurité", p: ["Le stagiaire est couvert par : " + L + " (assurance de l'établissement ou de l'entreprise). Chaque partie vérifie que la couverture des accidents et de la responsabilité civile est en vigueur avant le début du stage."] },
      { t: "Fin du stage et attestation", p: ["À la fin du stage, l'entreprise remet une attestation indiquant la durée et les missions réalisées, et le tuteur formule une appréciation.", "Chaque partie peut mettre fin au stage avant son terme en prévenant les autres par écrit, pour motif sérieux (manquement grave, absence répétée, arrêt de la formation)."] },
      { t: "Litiges", p: ["Les parties cherchent d'abord une solution amiable avec l'établissement de formation."] },
    ],
  },
];

export const contratBySlug = (s: string) => CONTRATS.find((c) => c.slug === s);
