import seed from "./seed.json";
import type { Demo, Prop } from "./store";

export const TYPES = seed.TYPES as string[];
export const MODES = seed.MODES as string[];
export const EQF = seed.EQF as string[];
export const CATS = seed.CATS as string[];
export const TEAM = seed.TEAM as [string, string, string, string][];
export const ROLE_CH: Record<string, string> = { visitor: "client", owner: "owner", legal: "legal", provider: "tech", admin: "admin" };

/** Nom du fichier de personnage (clés de la maquette → fichiers extraits). */
export const CHAR: Record<string, string> = {
  awa: "ch_conseillere", awaWave: "ch_conseillere_salut", awaThink: "ch_conseillere_reflexion", client: "ch_client", clientJoy: "ch_client_joie",
  owner: "ch_proprietaire", legal: "ch_juriste", tech: "ch_technicien", admin: "ch_admin",
};

/** Les biens d'exemple (propriétaire « demo ») appartiennent au profil de démonstration, pas à un vrai compte. */
export const isMine = (p: Prop, email: string) => p.owner === email || (p.owner === "demo" && email === seed.PERSONAS.owner.email);
export const pub = (S: Demo) => S.props.filter((p) => p.validation === "validé");
export const byRef = (S: Demo, r: string) => S.props.find((p) => p.ref === r);
export const nrev = (S: Demo, r: string) => (S.reviews[r] ?? []).length;
export const sc10 = (S: Demo, r: string) => { const a = S.reviews[r] ?? []; return a.length ? (a.reduce((s, x) => s + x.stars, 0) / a.length) * 2 : 0; };
export const scLabel = (s: number) => (s >= 9.4 ? "Exceptionnel" : s >= 9 ? "Fabuleux" : s >= 8.6 ? "Superbe" : s >= 8 ? "Très bien" : s >= 7 ? "Bien" : "Correct");
export const f1 = (n: number) => n.toFixed(1).replace(".", ",");
export const shortP = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0).replace(".", ",") + " M" : n >= 1e3 ? Math.round(n / 1e3) + " k" : String(n));
export const deposit = (p: Prop) => { const m = /(\d+)\s*mois/.exec(p.cond || ""); return m ? +m[1] : p.mode === "Vente" || p.mode === "Saisonnière" ? 0 : 2; };
export const availTxt = (p: Prop) => (p.status === "libre" ? (p.mode === "Vente" ? "Disponible à la vente" : "Disponible maintenant") : p.status === "réservé" ? "Réservé, dossier en cours d'étude" : "Occupé, bail en cours");
export const unit = (p: Prop) => (p.mode === "Vente" ? "" : p.mode === "Saisonnière" ? " / nuit" : " / mois");
export const rl = (p: Prop) => (p.rooms ? `${p.rooms} pièce${p.rooms > 1 ? "s" : ""}` : "Terrain nu");
export const eqIcon = (e: string) => { const s = e.toLowerCase(); return /clim/.test(s) ? "snow" : /groupe|électr|compteur/.test(s) ? "bolt" : /parking|garage|véhicule/.test(s) ? "car" : /wifi|fibre/.test(s) ? "wifi" : /eau|forage|château|piscine/.test(s) ? "drop" : /gardien|sécur|rideau/.test(s) ? "shield" : /meubl|mobilier|cuisine|salon/.test(s) ? "sofa" : /titre|licence|document/.test(s) ? "file" : /jardin|terrasse/.test(s) ? "leaf" : /concierg|ménage/.test(s) ? "star" : "check"; };
export const ROOMSET = (p: Prop): [string, string][] =>
  p.type === "Terrain" ? [["plan", "Plan de la parcelle"], ["map", "Situation"]]
    : p.type === "Bureau" ? [["bureau", "Plateau"], ["bureau", "Bureaux"], ["sdb", "Sanitaires"], ["commerce", "Accueil"]]
    : /Boutique|Fonds/.test(p.type) ? [["commerce", "Intérieur"], ["commerce", "Comptoir"], ["cuisine", "Arrière-boutique"], ["sdb", "Sanitaires"]]
    : [["salon", "Séjour"], ["chambre", "Chambre"], ["cuisine", "Cuisine"], ["sdb", "Salle d'eau"]];

/** Notes par catégorie, déterministes à partir du bien (comme dans la maquette). */
export const cats = (S: Demo, p: Prop): [string, number][] => {
  const b = sc10(S, p.ref) || 8.4;
  return CATS.map((c, i) => [c, Math.max(6.5, Math.min(10, b + ((((p.h + 7) * (i + 3)) % 15) - 7) / 10))]);
};

/* ---------- filtres de la recherche ---------- */
export interface Filters { qs: string[]; types: string[]; modes: string[]; dispo: string[]; eq: string[]; max: number; score: number; rooms: number; date: string; sort: string; view: "list" | "grid" | "map" }
export const emptyFilters = (): Filters => ({ qs: [], types: [], modes: [], dispo: [], eq: [], max: 0, score: 0, rooms: 0, date: "", sort: "top", view: "list" });
const FKEYS = { qs: "q", types: "type", modes: "mode", dispo: "status" } as const;
export { FKEYS };

export function filt(S: Demo, f: Filters, ex?: keyof Filters) {
  return pub(S).filter((p) =>
    (ex === "qs" || !f.qs.length || f.qs.includes(p.q)) && (ex === "types" || !f.types.length || f.types.includes(p.type)) &&
    (ex === "modes" || !f.modes.length || f.modes.includes(p.mode)) && (ex === "dispo" || !f.dispo.length || f.dispo.includes(p.status)) &&
    (ex === "eq" || !f.eq.length || f.eq.every((e) => p.eq.some((x) => x.toLowerCase().includes(e.toLowerCase())))) &&
    (!f.max || p.price <= f.max) && (ex === "score" || !f.score || sc10(S, p.ref) >= f.score) && (!f.rooms || p.rooms >= f.rooms));
}
export function filtered(S: Demo, f: Filters) {
  const l = filt(S, f), s = f.sort;
  return l.sort(s === "pa" ? (a, b) => a.price - b.price : s === "pd" ? (a, b) => b.price - a.price
    : s === "note" ? (a, b) => sc10(S, b.ref) - sc10(S, a.ref) || nrev(S, b.ref) - nrev(S, a.ref)
    : s === "new" ? (a, b) => b.created - a.created
    : (a, b) => (a.status === "libre" ? 0 : 1) - (b.status === "libre" ? 0 : 1) || (b.pack ? 1 : 0) - (a.pack ? 1 : 0) || b.views - a.views);
}
export const sl2p = (v: number) => (v >= 100 ? 0 : Math.round((30000 * Math.pow(10, (v / 100) * 3.25)) / 5000) * 5000);
export const p2sl = (p: number) => (!p ? 100 : Math.max(0, Math.min(99, Math.round((Math.log10(p / 30000) / 3.25) * 100))));
