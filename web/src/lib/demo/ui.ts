"use client";

import { useSyncExternalStore } from "react";

/** État d'interface partagé (fenêtres, toasts, menus), hors données métier. */
export type ModalState =
  | { k: "auth"; m: "login" | "signup" | "phone" | "forgot"; then?: ModalState }
  | { k: "book"; ref: string; a?: string; b?: string }
  | { k: "compare" }
  | { k: "rej"; code: string }
  | { k: "dif"; ref: string }
  | { k: "tour"; ref: string }
  | { k: "edit"; ref: string }
  | { k: "cancel"; code: string }
  | { k: "new" }
  | { k: "case"; code: string }
  | { k: "rep"; key: string };

interface UI { dark: boolean; still: boolean; eco: boolean; lang: "fr" | "en"; ecoAuto: boolean; toast: string; modal: ModalState | null; menu: boolean; bell: boolean; ntoast: { text: string; go?: { v: string; tab?: string } } | null }

let ui: UI = { dark: false, still: false, eco: false, lang: "fr", ecoAuto: false, toast: "", modal: null, menu: false, bell: false, ntoast: null };
const subs = new Set<() => void>();
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUI = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => ui, () => ui);

export function setUI(p: Partial<UI>) { ui = { ...ui, ...p }; subs.forEach((f) => f()); }
export const openModal = (m: ModalState) => setUI({ modal: m, menu: false, bell: false });
export const closeModal = () => setUI({ modal: null });

export function toast(text: string) {
  setUI({ toast: text });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setUI({ toast: "" }), 3800);
}

/* ---------- préférences (thème, animations, mode économie, langue) ---------- */
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};

/** À appeler une fois au chargement du navigateur : relit les préférences et pose les classes sur <html>. */
export function initPrefs() {
  const h = document.documentElement;
  const t = store.get("immobell_theme");
  if (t === "dark" || t === "light") h.dataset.theme = t;
  const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const lang = store.get("immobell_lang") === "en" ? "en" : "fr";
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const ecoStored = store.get("immobell_eco");
  const auto = ecoStored === null && !!(conn?.saveData || /(^|-)(2g|3g)$/.test(conn?.effectiveType ?? ""));
  const eco = ecoStored === "1" || auto;
  const still = store.get("immobell_still") === "1" || eco;
  h.classList.toggle("eco", eco); h.classList.toggle("still", still); h.lang = lang;
  setUI({ dark, still, eco, lang, ecoAuto: auto });
}

export function toggleTheme() {
  const next = !ui.dark;
  document.documentElement.dataset.theme = next ? "dark" : "light";
  store.set("immobell_theme", next ? "dark" : "light");
  setUI({ dark: next });
}
export function toggleMotion() {
  const on = document.documentElement.classList.toggle("still");
  store.set("immobell_still", on ? "1" : "0");
  setUI({ still: on }); toast(on ? "Animations en pause." : "Animations relancées.");
}
export function setEco(v: boolean) {
  const h = document.documentElement;
  h.classList.toggle("eco", v);
  if (v) h.classList.add("still"); else if (store.get("immobell_still") !== "1") h.classList.remove("still");
  store.set("immobell_eco", v ? "1" : "0");
  setUI({ eco: v, still: h.classList.contains("still"), ecoAuto: false });
  toast(v ? "Mode économie activé : animations et effets coupés, images allégées." : "Mode économie désactivé.");
}
export function toggleLang() {
  const lang = ui.lang === "en" ? "fr" : "en";
  store.set("immobell_lang", lang); document.documentElement.lang = lang; setUI({ lang });
}
