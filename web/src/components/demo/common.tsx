"use client";

import type { ReactNode } from "react";
import seed from "@/lib/demo/seed.json";
import { STAGES, fdt, hoursLeft } from "@/lib/demo/consts";
import type { Req } from "@/lib/demo/store";

/* Briques communes au gabarit de la maquette (mêmes classes CSS). */

export const CH = (n: string) => `/chars/${n}.webp`;
const XIC = seed.XIC as Record<string, string>;
export function Xic({ k, s = 26 }: { k: string; s?: number }) {
  return (
    <svg className="xic" viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: XIC[k] ?? "" }} />
  );
}

const pillKey = (s: string) => s.replace(" ", "-");
export const Pill = ({ s, k }: { s: string; k?: string }) => <span className={`pill ${k ?? pillKey(s)}`}>{s}</span>;

const RST: Record<string, [string, string]> = { "en attente": ["En cours d'analyse", "en-attente"], "validée": ["Dossier accepté", "validée"], "refusée": ["Dossier rejeté", "refusée"], "annulée": ["Demande annulée", "annulée"] };
export const RPill = ({ s }: { s: string }) => { const m = RST[s] ?? [s, pillKey(s)]; return <span className={`pill ${m[1]}`}>{m[0]}</span>; };

export const Tabs = <T extends string>({ tabs, value, onChange, label }: { tabs: readonly (readonly [T, string, number?, (number | boolean)?])[]; value: T; onChange: (k: T) => void; label?: string }) => (
  <div className="tabs" role="tablist" aria-label={label}>
    {tabs.map(([k, l, n, alert]) => (
      <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}>
        {l}{n ? <span className={`n ${alert ? "alert" : ""}`}> {n}</span> : null}
      </button>
    ))}
  </div>
);

export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;
export const Note = ({ children }: { children: ReactNode }) => <p className="note">{children}</p>;

export function Table({ head, rows, empty }: { head: ReactNode[]; rows: ReactNode[][]; empty: string }) {
  if (!rows.length) return <div className="empty">{empty}</div>;
  return (
    <div className="tw"><table>
      <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table></div>
  );
}

export const Due = ({ t }: { t: number }) => {
  const left = hoursLeft(t);
  return <span className={`due ${left < 24 ? "late" : ""}`}>{left > 0 ? `${left} h restantes` : "Délai dépassé"}</span>;
};

export function Track({ k }: { k: number }) {
  return (
    <div className="track" role="list" aria-label="Avancement">
      {STAGES.map((s, i) => {
        const dn = i < k || k >= STAGES.length - 1;
        return <div key={s} role="listitem" className={dn ? "done" : i === k ? "cur" : ""} aria-current={i === k ? "step" : undefined}><i>{dn ? "✓" : ""}</i>{s}</div>;
      })}
    </div>
  );
}

export function StatusBanner({ r }: { r: Req }) {
  if (r.status === "en attente") return <div className="verdict dec wait"><b>En cours d&apos;analyse</b><span>Le pôle juridique étudie votre dossier, réponse sous 72 h.</span></div>;
  if (r.status === "validée") return <div className="verdict dec"><b>Dossier accepté</b>{r.decided && <span className="small">Décision du {fdt(r.decided.t)}</span>}<span>Suivez les étapes de votre emménagement ci-dessous.</span></div>;
  if (r.status === "refusée") return <div className="verdict dec no" role="alert"><b>Dossier rejeté</b>{r.decided && <span className="small">Décision du {fdt(r.decided.t)}</span>}<span><em>Motif :</em> {r.reason || "Non précisé"}</span>{r.reasonNote && <span className="small">{r.reasonNote}</span>}</div>;
  if (r.status === "annulée") return <div className="verdict dec no" role="alert"><b>Réservation annulée par le propriétaire</b>{r.cancel && <><span className="small">Le {fdt(r.cancel.t)}</span><span><em>Motif :</em> {r.cancel.why}</span></>}<span className="small">Vous pouvez déclarer un litige depuis l&apos;onglet « Litiges ».</span></div>;
  return null;
}

export const Kpi = ({ label, value, hint, onClick, color }: { label: string; value: ReactNode; hint?: string; onClick?: () => void; color?: string }) => {
  const body = <><span>{label}</span><b>{value}</b>{hint && <small>{hint}</small>}</>;
  const style = color ? ({ "--c": color } as React.CSSProperties) : undefined;
  return onClick ? <button className="kpi" onClick={onClick} style={style}>{body}</button> : <div className="kpi" style={style}>{body}</div>;
};

export const Code = ({ children }: { children: ReactNode }) => <code className="ref">{children}</code>;
export const Figs = ({ names }: { names: string[] }) => (
  <div className="phfigs">{names.map((n) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={n} src={CH(n)} alt="" aria-hidden="true" />)}</div>
);
