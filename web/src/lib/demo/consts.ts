import seed from "./seed.json";

export const ROLES = seed.ROLES as Record<string, string>;
export const PERSONAS = seed.PERSONAS as Record<string, { name: string; email: string; phone: string; d: string }>;
export const SITU = seed.SITU as Record<string, string[]>;
export const DOCS = seed.DOCS as Record<string, string>;
export const STAGES = seed.STAGES as string[];
export const PACK_RATE = seed.PACK_RATE as Record<string, number>;
export const METIERS = seed.METIERS as string[];
export const PACKS = seed.PACKS as { k: string; d: string; inc: string[]; feat?: boolean }[];
export const ACTS = seed.ACTS as { k: string; d: string; ic: string }[];
export const QUARTS = Object.keys(seed.QUART);
export const REJ = seed.REJ as string[];
export const CANCEL_WHY = seed.CANCEL_WHY as string[];
export const OBJETS = seed.OBJETS as string[];
export const VERDICTS = seed.VERDICTS as string[];
export const V2 = seed.V2 as [string, string, string, string][];
export const DECISIONS = seed.DECISIONS as string[];
export const ADM_ROLES = seed.ADM_ROLES as Record<string, { n: string; p: string[]; d: string }>;
export const ASS_D = "Diagnostic, curage, vidange et entretien régulier des réseaux et fosses, pour les entreprises comme pour les particuliers.";

export const fcfa = (n: number) => Math.round(n).toLocaleString("fr-FR") + " FCFA";
const fr = "fr-FR";
export const fdate = (t: number | string) => new Date(t).toLocaleDateString(fr, { day: "numeric", month: "short", year: "numeric" });
export const fdt = (t: number) => new Date(t).toLocaleString(fr, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
/** Heures restantes sur le délai de 72 h. */
export const hoursLeft = (t: number) => Math.round((t + 72 * 3600e3 - Date.now()) / 3600e3);
