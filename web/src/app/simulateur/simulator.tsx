"use client";

import { useState } from "react";
import { fcfa } from "@/lib/demo/consts";

const num = (v: string) => Math.max(0, Math.min(1e11, parseInt(v.replace(/\D/g, ""), 10) || 0));

/** Règle du pôle juridique : loyer + charges ≤ un tiers du revenu net mensuel. */
export function Simulator() {
  const [s, setS] = useState({ rev: 6000000, rent: 150000, deposit: 2, ch: 0 });
  const m = s.rev / 12, cap = m / 3, ok = s.rent + s.ch <= cap, lo = (s.rent + s.ch) * 0.025, hi = (s.rent + s.ch) * 0.045, dep = s.rent * s.deposit, first = dep + s.rent + s.ch;
  const field = (k: keyof typeof s, label: string) => (
    <label className="f">{label}<input inputMode="numeric" value={s[k]} onChange={(e) => setS({ ...s, [k]: num(e.target.value) })} /></label>
  );
  return (
    <div className="sim">
      <div className="panel">
        {field("rev", "Revenus annuels nets (FCFA)")}{field("rent", "Loyer visé (FCFA / mois)")}{field("ch", "Charges mensuelles (FCFA)")}{field("deposit", "Dépôt de garantie (mois de loyer)")}
        <p className="note">Exemple chiffré, à adapter à chaque dossier. Le nombre de mois de dépôt est une hypothèse de calcul. L&apos;analyste juridique fixe le montant retenu.</p>
      </div>
      <div className="panel" aria-live="polite">
        <div className={`verdict ${ok ? "" : "no"}`}>{ok ? "Loyer accepté" : "Loyer refusé"} : {fcfa(s.rent + s.ch)} de loyer et charges pour une capacité de {fcfa(cap)}.</div>
        <div className="kv num">
          <div><span>Revenu net mensuel</span><b>{fcfa(m)}</b></div>
          <div><span>Capacité locative (÷ 3)</span><b>{fcfa(cap)}</b></div>
          <div><span>Assurance loyers impayés (2,5 à 4,5 %)</span><b>{fcfa(lo)} à {fcfa(hi)} / mois</b></div>
          <div><span>Dépôt de garantie ({s.deposit} mois)</span><b>{fcfa(dep)}</b></div>
          <div><span>À prévoir à l&apos;entrée</span><b>{fcfa(first)}</b></div>
        </div>
      </div>
    </div>
  );
}
