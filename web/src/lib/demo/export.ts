/* Export ZIP des dossiers, textes de diffusion des annonces et calendrier iCal (outils de la maquette). */
import { DOCS, ROLES, SITU, STAGES, fcfa } from "./consts";
import { rl } from "./props";
import type { Demo, Prop, Req } from "./store";

export const FRD = (t: number) => new Date(t).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const safeName = (s: string) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "x";
const csv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map((c) => { const s = String(c ?? ""); return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(";")).join("\r\n");

export function copyText(t: string): Promise<boolean> {
  const fb = () => { try { const a = document.createElement("textarea"); a.value = t; a.setAttribute("readonly", ""); a.style.cssText = "position:fixed;left:-9999px;top:0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); return ok; } catch { return false; } };
  try { if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(t).then(() => true, () => fb()); } catch { /* repli ci-dessous */ }
  return Promise.resolve(fb());
}

export function saveFile(name: string, blob: Blob): "ok" | "error" {
  try { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); return "ok"; } catch { return "error"; }
}

/* ZIP sans dépendance (méthode « stockée », noms en UTF-8) */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return (b: Uint8Array) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }; })();
interface ZFile { name: string; data: string }
function zipBuild(files: ZFile[]) {
  const enc = new TextEncoder(), parts: Uint8Array[] = [], cen: Uint8Array[] = []; let off = 0;
  const u16 = (n: number) => [n & 255, (n >> 8) & 255], u32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  const d = new Date(), dt = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dd = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  files.forEach((f) => {
    const nm = enc.encode(f.name), b = enc.encode(f.data), crc = CRC(b);
    const lh = new Uint8Array([0x50, 0x4b, 3, 4, 20, 0, 0, 8, 0, 0, ...u16(dt), ...u16(dd), ...u32(crc), ...u32(b.length), ...u32(b.length), ...u16(nm.length), 0, 0]);
    parts.push(lh, nm, b);
    const ch = new Uint8Array([0x50, 0x4b, 1, 2, 20, 0, 20, 0, 0, 8, 0, 0, ...u16(dt), ...u16(dd), ...u32(crc), ...u32(b.length), ...u32(b.length), ...u16(nm.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]);
    cen.push(ch, nm); off += lh.length + nm.length + b.length;
  });
  const cs = cen.reduce((a, x) => a + x.length, 0), end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cs), ...u32(off), 0, 0]);
  return new Blob([...parts, ...cen, end] as BlobPart[], { type: "application/zip" });
}

const RSTL: Record<string, string> = { "en attente": "En cours d'analyse", "validée": "Dossier accepté", "refusée": "Dossier rejeté", "annulée": "Demande annulée" };
const stLbl = (s: string) => RSTL[s] ?? s;

function dossierFiles(S: Demo, r: Req, dir: string): ZFile[] {
  const p = S.props.find((x) => x.ref === r.ref) ?? { title: r.ref, q: "", mode: "", price: 0 }, need = SITU[r.situation ?? "CDI"] ?? SITU.CDI, docs = S.docs[r.by] ?? {}, ck = r.checks ?? {};
  const L = [`DOSSIER ${r.code}`, "=".repeat(8 + r.code.length), "", `Statut : ${stLbl(r.status)}`,
    ...(r.status === "refusée" ? [`Motif du rejet : ${r.reason || "non précisé"}`, ...(r.reasonNote ? [`Précision : ${r.reasonNote}`] : [])] : []),
    ...(r.decided ? [`Décision : ${FRD(r.decided.t)} par ${r.decided.by}`] : []), "",
    `Demandeur : ${r.name}`, `Téléphone : ${r.phone}`, `Compte : ${r.by}`, `Situation : ${r.situation || "—"}`, `Revenu net mensuel : ${r.rev ? fcfa(r.rev) : "—"}`, `Garant : ${r.garant ? "Oui" + (r.grev ? " (" + fcfa(r.grev) + ")" : "") : "Non"}`, "",
    `Bien : ${p.title} (${r.ref})`, `Quartier : ${p.q}`, `Opération : ${p.mode}`, `Prix : ${fcfa(p.price)}`, `Date souhaitée : ${r.date || "—"}${r.end ? " au " + r.end : ""}`, `Demande reçue le : ${FRD(r.t)}`, `Étape : ${STAGES[r.stage ?? 0]}`,
    ...(r.note ? ["", `Message du demandeur : ${r.note}`] : []), ...(S.notes[r.code] ? ["", `Notes internes : ${S.notes[r.code]}`] : [])];
  const pieces = [["Pièce", "Contrôle juridique", "Dépôt par le client"], ...need.map((k) => [DOCS[k] || k, ck[k] ? "Contrôlée" : "À contrôler", docs[k] || "—"]), ["Ancien bailleur contacté", ck.bailleur ? "Oui" : "Non", ""]];
  return [{ name: dir + "00_fiche_dossier.txt", data: L.join("\r\n") }, { name: dir + "01_pieces.csv", data: csv(pieces) }];
}

export function buildZip(S: Demo, list: Req[], label: string) {
  const files: ZFile[] = [], idx: unknown[][] = [["Code", "Réf. bien", "Bien", "Demandeur", "Téléphone", "Compte", "Situation", "Revenu net", "Statut", "Motif du rejet", "Reçue le", "Décision le"]];
  list.forEach((r) => {
    const p = S.props.find((x) => x.ref === r.ref) ?? { title: r.ref }, dir = `${safeName(r.ref + "_" + p.title)}/${safeName(r.code + "_" + r.name)}/`;
    files.push(...dossierFiles(S, r, dir));
    idx.push([r.code, r.ref, p.title, r.name, r.phone, r.by, r.situation || "", r.rev || "", stLbl(r.status), r.status === "refusée" ? r.reason || "" : "", FRD(r.t), r.decided ? FRD(r.decided.t) : ""]);
  });
  files.unshift({ name: "index_dossiers.csv", data: csv(idx) }, { name: "LISEZMOI.txt", data: [`Export Immo Bell du ${FRD(Date.now())}`, `Exporté par : ${S.user ? ROLES[S.user.role] : "—"}`, `Contenu : ${list.length} dossier(s), ${label}`, "",
    "Organisation : un dossier de bien, puis un dossier par demande, avec la fiche et l'état des pièces.", "Données personnelles : à traiter selon la politique de confidentialité d'Immo Bell, ne pas diffuser.",
    "Démonstration : les scans déposés ne sont pas inclus dans ce prototype. La version en ligne les ajoutera dans chaque dossier."].join("\r\n") });
  return zipBuild(files);
}

/* ---------- diffusion vers d'autres plateformes ---------- */
export const PLATS = [{ k: "facebook", n: "Facebook" }, { k: "whatsapp", n: "WhatsApp" }, { k: "instagram", n: "Instagram" }, { k: "airbnb", n: "Airbnb", short: true }, { k: "booking", n: "Booking.com", short: true }] as const;
export const HELP: Record<string, string> = { facebook: "Publiez sur la page Immo Bell ou sur Marketplace : copiez le texte, collez-le dans la publication et ajoutez les photos de la galerie.", whatsapp: "Envoyez le message à un contact ou publiez-le en statut. Le texte est déjà mis en forme (gras, émojis).", instagram: "Instagram ne permet pas de publier depuis un site : copiez la légende, puis collez-la depuis l'application, avec la photo de couverture.", airbnb: "Créez l'annonce depuis votre espace hôte, section par section. Les titres ci-dessous suivent les champs demandés par Airbnb.", booking: "Booking.com accepte les hébergements après inscription comme partenaire. Les rubriques ci-dessous reprennent celles du formulaire." };
export const pUrl = (p: Prop) => "https://immobell.cm/bien/" + p.ref;
const hashTag = (t: string) => "#" + String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
const MODEL: Record<string, string> = { Location: "À louer", Vente: "À vendre", Saisonnière: "Séjour court", Colocation: "Colocation", "Location-gérance": "Location-gérance", "Bail de mobilité": "Bail de mobilité" };

export function difText(p: Prop, k: string) {
  const price = fcfa(p.price) + (p.mode === "Vente" ? "" : p.mode === "Saisonnière" ? " / nuit" : " / mois"), eq = p.eq.slice(0, 6).join(", "), m = MODEL[p.mode] ?? p.mode, url = pUrl(p);
  if (k === "whatsapp") return `*${m} · ${p.title}*\n📍 ${p.q}, Douala\n💰 ${price}\n📐 ${p.surface} m² · ${rl(p)}\n\nAnnonce complète : ${url}\nDossier étudié par le pôle juridique Immo Bell.`;
  if (k === "instagram") return `${p.title} ✨\n📍 ${p.q}, Douala · ${price}\n${rl(p)} · ${p.surface} m²\n\n${p.eq.slice(0, 3).join(" · ")}\nAnnonce complète : lien dans la bio.\n\n#Douala #Cameroun #Immobilier ${hashTag(p.type)} ${hashTag(p.q)} #ImmoBell`;
  if (k === "airbnb" || k === "booking") { const t = p.title.length > 50 ? p.title.slice(0, 49) + "…" : p.title; return `TITRE${k === "airbnb" ? " (50 caractères maximum)" : ""}\n${t}\n\nDESCRIPTION\n${p.desc}\n\nL'ESPACE\n${rl(p)}, ${p.surface} m². Équipements : ${eq}.\n\nQUARTIER\n${p.q}, Douala.\n\nTARIF\n${price}\n\nRÈGLES DE LA MAISON\n${p.cond || "À préciser avec le bailleur."}\n\nACCUEIL\nConciergerie et service après-vente Immo Bell, de 8 h à 18 h.`; }
  return `🏠 ${m} · ${p.title}\n📍 ${p.q}, Douala\n💰 ${price}\n📐 ${p.surface} m² · ${rl(p)}\n✅ ${eq}\n\n${p.desc}\n\nDossier étudié par le pôle juridique Immo Bell, réponse sous 72 h.\n👉 Annonce complète : ${url}\n✉️ contact@immobell.cm\n\n#Douala #Immobilier ${hashTag(p.type)} ${hashTag(p.q)} #ImmoBell`;
}

const nextDay = (d: string) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); };
export function icsFor(S: Demo, p: Prop) {
  const days = [...new Set([...(S.cal[p.ref] ?? []), ...(S.blocks[p.ref] ?? [])])].sort(), ev: [string, string][] = []; let a: string | null = null, b: string | null = null;
  days.forEach((d) => { if (a && nextDay(b!) === d) b = d; else { if (a) ev.push([a, nextDay(b!)]); a = d; b = d; } });
  if (a) ev.push([a, nextDay(b!)]);
  const c = (d: string) => d.replace(/-/g, ""), stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  return { text: ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Immo Bell//Disponibilites//FR", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Immo Bell " + p.ref, ...ev.flatMap(([s, e]) => ["BEGIN:VEVENT", `UID:${p.ref}-${c(s)}@immobell.cm`, "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:" + c(s), "DTEND;VALUE=DATE:" + c(e), "SUMMARY:Indisponible", "END:VEVENT"]), "END:VCALENDAR"].join("\r\n"), n: ev.length };
}
