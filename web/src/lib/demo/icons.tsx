import seed from "./seed.json";

const ICP = seed.ICP as Record<string, string>;

/** Pictogrammes de la maquette (tracés SVG internes, jamais issus de saisies). */
export function Ic({ n, className = "" }: { n: string; className?: string }) {
  return (
    <svg className={`ico ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICP[n] ?? ICP.check }} />
  );
}

export function BrandMark() {
  return (
    <>
      <svg className="bm" viewBox="236 232 556 430" aria-hidden="true" focusable="false">
        <g fill="currentColor" dangerouslySetInnerHTML={{ __html: seed.LG_ROOF + seed.LG_WIN }} />
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path d={seed.LG_W1} /><path d={seed.LG_W2} /></g>
      </svg>
      <span className="bw" aria-hidden="true">IMMO BELL</span>
    </>
  );
}

export const Bell = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
