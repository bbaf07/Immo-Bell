"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { fcfa } from "@/lib/demo/consts";
import { resetFilters, setFilters, setMapSel, toggleIn, useSearch } from "@/lib/demo/filters";
import { Ic } from "@/lib/demo/icons";
import { EQF, FKEYS, MODES, TYPES, filt, filtered, p2sl, sc10, shortP, sl2p } from "@/lib/demo/props";
import { QUART, pinPos } from "@/lib/demo/svg";
import { openModal } from "@/lib/demo/ui";
import { useDemo } from "@/lib/demo/store";
import { CH } from "./common";
import { Card, CompareBar, MapSvg, RCard, SearchForm } from "./property";

function FGroup({ title, k, opts, lab = (x: string) => x }: { title: string; k: "modes" | "types" | "qs" | "dispo" | "eq"; opts: string[]; lab?: (x: string) => string }) {
  const S = useDemo(), { f } = useSearch();
  const base = filt(S, f, k);
  return (
    <fieldset className="fgroup" style={{ border: 0, margin: 0, paddingInline: 0 }}>
      <legend style={{ fontWeight: 700, fontSize: ".92rem", marginBottom: 6, padding: 0 }}>{title}</legend>
      {opts.map((o) => {
        const n = k === "eq" ? base.filter((p) => p.eq.some((x) => x.toLowerCase().includes(o.toLowerCase()))).length : base.filter((p) => p[FKEYS[k as keyof typeof FKEYS]] === o).length;
        const on = f[k].includes(o);
        return <label key={o} className={`fopt ${n || on ? "" : "zero"}`}><input type="checkbox" checked={on} onChange={() => toggleIn(k, o)} /><span>{lab(o)}</span><em>{n}</em></label>;
      })}
    </fieldset>
  );
}

export function BiensView() {
  const S = useDemo(), search = useSearch(), params = useSearchParams();
  const { f } = search, list = filtered(S, f), v = f.view;
  useEffect(() => { if (params.get("compare") && search.cmp.length > 1) openModal({ k: "compare" }); }, [params, search.cmp.length]);
  const active = [...f.qs, ...f.types, ...f.modes, ...f.dispo, ...f.eq].length + (f.max ? 1 : 0) + (f.score ? 1 : 0);
  const scoreOpts: [number, string][] = [[9, "Fabuleux : 9+"], [8, "Très bien : 8+"], [7, "Bien : 7+"]];
  const sel = S.props.find((p) => p.ref === search.mapSel) ?? list[0];
  return (
    <>
      <div style={{ paddingTop: 28 }}><SearchForm compact /></div>
      <div className="layout" style={{ paddingTop: 0 }}>
        <aside className="filters" aria-label="Filtres">
          <button className="mapbtn" onClick={() => setFilters({ view: "map" })} aria-label="Afficher les résultats sur la carte"><MapSvg W={260} H={130} /><span><Ic n="map" className="sm" /> Afficher sur la carte</span></button>
          <div className="row between"><b>Filtrer par</b>{active ? <button className="btn ghost sm" onClick={resetFilters}>Tout effacer ({active})</button> : null}</div>
          <div className="fgroup">
            <label htmlFor="f-max" style={{ fontWeight: 700, fontSize: ".92rem" }}>Votre budget maximum</label>
            <span className="rangev">{f.max ? fcfa(f.max) : "Sans limite"}</span>
            <input id="f-max" type="range" min={0} max={100} value={p2sl(f.max)} onChange={(e) => setFilters({ max: sl2p(+e.target.value) })} aria-valuetext={f.max ? fcfa(f.max) : "Sans limite"} />
            <div className="row between small muted"><span>30 000</span><span>Sans limite</span></div>
          </div>
          <FGroup title="Opération" k="modes" opts={MODES} />
          <FGroup title="Type de bien" k="types" opts={TYPES} />
          <FGroup title="Quartier" k="qs" opts={Object.keys(QUART)} />
          <FGroup title="Disponibilité" k="dispo" opts={["libre", "réservé", "occupé"]} lab={(x) => x[0].toUpperCase() + x.slice(1)} />
          <FGroup title="Équipements" k="eq" opts={EQF} />
          <fieldset className="fgroup" style={{ border: 0, margin: 0, paddingInline: 0 }}>
            <legend style={{ fontWeight: 700, fontSize: ".92rem", marginBottom: 6, padding: 0 }}>Note des locataires</legend>
            {scoreOpts.map(([s, l]) => <label key={s} className="fopt"><input type="radio" name="fscore" checked={f.score === s} onChange={() => setFilters({ score: s })} /><span>{l}</span><em>{filt(S, f, "score").filter((p) => sc10(S, p.ref) >= s).length}</em></label>)}
            <label className="fopt"><input type="radio" name="fscore" checked={!f.score} onChange={() => setFilters({ score: 0 })} /><span>Toutes les notes</span><em /></label>
          </fieldset>
          <div className="fgroup"><label className="f">Pièces minimum<select value={f.rooms} onChange={(e) => setFilters({ rooms: +e.target.value })}>{[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n ? n + " et plus" : "Indifférent"}</option>)}</select></label></div>
        </aside>
        <section aria-label="Résultats">
          <div className="rhead">
            <h1>Douala : {list.length} bien{list.length > 1 ? "s" : ""} trouvé{list.length > 1 ? "s" : ""}</h1>
            <div className="sortbar">
              <label className="sr-only" htmlFor="f-sort">Trier par</label>
              <select id="f-sort" value={f.sort} onChange={(e) => setFilters({ sort: e.target.value })} aria-label="Trier par">
                {[["top", "Nos préférés"], ["pa", "Prix croissant"], ["pd", "Prix décroissant"], ["note", "Meilleure note"], ["new", "Plus récents"]].map(([k, l]) => <option key={k} value={k}>Trier : {l}</option>)}
              </select>
              <div className="seg" role="group" aria-label="Affichage">
                {([["list", "Liste", "list"], ["grid", "Grille", "grid"], ["map", "Carte", "map"]] as const).map(([k, l, i]) => <button key={k} type="button" onClick={() => setFilters({ view: k })} aria-pressed={v === k}><Ic n={i} className="sm" /> {l}</button>)}
              </div>
            </div>
          </div>
          {!list.length ? (
            <div className="empty"><img className="efig" src={CH("ch_conseillere_reflexion")} alt="" aria-hidden="true" /><b>Aucun bien ne correspond à ces critères.</b><p style={{ margin: "8px 0 14px" }}>Élargissez le budget ou retirez un filtre.</p><button className="btn ghost sm" onClick={resetFilters}>Effacer les filtres</button></div>
          ) : v === "map" ? (
            <div className="bigmap">
              <div className="mapstage">
                <MapSvg W={900} H={560} hl={sel?.q} label="Carte de Douala avec les prix des biens" />
                {list.map((p, i) => { const { x, y } = pinPos(p, i); return <button key={p.ref} className={`pin ${p.status}`} style={{ left: `${(x * 100).toFixed(2)}%`, top: `${(y * 100).toFixed(2)}%` }} onClick={() => setMapSel(p.ref)} aria-pressed={sel?.ref === p.ref} aria-label={`${p.title}, ${fcfa(p.price)}`}>{shortP(p.price)}</button>; })}
              </div>
              <div>{sel && <Card p={sel} />}<p className="note" style={{ marginTop: 12 }}>Positions approchées par quartier. L&apos;adresse exacte est communiquée après validation du dossier.</p></div>
            </div>
          ) : v === "grid" ? <div className="grid3">{list.map((p) => <Card key={p.ref} p={p} />)}</div>
            : <div className="rlist">{list.map((p) => <RCard key={p.ref} p={p} />)}</div>}
        </section>
      </div>
      <CompareBar />
    </>
  );
}
