"use client";

import { useSyncExternalStore } from "react";
import seed from "./seed.json";

/* ---------- types (reprennent la forme de l'état de la démonstration) ---------- */
export type Role = "visitor" | "owner" | "legal" | "provider" | "admin";
export interface User { name: string; email: string; phone?: string; role: Role; status?: string; arole?: string }
export interface Prop {
  ref: string; title: string; type: string; mode: string; q: string; price: number; rooms: number; surface: number;
  status: "libre" | "réservé" | "occupé"; validation: string; owner: string; views: number; h: number; eq: string[];
  desc: string; cond: string; created: number; pack?: string;
}
export interface Req {
  code: string; ref: string; name: string; phone: string; date: string; end?: string; note: string; status: string;
  by: string; t: number; stage?: number; situation?: string; rev?: number; garant?: boolean; grev?: number;
  checks?: Record<string, boolean>; reason?: string; reasonNote?: string; decided?: { t: number; by: string };
  cancel?: { by: string; why: string; note: string; t: number; who?: string };
}
export interface Incident {
  code: string; ref: string; type: string; profil: string; desc: string; phone: string; level: string; status: string;
  prest: string; prestEmail?: string | null; by: string; t: number; rapport?: string;
}
export interface Quote {
  code: string; type: string; from: string; to: string; date: string; phone: string; note: string; status: string;
  by: string; t: number; pack?: string | null; milieu?: string | null; prest?: string | null; prestEmail?: string | null; amount?: number; delay?: string;
}
export interface Provider {
  id: string; name: string; metier: string; zone: string; phone: string; email: string; status: string; dispo: string;
  tarif?: string; t: number;
}
export interface CaseHist { t: number; who: string; act: string; internal?: boolean }
export interface Case {
  code: string; kind: "litige" | "signalement"; lvl: number; objet: string; ref?: string; review?: string; by: string;
  byName: string; against: string; againstName: string; desc: string; t: number; replyDue: number;
  reply: { t: number; text: string } | null; status: string; assignee: string | null; assigneeName?: string; decision: unknown; hist: CaseHist[];
}
export interface Msg { with: string; from: "me" | "immo"; text: string; t: number; unread?: boolean }
export interface Notif { email: string; text: string; t: number; read: boolean; go?: { v: string; tab?: string } }
export interface Review { who: string; stars: number; text: string; t: number; removed?: boolean; ref?: string; by?: string }
export interface Demo {
  user: User | null; favs: string[]; props: Prop[]; requests: Req[]; incidents: Incident[]; quotes: Quote[];
  providers: Provider[]; cases: Case[]; msgs: Msg[]; notifs: Notif[]; users: User[]; audit: { t: number; who: string; act: string; by?: string }[];
  docs: Record<string, Record<string, string>>; reviews: Record<string, Review[]>; replies: Record<string, string>;
  cal: Record<string, string[]>; blocks: Record<string, string[]>; notes: Record<string, string>;
  dif: Record<string, Record<string, { s: string; t: number }>>; tours: Record<string, { id: string; label: string }[]>;
}

const KEY = "immobell_next_v1";
const SERVER = seed.S as unknown as Demo;

/** Décale tous les horodatages du jeu de départ pour qu'ils soient relatifs à « maintenant ». */
function shift(v: unknown, d: number): unknown {
  if (typeof v === "number") return v > 1.6e12 && v < 2e12 ? v + d : v;
  if (Array.isArray(v)) return v.map((x) => shift(x, d));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shift(x, d)]));
  return v;
}

let state: Demo = SERVER;
let loaded = false;
const subs = new Set<() => void>();

function init() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { state = JSON.parse(raw) as Demo; return; }
  } catch { /* stockage indisponible : on repart du jeu de départ */ }
  state = shift(structuredClone(seed.S), Date.now() - seed.NOW0) as Demo;
}

export const getState = () => { init(); return state; };
const snap = getState;
const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

/** État de la démonstration (persisté dans le navigateur). */
export function useDemo(): Demo {
  return useSyncExternalStore(sub, snap, () => SERVER);
}

/** Applique une modification à une copie de l'état, la sauvegarde et prévient les écrans. */
export function mutate(fn: (s: Demo) => void) {
  init();
  const next = structuredClone(state);
  fn(next);
  state = next;
  persist();
  pushProps(next.props);
  pushRequests(next.requests);
  pushInbox(next);
  pushColls(next);
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sans stockage, la session reste en mémoire */ }
  subs.forEach((f) => f());
}

/* ---------- annonces et session côté serveur ---------- */
// Seul un compte réel (cookie de session) écrit sur le serveur ; les profils de démonstration restent locaux.
let sessionOn = false;
let synced = new Map<string, string>();
let syncedReq = new Map<string, string>();

/* ---------- devis, urgences, litiges, avis, favoris : un enregistrement par objet ---------- */
type Kind = "quote" | "incident" | "case" | "review" | "fav";
type Rec = Record<string, unknown>;
const KINDS: Kind[] = ["quote", "incident", "case", "review", "fav"];
const syncedRec: Record<Kind, Map<string, string>> = { quote: new Map(), incident: new Map(), case: new Map(), review: new Map(), fav: new Map() };
const me = () => state.user?.email ?? "";
const byRef = (l: Rec[]): Record<string, Review[]> => {
  const m: Record<string, Review[]> = {};
  for (const r of l.filter((x) => !x.removed).sort((a, b) => Number(b.t) - Number(a.t))) (m[String(r.ref)] ??= []).push(r as unknown as Review);
  return m;
};
const COLL: Record<Kind, { get: (s: Demo) => Rec[]; key: (x: Rec) => string; set: (s: Demo, l: Rec[]) => Demo }> = {
  quote: { get: (s) => s.quotes as unknown as Rec[], key: (x) => String(x.code), set: (s, l) => ({ ...s, quotes: l as unknown as Quote[] }) },
  incident: { get: (s) => s.incidents as unknown as Rec[], key: (x) => String(x.code), set: (s, l) => ({ ...s, incidents: l as unknown as Incident[] }) },
  case: { get: (s) => s.cases as unknown as Rec[], key: (x) => String(x.code), set: (s, l) => ({ ...s, cases: l as unknown as Case[] }) },
  review: {
    get: (s) => Object.entries(s.reviews).flatMap(([ref, l]) => l.map((r) => ({ ...r, ref, by: r.by ?? me() }) as unknown as Rec)),
    key: (x) => `${x.ref}|${x.t}|${x.by}`, set: (s, l) => ({ ...s, reviews: byRef(l) }),
  },
  fav: { get: (s) => [{ refs: s.favs, by: me() }], key: () => me(), set: (s, l) => ({ ...s, favs: (l[0]?.refs as string[] | undefined) ?? [] }) },
};
const recUrl = (k: Kind) => `/api/v1/records?kind=${k}`;

function pushColls(s: Demo) {
  if (!sessionOn) return;
  for (const k of KINDS) {
    const c = COLL[k], seen = syncedRec[k], cur = c.get(s);
    const items = cur.filter((x) => seen.get(c.key(x)) !== JSON.stringify(x));
    if (k === "review") { // un avis disparu de la liste locale = avis retiré par la modération
      const now = new Set(cur.map(c.key));
      for (const [key, j] of seen) if (!now.has(key)) items.push({ ...JSON.parse(j), removed: true });
    }
    if (!items.length) continue;
    const batch = items.slice(0, 50);
    batch.forEach((x) => seen.set(c.key(x), JSON.stringify(x)));
    fetch(recUrl(k), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: batch }) })
      .then(async (r) => {
        if (!r.ok) return void syncSession();
        const out = await r.json() as { from: string; data: Rec }[];
        let local = c.get(state);
        for (const { from, data } of out) {
          const nk = c.key(data);
          if (from !== nk) { state = JSON.parse(JSON.stringify(state).split(from).join(nk)) as Demo; seen.delete(from); local = c.get(state); } // le serveur a attribué un autre code
          seen.set(nk, JSON.stringify(data));
          local = local.map((x) => (c.key(x) === nk ? data : x));
        }
        state = c.set(state, local); persist();
      })
      .catch(() => batch.forEach((x) => seen.delete(c.key(x))));
  }
}

/** Relit les enregistrements du serveur ; les éléments locaux pas encore envoyés sont conservés. */
async function loadColls(kinds: Kind[], keepPending: boolean) {
  const res = await Promise.all(kinds.map((k) => fetch(recUrl(k)).then((r) => (r.ok ? r.json() as Promise<Rec[]> : null))));
  if (res.some((r) => !r)) return false;
  kinds.forEach((k, i) => {
    const c = COLL[k], list = res[i] as Rec[];
    const pending = keepPending ? c.get(state).filter((x) => !syncedRec[k].has(c.key(x))) : [];
    syncedRec[k] = new Map(list.map((x) => [c.key(x), JSON.stringify(x)]));
    if (k === "review" && !list.length) return; // pas d'avis côté serveur : on garde ceux de la démonstration
    state = c.set(state, [...list, ...pending]);
  });
  return true;
}

/* Notifications et messages : le serveur les distribue aux destinataires (clé = contenu horodaté). */
const keyN = (n: Notif) => `${n.email}|${n.t}|${n.text}`;
const keyM = (m: Msg) => `${m.with}|${m.from}|${m.t}|${m.text}`;
let syncedInbox = new Map<string, string>();
let poll: ReturnType<typeof setInterval> | undefined;
interface InboxDto { notifs: Notif[]; msgs: Msg[] }

function applyInbox(srv: InboxDto) {
  syncedInbox = new Map([...srv.notifs.map((n) => ["n" + keyN(n), JSON.stringify(n)] as const), ...srv.msgs.map((m) => ["m" + keyM(m), JSON.stringify(m)] as const)]);
  const notifs = [...srv.notifs, ...state.notifs.filter((n) => !syncedInbox.has("n" + keyN(n)))];
  const msgs = [...srv.msgs.sort((a, b) => a.t - b.t), ...state.msgs.filter((m) => !syncedInbox.has("m" + keyM(m)))];
  state = { ...state, notifs, msgs }; persist();
}

function pushInbox(s: Demo) {
  if (!sessionOn) return;
  const notifs = s.notifs.filter((n) => syncedInbox.get("n" + keyN(n)) !== JSON.stringify(n)).slice(0, 50);
  const msgs = s.msgs.filter((m) => syncedInbox.get("m" + keyM(m)) !== JSON.stringify(m)).slice(0, 50);
  if (!notifs.length && !msgs.length) return;
  notifs.forEach((n) => syncedInbox.set("n" + keyN(n), JSON.stringify(n)));
  msgs.forEach((m) => syncedInbox.set("m" + keyM(m), JSON.stringify(m)));
  fetch("/api/v1/inbox", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notifs, msgs }) })
    .then(async (r) => { if (r.ok) applyInbox(await r.json() as InboxDto); })
    .catch(() => { notifs.forEach((n) => syncedInbox.delete("n" + keyN(n))); msgs.forEach((m) => syncedInbox.delete("m" + keyM(m))); });
}

async function pullInbox() {
  if (!sessionOn) return;
  try {
    const r = await fetch("/api/v1/inbox"); if (r.ok) applyInbox(await r.json() as InboxDto);
    if (await loadColls(["quote", "incident", "case", "fav"], true)) persist();
  } catch { /* hors ligne */ }
}

function pushRequests(reqs: Req[]) {
  if (!sessionOn) return;
  for (const r of reqs) {
    const j = JSON.stringify(r);
    if (syncedReq.get(r.code) === j) continue;
    syncedReq.set(r.code, j);
    fetch(`/api/v1/requests/${r.code}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: j })
      .then(async (res) => {
        if (!res.ok) return void syncSession(); // refusé : on revient à la version du serveur
        const srv = await res.json() as Req;
        if (srv.code !== r.code) { state = JSON.parse(JSON.stringify(state).split(r.code).join(srv.code)) as Demo; syncedReq.delete(r.code); } // code déjà pris : le serveur en attribue un libre
        syncedReq.set(srv.code, JSON.stringify(srv));
        if (JSON.stringify(srv) !== j) { state = { ...state, requests: state.requests.map((x) => (x.code === srv.code ? srv : x)) }; persist(); }
      })
      .catch(() => { syncedReq.delete(r.code); });
  }
}

function pushProps(props: Prop[]) {
  if (!sessionOn) return;
  for (const p of props) {
    const j = JSON.stringify(p);
    if (synced.get(p.ref) === j) continue;
    synced.set(p.ref, j);
    fetch(`/api/v1/listings/${p.ref}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: j })
      .then(async (r) => {
        if (!r.ok) return void syncSession(); // refusé : on revient à la version du serveur
        const srv = await r.json() as Prop;
        synced.set(srv.ref, JSON.stringify(srv));
        if (JSON.stringify(srv) !== j) { state = { ...state, props: state.props.map((x) => (x.ref === srv.ref ? srv : x)) }; persist(); }
      })
      .catch(() => { synced.delete(p.ref); });
  }
}

/** Relit la session et les annonces du serveur (au chargement, après connexion ou déconnexion). */
export async function syncSession() {
  sessionOn = false; // aucune écriture serveur tant que l'état local n'est pas remplacé par celui du serveur
  try {
    const me = await fetch("/api/v1/auth/me");
    const u = me.ok ? await me.json() as { name: string; email: string; role: Role } : null;
    init();
    if (u && !state.user) { const k = state.users.find((x) => x.email === u.email); state = { ...state, user: { phone: "", status: "actif", ...(k ?? {}), ...u } as User }; persist(); }
    const live = !!u && state.user?.email === u.email;
    if (!live && state.user) return; // profil de démonstration : on garde l'état local
    const r = await fetch("/api/v1/listings");
    if (!r.ok) return;
    const list = await r.json() as Prop[];
    if (!list.length) return;
    let reqs: Req[] | null = null, inbox: InboxDto | null = null;
    if (live) {
      const [q, i] = await Promise.all([fetch("/api/v1/requests"), fetch("/api/v1/inbox")]);
      if (!q.ok || !i.ok) return;
      reqs = await q.json() as Req[]; inbox = await i.json() as InboxDto;
    }
    synced = new Map(list.map((p) => [p.ref, JSON.stringify(p)]));
    // Visiteur sans compte : le serveur ne montre que les biens validés ; on garde les biens d'exemple en attente de la démonstration.
    state = { ...state, props: live ? list : [...list, ...state.props.filter((p) => p.validation === "en attente" && !list.some((x) => x.ref === p.ref))] };
    await loadColls(["review"], false); // les avis sont publics
    if (reqs && inbox) {
      await loadColls(["quote", "incident", "case", "fav"], false);
      syncedReq = new Map(reqs.map((x) => [x.code, JSON.stringify(x)]));
      // Compte réel : les requêtes, notifications et messages d'exemple de la démonstration ne partent jamais vers le serveur.
      state = { ...state, requests: reqs, notifs: [], msgs: [] }; syncedInbox = new Map();
      applyInbox(inbox);
    }
    persist();
    sessionOn = live;
    if (live) poll ??= setInterval(pullInbox, 30000);
  } catch { /* serveur éteint : la démonstration reste locale */ }
}

export function resetDemo() {
  try { localStorage.removeItem(KEY); } catch { /* idem */ }
  loaded = false; state = SERVER; init(); subs.forEach((f) => f());
}

/* ---------- actions communes (opèrent sur la copie passée à mutate) ---------- */
export const notify = (s: Demo, email: string, text: string, go?: Notif["go"]) =>
  s.notifs.unshift({ email, text, t: Date.now(), read: false, ...(go ? { go } : {}) });
export const logAct = (s: Demo, act: string) =>
  s.audit.unshift({ t: Date.now(), who: s.user ? s.user.name : "Système", by: s.user?.email, act });
export const notifyAdmins = (s: Demo, text: string, tab?: string) =>
  s.users.filter((u) => u.role === "admin" && u.status === "actif").forEach((u) => notify(s, u.email, text, { v: "espace", tab }));

export const loginAs = (role: Role) => mutate((s) => {
  const p = seed.PERSONAS[role];
  s.user = { name: p.name, email: p.email, phone: p.phone, role, status: "actif" };
});
export const logout = () => {
  fetch("/api/v1/auth/logout", { method: "POST" }).then(syncSession, () => {});
  sessionOn = false;
  mutate((s) => { s.user = null; });
};
export const code = (prefix: string) => `${prefix}-${String(Math.floor(1000 + Math.random() * 9000))}`;

export const loginUser = (u: Partial<User> & { name: string; role: Role }) =>
  mutate((s) => { s.user = { phone: "", email: "", status: "actif", ...u } as User; });
export const addUser = (u: User) => mutate((s) => { s.users.push(u); logAct(s, `Création du compte ${u.email}`); });
