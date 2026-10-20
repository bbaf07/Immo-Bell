"use client";

import { DOCS, ROLES, SITU, STAGES } from "./consts";
import { getState, logAct, mutate, notify, notifyAdmins, type Demo, type Req } from "./store";

const actor = (s: Demo) => (s.user ? ROLES[s.user.role] : "Système");
const byRef = (s: Demo, ref: string) => s.props.find((p) => p.ref === ref);

/** Accepte ou rejette un dossier de location (pôle juridique ou administrateur). */
export function decideRequest(code: string, verdict: "validée" | "refusée", reason = "", note = "") {
  mutate((s) => {
    const r = s.requests.find((x) => x.code === code);
    if (!r) return;
    r.status = verdict;
    r.decided = { t: Date.now(), by: actor(s) };
    const p = byRef(s, r.ref);
    if (verdict === "refusée") {
      r.reason = reason; r.reasonNote = note;
      notify(s, r.by, `Dossier rejeté : votre demande ${r.code} pour ${p ? p.title : r.ref} n'a pas été retenue. Motif : ${reason}${note ? " (" + note + ")" : ""}.`);
      s.msgs.push({ with: r.by, from: "immo", text: `Bonjour ${r.name}, votre dossier ${r.code} est rejeté. Motif : ${reason}${note ? ". " + note : "."} Vous pouvez nous écrire ici pour en discuter.`, t: Date.now(), unread: true });
      logAct(s, `Dossier ${r.code} rejeté : ${reason}`);
    } else {
      delete r.reason; delete r.reasonNote;
      r.stage = Math.max(3, r.stage || 0);
      if (p) p.status = "réservé";
      notify(s, r.by, `Dossier accepté : votre demande ${r.code} pour ${p ? p.title : r.ref} est acceptée.`);
      logAct(s, `Dossier ${r.code} accepté`);
    }
  });
}

/** Fait avancer un dossier accepté vers la remise des clés. */
export function nextStage(code: string) {
  mutate((s) => {
    const r = s.requests.find((x) => x.code === code);
    if (!r) return;
    r.stage = Math.min(5, (r.stage || 3) + 1);
    notify(s, r.by, `Demande ${r.code} : ${STAGES[r.stage].toLowerCase()}.`);
    logAct(s, `Demande ${r.code} : ${STAGES[r.stage]}`);
    if (r.stage === 5) { const p = byRef(s, r.ref); if (p) p.status = "occupé"; }
  });
}

export function askDocument(code: string) {
  mutate((s) => {
    const r = s.requests.find((x) => x.code === code);
    if (!r) return;
    const miss = (SITU[r.situation ?? "CDI"] ?? SITU.CDI).filter((k) => !(r.checks ?? {})[k]).map((k) => DOCS[k]);
    r.stage = 1;
    const txt = `Votre dossier ${r.code} est incomplet${miss.length ? " : " + miss.join(", ").toLowerCase() : ""}. Déposez la pièce dans votre espace.`;
    notify(s, r.by, txt, { v: "espace", tab: "docs" });
    s.msgs.push({ with: r.by, from: "immo", text: txt, t: Date.now(), unread: true });
    logAct(s, `Pièce demandée pour ${r.code}`);
  });
}

export const checkPiece = (code: string, key: string, on: boolean) =>
  mutate((s) => { const r = s.requests.find((x) => x.code === code); if (r) r.checks = { ...(r.checks ?? {}), [key]: on }; });

export const saveNote = (code: string, text: string) => mutate((s) => { s.notes[code] = text.slice(0, 1000); });

export function cancelRequestByClient(code: string) {
  mutate((s) => {
    const r = s.requests.find((x) => x.code === code);
    if (!r) return;
    r.status = "annulée";
    logAct(s, `Demande ${r.code} annulée par le client`);
  });
}

/** Annulation d'une réservation acceptée par le propriétaire (le locataire est prévenu). */
export function cancelByOwner(code: string, why: string, note: string) {
  mutate((s) => {
    const r = s.requests.find((x) => x.code === code);
    if (!r || r.status === "annulée") return;
    const p = byRef(s, r.ref);
    r.status = "annulée";
    r.cancel = { by: "owner", why, note, t: Date.now(), who: s.user?.name };
    r.decided = { t: Date.now(), by: "Propriétaire" };
    if (p && !s.requests.some((x) => x.ref === r.ref && x.code !== r.code && (x.status === "validée" || x.status === "en attente"))) p.status = "libre";
    s.msgs.push({ with: r.by, from: "immo", text: `Votre réservation ${r.code} a été annulée par le propriétaire. Motif : ${why}. ${note} Nous vous proposons des biens similaires, et vous pouvez déclarer un litige depuis l'onglet « Litiges ».`, t: Date.now(), unread: true });
    notify(s, r.by, `Réservation ${r.code} annulée par le propriétaire : ${why}.`);
    notifyAdmins(s, `Annulation par le propriétaire : ${r.code} (${why}).`, "dem");
    logAct(s, `Annulation de la réservation ${r.code} par le propriétaire : ${why}`);
  });
}

/* ---------- urgences et devis ---------- */
export function advanceIncident(code: string, status: string) {
  mutate((s) => {
    const i = s.incidents.find((x) => x.code === code);
    if (!i) return;
    i.status = status;
    if (status === "dispatché") {
      i.prest = i.type === "Plomberie" ? "Plomberie du Wouri" : "Prestataire agréé " + i.type.toLowerCase();
      i.prestEmail = (s.providers.find((p) => p.name === i.prest) ?? s.providers.find((p) => p.status === "agréé" && p.metier === i.type))?.email ?? null;
    }
    notify(s, i.by, status === "en route" ? `Signalement ${i.code} : le prestataire est en route.` : status === "sur place" ? `Signalement ${i.code} : le prestataire est sur place.` : `Signalement ${i.code} : ${i.prest} dispatché, intervention sous 24 h.`);
    logAct(s, `Urgence ${i.code} ${status}`);
  });
}

export function closeIncident(code: string, rapport: string) {
  mutate((s) => {
    const i = s.incidents.find((x) => x.code === code);
    if (!i) return;
    i.status = "clôturé"; i.rapport = rapport.slice(0, 1000);
    notify(s, i.by, `Le signalement ${i.code} est clôturé. Rapport : ${i.rapport}`);
    logAct(s, `Urgence ${i.code} clôturée par le prestataire`);
  });
}

export function setQuoteStatus(code: string, status: string) {
  mutate((s) => {
    const q = s.quotes.find((x) => x.code === code);
    if (!q) return;
    q.status = status;
    notify(s, q.by, status === "signé" ? `Devis ${q.code} signé. Immo Bell suit l'engagement.` : `Votre devis ${q.code} est prêt. Immo Bell vous le transmet pour signature.`);
    logAct(s, `Devis ${q.code} ${status}`);
  });
}

/* ---------- biens, comptes, avis ---------- */
export function setValidation(ref: string, v: "validé" | "refusé" | "archivé") {
  mutate((s) => {
    const p = byRef(s, ref);
    if (!p) return;
    p.validation = v;
    if (v === "validé") p.status = "libre";
    logAct(s, `${v === "validé" ? "Validation" : v === "refusé" ? "Refus" : "Archivage"} du bien ${p.ref}`);
  });
}

export const toggleUser = (email: string) =>
  mutate((s) => {
    const u = s.users.find((x) => x.email === email);
    if (!u) return;
    u.status = u.status === "actif" ? "suspendu" : "actif";
    logAct(s, `Compte ${u.email} : ${u.status}`);
  });

export const removeReview = (ref: string, i: number) =>
  mutate((s) => { s.reviews[ref]?.splice(i, 1); logAct(s, `Avis supprimé sur ${ref}`); });

/* ---------- client ---------- */
export const setAvailability = (ref: string, status: "libre" | "réservé" | "occupé") =>
  mutate((s) => { const p = byRef(s, ref); if (p) { p.status = status; logAct(s, `Disponibilité de ${ref} : ${status}`); } });

export const sendMessage = (text: string) => {
  const email = getState().user?.email;
  if (!email) return;
  mutate((s) => { s.msgs.push({ with: email, from: "me", text: text.slice(0, 1000), t: Date.now() }); });
  setTimeout(() => mutate((s) => { s.msgs.push({ with: email, from: "immo", text: "Message bien reçu. Un conseiller Immo Bell vous répond entre 8 h et 18 h.", t: Date.now() }); }), 1200);
};

export const markMessagesRead = (email: string) =>
  mutate((s) => s.msgs.forEach((m) => { if (m.with === email) m.unread = false; }));
export const markNotifsRead = (email: string) =>
  mutate((s) => s.notifs.forEach((n) => { if (n.email === email) n.read = true; }));
export const toggleFav = (ref: string) =>
  mutate((s) => { s.favs = s.favs.includes(ref) ? s.favs.filter((r) => r !== ref) : [...s.favs, ref]; });
export const uploadDoc = (email: string, key: string) =>
  mutate((s) => { s.docs[email] = { ...(s.docs[email] ?? {}), [key]: "à valider" }; });

export type { Req };

/* ---------- réservation, avis ---------- */
export interface BookData { ref: string; a: string; b?: string; occ: number; dur?: string; name: string; tel: string; mail: string; sit: string; rev: string; gar: boolean; docs: Record<string, boolean>; note: string }

/** Enregistre la demande de réservation (crée le compte visiteur s'il n'existe pas) et renvoie son code. */
export function createRequest(d: BookData) {
  const c = "RES-2026-" + String(Math.floor(1000 + Math.random() * 9000));
  mutate((s) => {
    const p = byRef(s, d.ref);
    if (!s.user) { s.user = { name: d.name, email: d.mail, phone: d.tel, role: "visitor", status: "actif" }; s.users.push({ name: d.name, email: d.mail, role: "visitor", status: "actif" }); }
    const by = s.user.email || s.user.phone || "";
    const need = SITU[d.sit] ?? SITU.CDI, complete = need.every((k) => d.docs[k]);
    s.requests.unshift({ code: c, ref: d.ref, name: d.name, phone: d.tel, date: d.a, ...(d.b ? { end: d.b } : {}), note: d.note, status: "en attente", by, t: Date.now(), stage: complete ? 2 : 1, situation: d.sit, rev: +d.rev || 0, garant: d.gar, checks: { ...d.docs } });
    s.docs[by] = s.docs[by] ?? {};
    need.forEach((k) => { if (!s.docs[by][k]) s.docs[by][k] = d.docs[k] ? "à valider" : "manquant"; });
    notify(s, by, `Demande ${c} reçue pour ${p?.title ?? d.ref}. Réponse sous 72 h.`, { v: "espace", tab: "res" });
    notifyAdmins(s, `Nouvelle demande ${c} sur ${d.ref}.`, "dem");
    logAct(s, `Nouvelle demande ${c} sur ${d.ref}`);
  });
  return c;
}

export const addReview = (ref: string, stars: number, text: string) =>
  mutate((s) => { (s.reviews[ref] = s.reviews[ref] ?? []).unshift({ who: s.user?.name ?? "Visiteur", stars, text, t: Date.now() }); logAct(s, `Avis publié sur ${ref}`); });
