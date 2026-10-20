"use client";

import { useSyncExternalStore } from "react";
import { emptyFilters, type Filters } from "./props";

/** État de la recherche et de la comparaison, conservé pendant la navigation (comme la session de la maquette). */
interface Search { f: Filters; cmp: string[]; mapSel: string }
let s: Search = { f: emptyFilters(), cmp: [], mapSel: "" };
const subs = new Set<() => void>();
const emit = () => subs.forEach((x) => x());
export const useSearch = () => useSyncExternalStore((x) => { subs.add(x); return () => { subs.delete(x); }; }, () => s, () => s);

export const setFilters = (p: Partial<Filters>) => { s = { ...s, f: { ...s.f, ...p } }; emit(); };
export const resetFilters = () => { s = { ...s, f: { ...emptyFilters(), sort: s.f.sort, view: s.f.view } }; emit(); };
export const toggleIn = (k: "qs" | "types" | "modes" | "dispo" | "eq", v: string) => setFilters({ [k]: s.f[k].includes(v) ? s.f[k].filter((x) => x !== v) : [...s.f[k], v] });
export const toggleCmp = (ref: string) => { s = { ...s, cmp: s.cmp.includes(ref) ? s.cmp.filter((r) => r !== ref) : s.cmp.length >= 3 ? s.cmp : [...s.cmp, ref] }; emit(); };
export const clearCmp = () => { s = { ...s, cmp: [] }; emit(); };
export const setMapSel = (ref: string) => { s = { ...s, mapSel: ref }; emit(); };
export const searchFor = (p: Partial<Filters>) => { s = { ...s, f: { ...emptyFilters(), sort: s.f.sort, view: s.f.view, ...p } }; emit(); };
