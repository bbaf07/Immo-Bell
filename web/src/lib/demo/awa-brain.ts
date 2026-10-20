/* Cerveau « hors IA » d'Awa : reprend les règles de la maquette (recherche, budget, pièces, suivi, urgence).
   Il agit sur le site via le contexte fourni (navigation, recherche, réservation). */
import { DOCS, PERSONAS, ROLES, SITU, fcfa } from "./consts";
import { searchFor } from "./filters";
import { TYPES, MODES, byRef, deposit, isMine, filtered, pub, sc10, emptyFilters, type Filters } from "./props";
import { L, trText } from "./i18n";
import { getState, logAct, mutate, notify, loginAs, type Demo, type Role } from "./store";
import { QUART } from "./svg";

export interface Ctx { lang: "fr" | "en"; nav: (href: string) => void; book: (ref: string) => void; page: string; ref?: string }

const SVC_TABS = ["prest", "metier", "offres", "logistique", "urgences"], JUR_TABS = ["dossier", "pieces", "fonds", "conseils", "procedure", "securite", "admin"];
const ESP_TABS: Record<string, string[]> = { visitor: ["dash", "res", "docs", "msg", "favs", "sav", "notifs", "litiges"], owner: ["dash", "cal", "biens", "recues", "avis", "releves", "nouveau", "litiges"], legal: ["file", "commission", "traites"], provider: ["inter", "hist", "devis", "profil"], admin: ["dash", "valid", "dem", "urg", "devis", "avis", "comptes", "audit", "archive", "rapport", "cases", "presta", "equipe", "v2"] };
const unit = (p: { mode: string }) => (p.mode === "Saisonnière" ? "/ nuit" : p.mode === "Vente" ? "" : "/ mois");

export const brief = (S: Demo, p: ReturnType<typeof getState>["props"][number]) => ({ ref: p.ref, titre: p.title, quartier: p.q, type: p.type, operation: p.mode, prix_fcfa: p.price, unite: unit(p) || "prix de vente", pieces: p.rooms, surface_m2: p.surface, statut: p.status, note_sur_10: sc10(S, p.ref) ? +sc10(S, p.ref).toFixed(1) : null });

/* ---------- actions communes ---------- */
export function acSearch(c: Ctx, a: { quartiers?: string[]; types?: string[]; modes?: string[]; equipements?: string[]; max_price?: number; min_rooms?: number; only_available?: boolean; sort?: string }) {
  const S = getState(), arr = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : x ? [String(x)] : []);
  const f: Partial<Filters> = {
    qs: arr(a.quartiers).filter((q) => QUART[q]), types: arr(a.types).filter((t) => TYPES.includes(t)), modes: arr(a.modes).filter((m) => MODES.includes(m)), eq: arr(a.equipements),
    max: +(a.max_price ?? 0) || 0, rooms: +(a.min_rooms ?? 0) || 0, dispo: a.only_available ? ["libre"] : [], sort: ["top", "pa", "pd", "note", "new"].includes(a.sort ?? "") ? a.sort : "top",
  };
  searchFor(f);
  const res = filtered(S, { ...emptyFilters(), ...f } as Filters);
  c.nav("/biens");
  return { nombre: res.length, resultats: res.slice(0, 8).map((p) => brief(S, p)) };
}
export function acProp(c: Ctx, ref: string, show = true) {
  const S = getState(), p = byRef(S, String(ref || "").toUpperCase().trim());
  if (!p || p.validation !== "validé") throw new Error("Référence inconnue. Utilisez search_properties pour trouver une référence valide.");
  if (show) c.nav(`/biens/${p.ref}`);
  return { ...brief(S, p), description: p.desc, equipements: p.eq, conditions: p.cond, avis: (S.reviews[p.ref] ?? []).slice(0, 3).map((r) => ({ etoiles: r.stars, texte: r.text })), revenu_net_conseille_fcfa: p.mode === "Vente" ? null : p.price * 3 };
}
export function acBudget(a: { monthly_net_income?: number; annual_net_income?: number; rent?: number; charges?: number }) {
  const inc = +(a.monthly_net_income ?? 0) || (a.annual_net_income ? +a.annual_net_income / 12 : 0), rent = +(a.rent ?? 0) || 0, ch = +(a.charges ?? 0) || 0;
  const o: Record<string, unknown> = { regle: "loyer + charges <= 1/3 du revenu net mensuel" };
  if (inc) { o.revenu_net_mensuel = Math.round(inc); o.loyer_max_fcfa = Math.round(inc / 3); }
  if (rent) { o.loyer_plus_charges = rent + ch; o.revenu_net_minimum_fcfa = (rent + ch) * 3; o.depot_garantie_2_mois = rent * 2; o.a_prevoir_entree = rent * 3; if (inc) o.conforme = rent + ch <= inc / 3; }
  if (o.conforme === false) o.conseil = "Un garant solidaire est fortement conseillé.";
  return o as { loyer_max_fcfa?: number } & Record<string, unknown>;
}
export function acDocs(sit: string) {
  const k = Object.keys(SITU).find((x) => x.toLowerCase() === String(sit || "").toLowerCase()) ?? Object.keys(SITU).find((x) => x.toLowerCase().startsWith(String(sit || "").toLowerCase().slice(0, 3)));
  if (!k) throw new Error("Situation inconnue. Valeurs : " + Object.keys(SITU).join(", "));
  return { situation: k, pieces: SITU[k].map((d) => DOCS[d]), aussi: ["Factures et contrats", "Contact de l'ancien bailleur"], delai_etude: "72 h" };
}
export function acBook(c: Ctx, ref: string) {
  const S = getState(), p = byRef(S, String(ref || "").toUpperCase().trim());
  if (!p) throw new Error("Référence inconnue.");
  if (p.status !== "libre") throw new Error("Ce bien n'est pas libre (" + p.status + "). Proposez de l'ajouter aux favoris.");
  c.nav(`/biens/${p.ref}`); c.book(p.ref);
  return { ok: true, message: "Le formulaire de réservation est ouvert (4 étapes). Aucun paiement en ligne.", ref: p.ref };
}
export function acNav(c: Ctx, page: string, tab?: string) {
  const S = getState(), P = ["home", "biens", "services", "juridique", "simulateur", "espace"];
  if (!P.includes(page)) throw new Error("Page inconnue : " + P.join(", "));
  let href = page === "home" ? "/" : `/${page}`;
  if (page === "services" && tab && SVC_TABS.includes(tab)) href += `?tab=${tab}`;
  if (page === "juridique" && tab && JUR_TABS.includes(tab)) href += `?tab=${tab}`;
  if (page === "espace" && tab && S.user && (ESP_TABS[S.user.role] ?? []).includes(tab)) href += `?tab=${tab}`;
  c.nav(href);
  return { ok: true, page, tab: tab ?? null };
}
export function acSpace() {
  const S = getState(), u = S.user;
  if (!u) return { connecte: false, profils_demo: Object.entries(ROLES).map(([k, v]) => ({ role: k, libelle: v, nom: PERSONAS[k].name })) } as Record<string, unknown>;
  const o: Record<string, unknown> = { connecte: true, nom: u.name, role: u.role, libelle: ROLES[u.role], onglets: ESP_TABS[u.role] };
  if (u.role === "visitor") {
    const R = S.requests.filter((r) => r.by === u.email);
    o.demandes = R.map((r) => ({ code: r.code, bien: r.ref, titre: byRef(S, r.ref)?.title, statut: ({ "en attente": "En cours d'analyse", "validée": "Dossier accepté", "refusée": "Dossier rejeté" } as Record<string, string>)[r.status] ?? r.status, motif_rejet: r.reason ?? null, etape: r.stage ?? 0 }));
    const d = S.docs[u.email] ?? {}; o.pieces = Object.entries(d).map(([k, v]) => ({ piece: DOCS[k], etat: v })); o.favoris = S.favs.slice(0, 6); o.notifications_non_lues = S.notifs.filter((n) => n.email === u.email && !n.read).length;
  }
  if (u.role === "owner") { const mine = S.props.filter((p) => isMine(p, u.email)); o.biens = mine.map((p) => ({ ref: p.ref, titre: p.title, statut: p.status, validation: p.validation, vues: p.views })); o.demandes_recues = S.requests.filter((r) => mine.some((p) => p.ref === r.ref)).map((r) => ({ code: r.code, bien: r.ref, statut: r.status })); }
  if (u.role === "legal") o.dossiers_en_attente = S.requests.filter((r) => r.status === "en attente").map((r) => ({ code: r.code, demandeur: r.name, bien: r.ref, reste_h: Math.max(0, 72 - Math.round((Date.now() - r.t) / 3600e3)) }));
  if (u.role === "provider") o.interventions = S.incidents.filter((i) => i.status !== "clôturé").map((i) => ({ code: i.code, type: i.type, niveau: i.level, bien: i.ref, statut: i.status, description: i.desc }));
  if (u.role === "admin") { o.biens_actifs = pub(S).length; o.biens_a_valider = S.props.filter((p) => p.validation === "en attente").map((p) => ({ ref: p.ref, titre: p.title })); o.demandes_en_attente = S.requests.filter((r) => r.status === "en attente").length; o.urgences_ouvertes = S.incidents.filter((i) => i.status !== "clôturé").length; o.devis_en_cours = S.quotes.filter((q) => q.status !== "signé").length; }
  return o;
}
export function acEmergency(a: { type?: string; level?: string; ref?: string; description?: string }) {
  const S = getState(); if (!S.user) throw new Error("L'utilisateur doit être connecté. Proposez login_demo avec le rôle visitor.");
  const code = "URG-" + String(Math.floor(1000 + Math.random() * 9000)), types = ["Plomberie", "Électricité", "Serrurerie", "Autre"], lv = ["Urgent", "Sous 24 h", "Non urgent"];
  const ref = byRef(S, String(a.ref ?? "").toUpperCase()) ? String(a.ref).toUpperCase() : "IB-BNJ-001";
  mutate((s) => { s.incidents.unshift({ code, ref, type: types.includes(a.type ?? "") ? a.type! : "Autre", profil: s.user!.role === "owner" ? "Propriétaire" : "Locataire", desc: String(a.description ?? "").slice(0, 300) || "Signalé via Awa.", phone: s.user!.phone ?? "", level: lv.includes(a.level ?? "") ? a.level! : "Sous 24 h", status: "reçu", prest: "", by: s.user!.email || s.user!.phone || "", t: Date.now() }); notify(s, s.user!.email, `Signalement ${code} reçu. Analyse en cours.`); logAct(s, `Nouveau signalement ${code} (via Awa)`); });
  return { ok: true, code, delai: "dispatch vers un prestataire agréé sous 24 h" };
}

/* ---------- agent à règles ---------- */
const QALIAS: Record<string, string> = Object.fromEntries(Object.keys(QUART).map((q) => [q.toLowerCase(), q]));
const TALIAS: [RegExp, string][] = [[/\bappart|\bt[2-5]\b|\bf[2-5]\b|apartment|flat/, "Appartement"], [/villa|maison|house/, "Villa"], [/studio/, "Studio"], [/terrain|parcelle|\bland\b|\bplot/, "Terrain"], [/bureau|office/, "Bureau"], [/boutique|magasin|\bshop|local commercial/, "Boutique"], [/fonds de commerce|restaurant|boulangerie|salon de coiffure|business/, "Fonds de commerce"]];
const EALIAS: [RegExp, string][] = [[/parking|garage/, "Parking"], [/clim|air.?cond/, "Climatisation"], [/groupe|g[ée]n[ée]rateur|generator/, "Groupe électrogène"], [/wifi|wi-fi|internet|fibre/, "Wifi"], [/gardien|s[ée]curis|caretaker/, "Gardien"], [/piscine|pool/, "Piscine"], [/titre foncier|land title/, "Titre foncier"]];

function parseMoney(s: string) {
  const m = s.replace(/[  ]/g, " ").match(/(\d[\d .,]*)\s*(k|m|millions?|mille|000)?\s*(fcfa|f\b|xaf)?/gi);
  if (!m) return 0;
  let best = 0;
  for (const x of m) { const mm = x.match(/(\d[\d .,]*)\s*(k|m\b|millions?|mille)?/i); if (!mm) continue; let n = parseFloat(mm[1].replace(/ /g, "").replace(",", ".")); const u = (mm[2] ?? "").toLowerCase(); if (u === "k" || u === "mille") n *= 1e3; else if (u === "m" || u.startsWith("million")) n *= 1e6; if (n > best) best = n; }
  return best;
}

export function acOffline(text: string, c: Ctx): string {
  const lg = c.lang, l = (fr: string, en: string) => L(lg, fr, en), tx = (s: string) => trText(s, lg);
  const t = text.toLowerCase().normalize("NFC"), out: string[] = [], say = (s: string) => out.push(s);
  const ref = (text.match(/IB-[A-Z]{3}-\d{3}/i) ?? [])[0];
  if (/bonjour|salut|hello|^hi\b|bonsoir/.test(t) && t.length < 25) { say(l("Bonjour ! Je suis Awa. Dites-moi ce que vous cherchez : quartier, type de bien et budget. Par exemple « un appartement à Bonanjo sous 400 000 FCFA ».", "Hello! I'm Awa. Tell me what you're looking for: neighbourhood, property type and budget. For example “an apartment in Bonanjo under 400,000 FCFA”.")); return out.join("\n"); }
  if (/(r[ée]serv|book)/.test(t) && (ref || c.page === "bien")) {
    try { const r = acBook(c, ref ?? c.ref ?? ""); say(l(`C'est parti : le formulaire de réservation de [[${r.ref}]] est ouvert. Quatre étapes, aucun paiement en ligne, réponse sous 72 h.`, `Done: the booking form for [[${r.ref}]] is open. Four steps, no online payment, answer within 72 h.`)); }
    catch { say(l("Ce bien n'est pas libre pour le moment. Ajoutez-le à vos favoris : vous serez prévenu s'il se libère.", "This property isn't available right now. Add it to your favourites: you'll be notified if it becomes available.")); }
    return out.join("\n");
  }
  if (ref) {
    try { const p = acProp(c, ref, true) as ReturnType<typeof brief> & { revenu_net_conseille_fcfa: number | null };
      say(l(`Je vous ouvre la fiche : [[${p.ref}]]\nStatut : **${p.statut}**, ${p.surface_m2} m², note ${p.note_sur_10 ?? "nouveau"}${p.note_sur_10 ? "/10" : ""}.${p.revenu_net_conseille_fcfa ? ` Revenu net conseillé : ${fcfa(p.revenu_net_conseille_fcfa)} par mois.` : ""}`, `Opening the listing: [[${p.ref}]]\nStatus: **${tx(p.statut)}**, ${p.surface_m2} m².`)); }
    catch { say(l("Je ne trouve pas cette référence.", "I can't find that reference.")); }
    return out.join("\n");
  }
  if (/urgen|fuite|panne|coupure|serrure|leak|power cut|lock/.test(t)) {
    const type = /fuite|eau|plomb|leak|water/.test(t) ? "Plomberie" : /[ée]lectri|courant|panne|disjonct|power/.test(t) ? "Électricité" : /serrure|cl[ée]|lock|key/.test(t) ? "Serrurerie" : "Autre";
    acNav(c, "services", "urgences"); say(l(`Je vous ai ouvert le signalement d'urgence (${type.toLowerCase()}). Remplissez le formulaire : un prestataire agréé est dispatché sous 24 h.`, `I've opened the emergency report (${tx(type).toLowerCase()}). Fill in the form: an approved contractor is dispatched within 24 h.`)); return out.join("\n");
  }
  const sitK = /[ée]tudiant|student/.test(t) ? "Étudiant" : /\bcdi\b|permanent/.test(t) ? "CDI" : /\bcdd\b|stage|intern/.test(t) ? "CDD ou stage" : /ind[ée]pendant|commer[çc]ant|self.?employed/.test(t) ? "Indépendant ou commerçant" : /expat|mission/.test(t) ? "Expatrié ou mission" : "";
  if (/pi[èe]ce|document|dossier|papier|fournir/.test(t) && !/\d\s*pi[èe]ces?/.test(t) && !/mon dossier|ma demande|my application/.test(t)) {
    if (!sitK) { say(l("Les pièces dépendent de votre situation. Vous êtes en CDI, en CDD ou stage, étudiant, indépendant ou expatrié ?", "Documents depend on your situation. Are you on a permanent contract, fixed-term or internship, a student, self-employed or an expat?")); return out.join("\n"); }
    const d = acDocs(sitK); say(l(`Pour un dossier « ${sitK} », prévoyez :\n${d.pieces.map((x) => "- " + x).join("\n")}\nLe pôle juridique étudie le dossier sous 72 h.`, `For a “${tx(sitK)}” application, prepare:\n${d.pieces.map((x) => "- " + tx(x)).join("\n")}\nThe legal team reviews it within 72 h.`)); return out.join("\n");
  }
  if (/mon dossier|ma demande|mes demandes|my application|my request|o[ùu] en est/.test(t)) {
    const s = acSpace() as { connecte: boolean; libelle?: string; demandes?: { code: string; statut: string; motif_rejet: string | null; bien: string }[]; pieces?: { piece: string; etat: string }[] };
    if (!s.connecte) { say(l("Vous n'êtes pas connecté. Dans la démo, choisissez un profil dans « Mon espace » (par exemple Carine, cliente) et je vous montre l'état de sa demande.", "You're not signed in. In the demo, pick a profile in “My account” (for example Carine, client) and I'll show you her request status.")); acNav(c, "espace"); return out.join("\n"); }
    if (s.demandes) { acNav(c, "espace", "res"); say(s.demandes.length ? l(`Vous avez ${s.demandes.length} demande${s.demandes.length > 1 ? "s" : ""} :\n${s.demandes.map((r) => `**${r.code}** · ${r.statut}${r.motif_rejet ? ` (motif : ${r.motif_rejet})` : ""}\n[[${r.bien}]]`).join("\n")}${s.pieces?.some((p) => p.etat === "manquant") ? "\n**Il manque encore :** " + s.pieces.filter((p) => p.etat === "manquant").map((p) => p.piece).join(", ") + "." : ""}`, `You have ${s.demandes.length} request(s):\n${s.demandes.map((r) => `**${r.code}** · ${tx(r.statut)}${r.motif_rejet ? ` (reason: ${tx(r.motif_rejet)})` : ""}\n[[${r.bien}]]`).join("\n")}`) : l("Aucune demande pour l'instant.", "No requests yet.")); return out.join("\n"); }
    say(l(`Vous êtes connecté en tant que ${s.libelle}. Je vous ouvre votre espace.`, `You're signed in as ${tx(s.libelle ?? "")}. Opening your account.`)); acNav(c, "espace"); return out.join("\n");
  }
  if (/pack|confier|propri[ée]taire|g[ée]rer mon bien|owner|entrust/.test(t)) { acNav(c, "services", "offres"); say(l("Nos quatre packs : **Basic** 8 % (loyers et quittances), **Standard** 12 % (plus mise en ligne et visites), **Premium** 18 % (plus locaux commerciaux, maintenance prioritaire), **Diaspora** 18 % + 25 000 FCFA/mois (plus rapport vidéo trimestriel). Je vous ai ouvert la page des offres.", "Our four packs: **Basic** 8% (rent and receipts), **Standard** 12% (plus listing and visits), **Premium** 18% (plus commercial premises, priority maintenance), **Diaspora** 18% + 25,000 FCFA/month (plus quarterly video report). I've opened the offers page.")); return out.join("\n"); }
  if (/d[ée]m[ée]nag|v[ée]hicule|camion|moving|truck/.test(t)) { acNav(c, "services", "logistique"); say(l("Pour un déménagement ou un véhicule, faites une demande de devis : je vous ai ouvert la page Logistique. Le devis est envoyé par Immo Bell, puis signé.", "For moving or a vehicle, request a quote: I've opened the Logistics page. Immo Bell sends the quote, then you sign it.")); return out.join("\n"); }
  const money = parseMoney(t);
  if (/(salaire|revenu|gagne|income|earn|salary)/.test(t) && money) {
    const inc = /an\b|annuel|par an|year/.test(t) ? money / 12 : money, b = acBudget({ monthly_net_income: inc });
    acSearch(c, { max_price: b.loyer_max_fcfa, modes: ["Location", "Location meublée", "Colocation", "Bail de mobilité"], only_available: true });
    say(l(`Avec ${fcfa(inc)} net par mois, votre loyer charges comprises peut aller jusqu'à **${fcfa(b.loyer_max_fcfa ?? 0)}** (règle du tiers). J'affiche les biens libres dans ce budget.`, `With ${fcfa(inc)} net a month, your rent including charges can go up to **${fcfa(b.loyer_max_fcfa ?? 0)}** (one-third rule). Showing available properties within that budget.`)); return out.join("\n");
  }
  const qs = Object.entries(QALIAS).filter(([k]) => t.includes(k)).map(([, v]) => v), types = TALIAS.filter(([rx]) => rx.test(t)).map(([, v]) => v), eq = EALIAS.filter(([rx]) => rx.test(t)).map(([, v]) => v);
  let modes: string[] = [];
  if (/achet|achat|vente|vendre|\bbuy|for sale|purchase/.test(t)) modes = ["Vente"]; else if (/nuit|court s[ée]jour|week.?end|night|short stay|vacances/.test(t)) modes = ["Saisonnière"]; else if (/coloc|flat.?share|chambre/.test(t)) modes = ["Colocation"]; else if (/meubl|furnished/.test(t)) modes = ["Location meublée", "Saisonnière", "Bail de mobilité", "Colocation"]; else if (/lou|location|rent/.test(t)) modes = ["Location", "Location meublée", "Colocation", "Bail de mobilité", "Location-gérance"];
  const rm = (t.match(/(\d)\s*(pi[èe]ces?|chambres?|rooms?|bedrooms?)/) ?? [])[1], rooms = rm ? +rm + (/chambre|bedroom/.test(t) ? 1 : 0) : 0;
  const max = /(sous|moins|max|maximum|budget|under|below|jusqu|pas plus)/.test(t) || money >= 10000 ? money : 0;
  if (qs.length || types.length || eq.length || modes.length || max || rooms) {
    const r = acSearch(c, { quartiers: qs, types, modes, equipements: eq, max_price: max, min_rooms: rooms });
    const crit = [types.join(l(" ou ", " or ")), qs.length ? l("à ", "in ") + qs.join(", ") : "", max ? l("jusqu'à ", "up to ") + fcfa(max) : "", rooms ? rooms + l(" pièces min.", " rooms min.") : "", eq.join(", ")].filter(Boolean).map(tx).join(", ");
    if (!r.nombre) { say(l(`Aucun bien ne correspond pour l'instant${crit ? " (" + crit + ")" : ""}. Essayez un budget un peu plus large ou un quartier voisin.`, `No property matches yet${crit ? " (" + crit + ")" : ""}. Try a slightly bigger budget or a nearby neighbourhood.`)); return out.join("\n"); }
    const top = r.resultats.slice(0, 3);
    say(l(`J'ai trouvé **${r.nombre} bien${r.nombre > 1 ? "s" : ""}**${crit ? " (" + crit + ")" : ""}. ${r.nombre > 1 ? "Ils sont affichés à l'écran. Les plus pertinents :" : "Il est affiché à l'écran :"}\n${top.map((p) => `- [[${p.ref}]] ${p.statut === "libre" ? "" : "(" + p.statut + ")"}`).join("\n")}\nVoulez-vous que j'ouvre l'un d'eux ou que je lance une réservation ?`, `I found **${r.nombre} propert${r.nombre > 1 ? "ies" : "y"}**${crit ? " (" + crit + ")" : ""}, shown on screen. Top picks:\n${top.map((p) => `- [[${p.ref}]] ${p.statut === "libre" ? "" : "(" + tx(p.statut) + ")"}`).join("\n")}\nShall I open one or start a booking?`)); return out.join("\n");
  }
  if (/combien|prix moyen|tarif|how much|price/.test(t)) { acSearch(c, {}); say(l("Les loyers vont de 90 000 FCFA (colocation à Akwa) à 1 200 000 FCFA (villa à Bonapriso), et les séjours courts commencent à 45 000 FCFA la nuit. Précisez un quartier ou un type et je filtre pour vous.", "Rents range from 90,000 FCFA (flat share in Akwa) to 1,200,000 FCFA (villa in Bonapriso); short stays start at 45,000 FCFA a night. Tell me a neighbourhood or type and I'll filter.")); return out.join("\n"); }
  say(l("Je peux chercher un bien (quartier, type, budget), calculer votre budget, lister les pièces du dossier, suivre votre demande ou signaler une urgence. Que souhaitez-vous ?", "I can find a property (neighbourhood, type, budget), check your budget, list the required documents, track your request or report an emergency. What would you like?"));
  return out.join("\n");
}

export { deposit, loginAs, type Role };
