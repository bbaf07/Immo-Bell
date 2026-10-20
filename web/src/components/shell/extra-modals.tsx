"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ReportModal } from "@/components/demo/espace-staff";
import { fcfa } from "@/lib/demo/consts";
import { HELP, PLATS, copyText, difText, icsFor, pUrl } from "@/lib/demo/export";
import { IDBX } from "@/lib/demo/engine/tour";
import { forgetTourCache } from "@/lib/demo/engine/tour";
import { unit } from "@/lib/demo/props";
import { QUART } from "@/lib/demo/svg";
import { logAct, mutate, notifyAdmins, useDemo } from "@/lib/demo/store";
import { closeModal, openModal, toast } from "@/lib/demo/ui";
import { ModalFrame } from "./modal-host";

const fv = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/* ---------- modification d'un bien par son propriétaire ---------- */
const MAJOR = ["title", "q", "surface", "rooms"];
export function EditModal({ ref0 }: { ref0: string }) {
  const S = useDemo();
  const p = S.props.find((x) => x.ref === ref0);
  if (!p) return null;
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget), price = parseInt(fv(f, "price").replace(/\D/g, ""), 10);
    if (!(price > 0)) return toast("Indiquez un prix valide.");
    const next: Record<string, unknown> = { price, cond: fv(f, "cond"), desc: fv(f, "desc"), eq: fv(f, "eq").split(",").map((x) => x.trim()).filter(Boolean), title: fv(f, "title"), q: fv(f, "q"), surface: parseInt(fv(f, "surface"), 10) || 0, rooms: parseInt(fv(f, "rooms"), 10) || 0 };
    const ch = Object.keys(next).filter((k) => JSON.stringify(next[k]) !== JSON.stringify((p as unknown as Record<string, unknown>)[k]));
    if (!ch.length) { closeModal(); return toast("Aucune modification."); }
    const major = ch.filter((k) => MAJOR.includes(k));
    mutate((s) => {
      const q = s.props.find((x) => x.ref === p.ref)!;
      Object.assign(q, next);
      if (major.length && q.validation === "validé") { q.validation = "en attente"; q.created = Date.now(); notifyAdmins(s, `Bien ${q.ref} modifié par le propriétaire (${major.join(", ")}) : nouvelle validation requise.`, "valid"); }
      logAct(s, `Modification du bien ${q.ref} : ${ch.join(", ")}${major.length ? " (renvoyé en validation)" : ""}`);
    });
    closeModal(); toast(major.length ? "Modifications enregistrées. L'annonce est renvoyée en validation (72 h)." : "Modifications enregistrées.");
  };
  return (
    <ModalFrame label={`Modifier ${p.ref}`}>
      <form onSubmit={submit} style={{ padding: 26, display: "grid", gap: 14 }}>
        <div><div className="eyebrow">Modifier mon bien</div><h2 style={{ marginTop: 6 }}>{p.title}</h2><p className="small muted">{p.ref}</p></div>
        <p className="note">Prix, description, équipements et conditions se modifient librement. Le titre, le quartier, la surface et le nombre de pièces renvoient l&apos;annonce en validation (72 h) : elle reste masquée entre-temps. Chaque modification est consignée dans le journal.</p>
        <div className="cols2"><label className="f">Prix (FCFA)<input name="price" inputMode="numeric" defaultValue={p.price} required /></label><label className="f">Conditions<input name="cond" defaultValue={p.cond || ""} maxLength={160} /></label></div>
        <label className="f">Description<textarea name="desc" rows={3} maxLength={600} required defaultValue={p.desc || ""} /></label>
        <label className="f">Équipements (séparés par des virgules)<input name="eq" defaultValue={(p.eq || []).join(", ")} /></label>
        <fieldset className="xfs"><legend>Changements majeurs (nouvelle validation)</legend>
          <label className="f">Titre<input name="title" defaultValue={p.title} maxLength={90} required /></label>
          <div className="cols2"><label className="f">Quartier<select name="q" defaultValue={p.q}>{Object.keys(QUART).map((q) => <option key={q}>{q}</option>)}</select></label><label className="f">Surface (m²)<input name="surface" inputMode="numeric" defaultValue={p.surface || 0} /></label></div>
          <label className="f">Pièces<input name="rooms" inputMode="numeric" defaultValue={p.rooms || 0} /></label></fieldset>
        <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}><button type="button" className="btn ghost" onClick={closeModal}>Annuler</button><button className="btn" type="submit">Enregistrer</button></div>
      </form>
    </ModalFrame>
  );
}

/* ---------- diffusion vers les plateformes ---------- */
export function DiffuseModal({ ref0 }: { ref0: string }) {
  const S = useDemo();
  const p = S.props.find((x) => x.ref === ref0);
  const short = p?.mode === "Saisonnière";
  const [k, setK] = useState<string>(short ? "facebook" : "facebook");
  const [edits, setEdits] = useState<Record<string, string>>({});
  if (!p) return null;
  const st = S.dif[p.ref] ?? {}, pl = PLATS.find((x) => x.k === k) ?? PLATS[0], cur = st[k];
  const txt = edits[k] ?? difText(p, k), lim = k === "instagram" ? 2200 : 0;
  const setStatus = (v: { s: string; t: number } | null) => mutate((s) => { const o = (s.dif[p.ref] = s.dif[p.ref] ?? {}); if (v) o[k] = v; else delete o[k]; });
  const copy = () => copyText(txt).then((ok) => { if (ok) { if (!cur) setStatus({ s: "ready", t: Date.now() }); toast("Texte copié. Collez-le dans " + pl.n + "."); } else toast("Copie impossible : sélectionnez le texte et copiez-le à la main."); });
  const mark = () => { if (cur?.s === "pub") { setStatus({ s: "ready", t: Date.now() }); toast("Statut retiré."); } else { setStatus({ s: "pub", t: Date.now() }); mutate((s) => logAct(s, `Annonce ${p.ref} publiée sur ${pl.n}`)); toast("Annonce marquée comme publiée."); } };
  const ext = (h: string, l: string) => <a className="btn ghost" target="_blank" rel="noopener noreferrer" href={h}>{l}</a>;
  const ical = <button className="btn ghost" onClick={() => { const c = icsFor(S, p); copyText(c.text).then((ok) => toast(ok ? `Calendrier copié (${c.n} période(s) indisponible(s)). En ligne, un lien d'abonnement sera fourni.` : "Copie impossible.")); }}>Copier le calendrier (iCal)</button>;
  const links: Record<string, React.ReactNode> = {
    facebook: <>{ext("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(pUrl(p)), "Partager le lien")}{ext("https://www.facebook.com/marketplace/create/rental", "Marketplace : créer une annonce")}</>,
    whatsapp: <button className="btn ghost" onClick={() => { window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank", "noopener,noreferrer"); if (!st.whatsapp) setStatus({ s: "ready", t: Date.now() }); }}>Ouvrir WhatsApp avec ce message</button>,
    instagram: null, airbnb: <>{ext("https://www.airbnb.com/host/homes", "Ouvrir l'espace hôte Airbnb")}{ical}</>, booking: <>{ext("https://join.booking.com/", "Ouvrir Booking.com partenaires")}{ical}</>,
  };
  return (
    <ModalFrame label={`Diffuser l'annonce ${p.ref}`}>
      <div style={{ padding: 26, display: "grid", gap: 16 }}>
        <div><div className="eyebrow">Diffusion de l&apos;annonce</div><h2 style={{ marginTop: 6 }}>{p.title}</h2><p className="small muted" style={{ marginTop: 6 }}>{p.ref} · {p.q} · {fcfa(p.price)}{unit(p)}</p></div>
        <p className="note">Facebook, Airbnb et Booking.com n&apos;acceptent pas la publication automatique depuis un site tiers sans accord de partenariat. Immo Bell prépare donc une fiche adaptée à chaque plateforme : vous la copiez, vous la publiez depuis votre compte, puis vous la marquez comme publiée pour garder le suivi. Les liens d&apos;annonce de cette démonstration sont des exemples.</p>
        <div className="tabs" role="tablist" aria-label="Plateformes" style={{ margin: 0 }}>
          {PLATS.map((x) => { const dis = "short" in x && x.short && !short, s = st[x.k]; return <button key={x.k} role="tab" onClick={() => setK(x.k)} aria-selected={k === x.k} disabled={dis} title={dis ? "Réservé aux séjours courts" : undefined}>{x.n}{s ? <> <span className={`dd ${s.s}`} aria-hidden="true" /><span className="sr-only">({s.s === "pub" ? "publiée" : "fiche prête"})</span></> : null}</button>; })}
        </div>
        <div className="box" style={{ display: "grid", gap: 12 }}>
          <div className="row between"><b>{pl.n}</b>{cur ? (cur.s === "pub" ? <span className="pill publiée">Publiée le {new Date(cur.t).toLocaleDateString("fr-FR")}</span> : <span className="pill prête">Fiche prête</span>) : <span className="pill à-préparer">À préparer</span>}</div>
          <p className="small muted">{HELP[k]}</p>
          <label className="f">Texte prêt à publier<textarea rows={k === "airbnb" || k === "booking" ? 14 : 11} maxLength={lim || undefined} value={txt} onChange={(e) => setEdits({ ...edits, [k]: e.target.value })} /></label>
          <div className="small muted">{txt.length} caractères{lim ? " sur " + lim : ""}</div>
          <div className="acts"><button className="btn" onClick={copy}>Copier le texte</button>{links[k]}<button className={`btn ${cur?.s === "pub" ? "ghost" : "ok"}`} onClick={mark}>{cur?.s === "pub" ? "Retirer le statut « publiée »" : "Marquer comme publiée"}</button><button className="btn ghost sm" onClick={() => { const e = { ...edits }; delete e[k]; setEdits(e); }}>Rétablir le texte d&apos;origine</button></div>
        </div>
        <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}><span className="small muted">Les modifications du texte restent dans cette fenêtre.</span><button className="btn ghost" onClick={closeModal}>Fermer</button></div>
      </div>
    </ModalFrame>
  );
}

/* ---------- dépôt de photos 360° ---------- */
export function TourUploadModal({ ref0 }: { ref0: string }) {
  const S = useDemo(), router = useRouter();
  const p = S.props.find((x) => x.ref === ref0);
  const [msg, setMsg] = useState("");
  if (!p) return null;
  const up = S.tours[p.ref] ?? [];
  const process = async (files: File[]) => {
    let ok = 0; const bad: string[] = [], added: { id: string; label: string }[] = [];
    for (const f of files) {
      if (up.length + added.length >= 8) { bad.push("8 pièces au maximum"); break; }
      if (!/^image\//.test(f.type)) { bad.push(f.name + " n'est pas une image"); continue; }
      try {
        const bmp = await createImageBitmap(f), ra = bmp.width / bmp.height;
        if (ra < 1.8 || ra > 2.2) { bad.push(f.name + " n'est pas une photo sphérique (format 2:1 attendu)"); continue; }
        const w = Math.min(2560, bmp.width), c = document.createElement("canvas"); c.width = w; c.height = Math.round(w / 2); c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.84)), id = "u" + Date.now().toString(36) + ok;
        if (blob) await IDBX.put(p.ref + "|" + id, blob);
        added.push({ id, label: (f.name.replace(/\.[^.]+$/, "") || "Pièce " + (up.length + added.length + 1)).slice(0, 30) }); ok++;
      } catch { bad.push(f.name + " n'a pas pu être lu"); }
    }
    if (added.length) mutate((s) => { s.tours[p.ref] = [...(s.tours[p.ref] ?? []), ...added]; logAct(s, `Visite 360° du bien ${p.ref} : ${added.length} photo(s) ajoutée(s)`); });
    forgetTourCache(p.ref);
    setMsg((ok ? ok + " photo(s) ajoutée(s). " : "") + (bad.length ? bad.join(" ; ") + "." : ""));
  };
  const del = (i: number) => { const x = up[i]; if (!x) return; IDBX.del(p.ref + "|" + x.id); forgetTourCache(p.ref); mutate((s) => { s.tours[p.ref].splice(i, 1); if (!s.tours[p.ref].length) delete s.tours[p.ref]; }); };
  const rename = (i: number, label: string) => mutate((s) => { if (s.tours[p.ref]?.[i]) s.tours[p.ref][i].label = label.slice(0, 30); });
  return (
    <ModalFrame label={`Visite 360° ${p.ref}`} narrow>
      <div style={{ padding: 26, display: "grid", gap: 14 }}>
        <div><div className="eyebrow">Visite à 360°</div><h2 style={{ marginTop: 6 }}>{p.title}</h2></div>
        <p className="note">Déposez des photos sphériques (format 2:1) prises avec un appareil 360° ou une application panoramique. Chaque photo devient une pièce de la visite. Elles sont réduites automatiquement pour rester légères. En démonstration, elles sont conservées sur cet appareil.</p>
        {up.length ? <div style={{ display: "grid", gap: 8 }}>{up.map((x, i) => <div key={x.id} className="row" style={{ gap: 8, alignItems: "flex-end" }}><label className="f" style={{ flex: 1 }}>Pièce {i + 1}<input defaultValue={x.label} maxLength={40} onBlur={(e) => rename(i, e.target.value)} /></label><button className="btn bad sm" onClick={() => del(i)} aria-label={`Supprimer la pièce ${i + 1}`}>Supprimer</button></div>)}</div> : <p className="small muted">Aucune photo déposée : des panoramas d&apos;exemple générés sont affichés sur la fiche du bien.</p>}
        <label className="f">Ajouter des photos 360°<input type="file" accept="image/*" multiple onChange={(e) => { const fs = [...(e.target.files ?? [])]; e.target.value = ""; if (fs.length) process(fs); }} /></label>
        <p className="small" role="status">{msg}</p>
        <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}><button className="btn ghost" onClick={() => { closeModal(); router.push(`/biens/${p.ref}#s-360`); }}>Voir la visite</button><button className="btn" onClick={closeModal}>Fermer</button></div>
      </div>
    </ModalFrame>
  );
}

export function RepModal({ keyRef }: { keyRef: string }) {
  const S = useDemo();
  return <ReportModal k={keyRef} S={S} onClose={closeModal} />;
}

void openModal;
