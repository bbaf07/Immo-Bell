"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function Reset() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"form" | "done" | "bad">(token ? "form" : "bad");
  const [error, setError] = useState("");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget), pw = String(f.get("pw")), pw2 = String(f.get("pw2"));
    if (pw !== pw2) return setError("Les deux mots de passe ne sont pas identiques.");
    const r = await fetch("/api/v1/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: pw }) }).catch(() => null);
    if (r?.ok) setState("done"); else if (r?.status === 400) setState("bad"); else setError("Serveur indisponible. Réessayez dans un instant.");
  };
  return (
    <section className="section" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: "1.8rem" }}>Nouveau mot de passe</h1>
      {state === "form" && (
        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <label className="f">Nouveau mot de passe<input name="pw" type="password" required minLength={8} autoComplete="new-password" /></label>
          <label className="f">Confirmer<input name="pw2" type="password" required minLength={8} autoComplete="new-password" /></label>
          {error && <p role="alert" className="small" style={{ color: "var(--bad, #b3261e)" }}>{error}</p>}
          <button className="btn" type="submit">Enregistrer</button>
        </form>
      )}
      {state === "done" && <p style={{ marginTop: 18 }}>Mot de passe modifié. <Link href="/espace">Se connecter</Link></p>}
      {state === "bad" && <p style={{ marginTop: 18 }}>Ce lien est invalide ou expiré. Refaites une demande depuis « Mot de passe oublié ».</p>}
    </section>
  );
}
