"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ROLES } from "@/lib/demo/consts";
import { addUser, loginUser, syncSession, useDemo, type Role } from "@/lib/demo/store";
import { closeModal, openModal, toast, useUI, type ModalState } from "@/lib/demo/ui";
import { BookModal, CompareModal } from "./book-modal";
import { DiffuseModal, EditModal, RepModal, TourUploadModal } from "./extra-modals";

/** Fenêtre modale au gabarit de la maquette (.ov / .modal). */
export function ModalFrame({ label, narrow, onClose = closeModal, children }: { label: string; narrow?: boolean; onClose?: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    document.body.classList.add("lock");
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => { window.removeEventListener("keydown", k); document.body.classList.remove("lock"); prev?.focus?.({ preventScroll: true }); };
  }, [onClose]);
  return (
    <div className="ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className={`modal ${narrow ? "narrow" : ""}`} role="dialog" aria-modal="true" aria-label={label}>
        <button className="x" onClick={onClose} aria-label="Fermer">✕</button>
        {children}
      </div>
    </div>
  );
}

export function ModalHost() {
  const { modal } = useUI();
  if (!modal) return null;
  switch (modal.k) {
    case "auth": return <AuthModal m={modal.m} then={modal.then} />;
    case "book": return <BookModal ref0={modal.ref} a0={modal.a} b0={modal.b} />;
    case "compare": return <CompareModal />;
    case "edit": return <EditModal ref0={modal.ref} />;
    case "dif": return <DiffuseModal ref0={modal.ref} />;
    case "tour": return <TourUploadModal ref0={modal.ref} />;
    case "rep": return <RepModal keyRef={modal.key} />;
    default: return null;
  }
}

const v = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

function AuthModal({ m, then }: { m: "login" | "signup" | "phone" | "forgot"; then?: ModalState }) {
  const S = useDemo(), router = useRouter();
  const [otp, setOtp] = useState(false);
  const done = (u: Parameters<typeof loginUser>[0]) => { loginUser(u); if (then) openModal(then); else closeModal(); toast(`Bienvenue, ${u.name.split(" ")[0]}.`); };
  /** Connexion / inscription auprès de l'API : le serveur décide du rôle, pas le navigateur. */
  const account = async (kind: "login" | "signup", f: FormData) => {
    const body = kind === "login" ? { email: v(f, "email"), password: v(f, "pw") } : { email: v(f, "email"), password: v(f, "pw"), name: v(f, "name"), role: v(f, "role") };
    try {
      const r = await fetch(`/api/v1/auth/${kind === "login" ? "login" : "register"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) { const d = await r.json().catch(() => null); return toast(typeof d?.detail === "string" ? d.detail : "Vérifiez les champs (mot de passe : 8 caractères minimum)."); }
      const u = await r.json() as { name: string; email: string; role: Role };
      const k = S.users.find((x) => x.email === u.email);
      if (k?.status === "suspendu") { fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {}); return toast("Ce compte est suspendu. Contactez Immo Bell."); }
      if (!k) addUser({ ...u, status: "actif" });
      done({ ...(k ?? {}), ...u }); void syncSession();
    } catch { toast("Serveur indisponible. Réessayez dans un instant."); }
  };
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (m === "login" || m === "signup") return account(m, f);
    if (m === "forgot") {
      // Réponse identique que le compte existe ou non (le serveur ne révèle rien).
      fetch("/api/v1/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: v(f, "email") }) }).catch(() => {});
      openModal({ k: "auth", m: "login", then }); return toast("Si un compte existe pour cet e-mail, un lien de réinitialisation vient d'être envoyé.");
    }
    if (!otp) { setOtp(true); return toast("Code envoyé (démonstration : 123456)."); }
    if (v(f, "otp") === "123456") done({ name: "Visiteur mobile", email: "", phone: v(f, "tel"), role: "visitor" }); else toast("Code incorrect.");
  };
  const social = (n: string) => done({ name: "Compte " + n, email: n.toLowerCase() + "@exemple.cm", role: "visitor" });
  const go = (k: "login" | "signup" | "phone" | "forgot") => { setOtp(false); openModal({ k: "auth", m: k, then }); };
  void router; void ROLES;
  return (
    <ModalFrame label="Connexion" narrow>
      <div style={{ padding: 28, display: "grid", gap: 16 }}>
        <h2>{m === "signup" ? "Créer un compte" : m === "forgot" ? "Mot de passe oublié" : "Connexion"}</h2>
        {m !== "forgot" && (
          <div className="tabs" style={{ margin: 0 }}>
            {([["login", "Email"], ["phone", "Téléphone"], ["signup", "Inscription"]] as const).map(([k, l]) => <button key={k} onClick={() => go(k)} aria-selected={m === k}>{l}</button>)}
          </div>
        )}
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          {m === "login" && <>
            <label className="f">Email<input name="email" type="email" required autoComplete="email" /></label>
            <label className="f">Mot de passe<input name="pw" type="password" required minLength={8} autoComplete="current-password" /></label>
            <button className="btn" type="submit">Se connecter</button>
            <button type="button" className="btn ghost sm" onClick={() => go("forgot")}>Mot de passe oublié</button>
          </>}
          {m === "signup" && <>
            <label className="f">Nom complet<input name="name" required /></label>
            <label className="f">Email<input name="email" type="email" required /></label>
            <label className="f">Mot de passe<input name="pw" type="password" required minLength={8} autoComplete="new-password" /></label>
            <label className="f">Je suis<select name="role"><option value="visitor">Client (je cherche un bien)</option><option value="owner">Propriétaire (je publie un bien)</option></select></label>
            <button className="btn" type="submit">Créer mon compte</button>
          </>}
          {m === "phone" && <>
            <label className="f">Numéro de téléphone<input name="tel" inputMode="tel" placeholder="6 XX XX XX XX" required /></label>
            {otp ? <>
              <label className="f">Code OTP reçu par SMS<input name="otp" inputMode="numeric" maxLength={6} required /></label>
              <p className="note">Démonstration : aucun SMS n&apos;est envoyé. Saisissez le code 123456.</p>
              <button className="btn" type="submit">Valider le code</button>
            </> : <button className="btn" type="submit">Recevoir le code</button>}
          </>}
          {m === "forgot" && <>
            <p className="muted small">Saisissez l&apos;email du compte. Un lien de réinitialisation du mot de passe sera envoyé.</p>
            <label className="f">Email<input name="email" type="email" required /></label>
            <button className="btn" type="submit">Envoyer le lien</button>
          </>}
        </form>
        {(m === "login" || m === "phone") && <div className="cols2"><button className="btn ghost sm" onClick={() => social("Google")}>Google</button><button className="btn ghost sm" onClick={() => social("Facebook")}>Facebook</button></div>}
        <p className="note">Mode démonstration : n&apos;importe quel email et mot de passe de 6 caractères fonctionnent.</p>
      </div>
    </ModalFrame>
  );
}
