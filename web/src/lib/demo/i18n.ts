import en from "./en.json";

const EN = en as Record<string, string>;

/** Traduit une chaîne connue de la maquette (français → anglais). Renvoie le texte tel quel si aucune traduction n'existe. */
export function trText(s: string, lang: "fr" | "en"): string {
  if (lang !== "en" || !s) return s;
  const t = s.trim();
  const r = EN[t];
  return r === undefined ? s : s.replace(t, r);
}

/** Choix FR / EN pour les textes écrits à la main. */
export const L = (lang: "fr" | "en", fr: string, enTxt: string) => (lang === "en" ? enTxt : fr);
