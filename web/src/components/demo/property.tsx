"use client";

import { useRouter } from "next/navigation";
import { fcfa } from "@/lib/demo/consts";
import { toggleFav } from "@/lib/demo/actions";
import { clearCmp, toggleCmp, useSearch, setFilters, searchFor } from "@/lib/demo/filters";
import { Ic } from "@/lib/demo/icons";
import { MODES, TYPES, availTxt, deposit, f1, nrev, rl, sc10, scLabel, unit } from "@/lib/demo/props";
import { QUART, art, mapBase } from "@/lib/demo/svg";
import { useDemo, type Prop } from "@/lib/demo/store";
import { toast } from "@/lib/demo/ui";

export const Svg = ({ html, className }: { html: string; className?: string }) => <div className={className} style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
/** Illustration d'un bien : SVG construit à partir du type et d'un nombre technique uniquement. */
export const Art = ({ p }: { p: Prop }) => <Svg html={art(p)} />;
export const MapSvg = ({ W, H, hl, label }: { W: number; H: number; hl?: string; label?: string }) => (
  <svg viewBox={`0 0 ${W} ${H}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} dangerouslySetInnerHTML={{ __html: mapBase(W, H, hl) }} />
);

export const StatusPill = ({ s }: { s: string }) => <span className={`pill ${s.replace(" ", "-")}`}>{s}</span>;
export const Tag360 = () => <span className="b360" title="Visite à 360°">360°</span>;

export function Badge({ p, cls = "" }: { p: Prop; cls?: string }) {
  const S = useDemo();
  const n = nrev(S, p.ref);
  if (!n) return <div className={`score new ${cls}`}><div><b>Nouveau</b><span>Pas encore d&apos;avis</span></div></div>;
  const s = sc10(S, p.ref);
  return <div className={`score ${cls}`}><div><b>{scLabel(s)}</b><span>{n} avis</span></div><span className="sb" aria-label={`Note ${f1(s)} sur 10`}>{f1(s)}</span></div>;
}

function useCardActions(p: Prop) {
  const S = useDemo(), search = useSearch(), router = useRouter();
  const fav = S.favs.includes(p.ref);
  return {
    S, fav, router, cmp: search.cmp.includes(p.ref),
    open: () => router.push(`/biens/${p.ref}`),
    toggleFavorite: () => toggleFav(p.ref),
    toggleCompare: () => { if (!search.cmp.includes(p.ref) && search.cmp.length >= 3) return toast("Trois biens au maximum."); toggleCmp(p.ref); },
  };
}

const keyOpen = (open: () => void) => ({ onClick: open, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } } });

/** Carte compacte (accueil, grille, carte, favoris). */
export function Card({ p }: { p: Prop }) {
  const { fav, cmp, open, toggleFavorite, toggleCompare } = useCardActions(p);
  return (
    <article className="card">
      <div className="art" tabIndex={0} role="button" aria-label={`Voir le bien : ${p.title}`} {...keyOpen(open)}>
        <Art p={p} /><StatusPill s={p.status} /><span className="ref">{p.ref}</span><Tag360 />
      </div>
      <div className="body">
        <div className="eyebrow">{p.type} · {p.mode} · {p.q}</div>
        <h3 onClick={open} style={{ cursor: "pointer" }}>{p.title}</h3>
        <Badge p={p} cls="left" />
        <div className="price num">{fcfa(p.price)}<small>{unit(p)}</small></div>
        <div className="specs"><span>{rl(p)}</span><span>{p.surface} m²</span></div>
        <div className="row between" style={{ marginTop: 6 }}>
          <label className="row small" style={{ gap: 6 }}><input type="checkbox" style={{ width: "auto" }} checked={cmp} onChange={toggleCompare} /> Comparer</label>
          <button className="fav" onClick={toggleFavorite} aria-pressed={fav} aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}>{fav ? "♥" : "♡"}</button>
        </div>
      </div>
    </article>
  );
}

/** Ligne de résultat (vue liste). */
export function RCard({ p }: { p: Prop }) {
  const { fav, cmp, open, toggleFavorite, toggleCompare, router } = useCardActions(p);
  const d = deposit(p);
  return (
    <article className="rcard">
      <div className="ph" tabIndex={0} role="button" aria-label={`Voir le bien : ${p.title}`} {...keyOpen(open)}>
        <Art p={p} /><StatusPill s={p.status} /><Tag360 />
        <button className="fav" onClick={(e) => { e.stopPropagation(); toggleFavorite(); }} aria-pressed={fav} aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}>{fav ? "♥" : "♡"}</button>
      </div>
      <div className="mid">
        <h3 onClick={open} style={{ cursor: "pointer" }}>{p.title}</h3>
        <div className="loc"><Ic n="pin" className="sm" /><span>{p.q}, Douala</span>
          <button onClick={() => { setFilters({ view: "map", qs: [p.q] }); router.push("/biens"); }}>Afficher sur la carte</button><span className="muted">· {p.ref}</span></div>
        <div className="tagrow">{p.pack ? <span className="tag gold">Pack {p.pack}</span> : null}<span className="tag">{p.type}</span><span className="tag">{p.mode}</span></div>
        <div className="small"><b>{rl(p)}</b> · {p.surface} m² · {p.eq.slice(0, 3).join(" · ")}</div>
        {p.status === "libre"
          ? <div className="ok"><Ic n="shield" className="sm" /> Dossier étudié par le pôle juridique · réponse sous 72 h</div>
          : <div className="small" style={{ color: "var(--bad-t)", fontWeight: 700 }}>{availTxt(p)}</div>}
        <label className="row small" style={{ gap: 6, marginTop: "auto" }}><input type="checkbox" style={{ width: "auto" }} checked={cmp} onChange={toggleCompare} /> Comparer</label>
      </div>
      <div className="right">
        <Badge p={p} />
        <div><div className="small">{p.mode === "Saisonnière" ? "Prix par nuit" : p.mode === "Vente" ? "Prix de vente" : "Loyer mensuel"}</div><div className="price num">{fcfa(p.price)}</div>{d ? <div className="small">Dépôt : {d} mois</div> : null}</div>
        <button className="btn gold" onClick={open}>Voir le bien <Ic n="right" className="sm" /></button>
      </div>
    </article>
  );
}

export function CompareBar() {
  const { cmp } = useSearch();
  const router = useRouter();
  if (!cmp.length) return null;
  return (
    <div className="cmpbar"><span>{cmp.length} bien{cmp.length > 1 ? "s" : ""} sélectionné{cmp.length > 1 ? "s" : ""}</span>
      <button className="btn sm" disabled={cmp.length < 2} onClick={() => router.push("/biens?compare=1")}>Comparer</button>
      <button className="btn sm" onClick={clearCmp}>Vider</button></div>
  );
}

function Options({ list, all }: { list: string[]; all: string }) {
  return <><option value="">{all}</option>{list.map((x) => <option key={x} value={x}>{x}</option>)}</>;
}

/** Barre de recherche de l'accueil et de la page Biens. */
export function SearchForm({ compact }: { compact?: boolean }) {
  const router = useRouter(), { f } = useSearch();
  return (
    <form className={`bsearch ${compact ? "compact" : ""}`} role="search" key={JSON.stringify([f.qs, f.modes, f.types, f.date, f.max])}
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget), v = (k: string) => String(d.get(k) ?? "");
        searchFor({ qs: v("q") ? [v("q")] : [], modes: v("m") ? [v("m")] : [], types: v("t") ? [v("t")] : [], date: v("d"), max: +v("x").replace(/\D/g, "").slice(0, 12) || 0 });
        router.push("/biens");
      }}>
      <label>Où ?<select name="q" defaultValue={f.qs[0] ?? ""}><Options list={Object.keys(QUART)} all="Tout Douala" /></select></label>
      <label>Je veux<select name="m" defaultValue={f.modes[0] ?? ""}><Options list={MODES} all="Louer ou acheter" /></select></label>
      <label>Type de bien<select name="t" defaultValue={f.types[0] ?? ""}><Options list={TYPES} all="Tous les types" /></select></label>
      <label>Arrivée ou entrée<input name="d" type="date" defaultValue={f.date} /></label>
      <label>Budget max (FCFA)<input name="x" inputMode="numeric" placeholder="Sans limite" defaultValue={f.max ? f.max : ""} /></label>
      <button type="submit">Rechercher</button>
    </form>
  );
}
