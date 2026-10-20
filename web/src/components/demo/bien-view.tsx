"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { STAGES, fcfa, fdate } from "@/lib/demo/consts";
import { DAY, iso, nightsBetween, today } from "@/lib/demo/dates";
import { addReview, toggleFav } from "@/lib/demo/actions";
import { setFilters } from "@/lib/demo/filters";
import { Ic } from "@/lib/demo/icons";
import { ROOMSET, availTxt, cats, deposit, eqIcon, f1, pub, rl, unit } from "@/lib/demo/props";
import { QUART, room } from "@/lib/demo/svg";
import { useDemo, type Prop } from "@/lib/demo/store";
import { openModal, toast } from "@/lib/demo/ui";
import { Card, MapSvg, StatusPill, Svg, Art, Badge } from "./property";
import { TourSection } from "./tour";


export function BienView() {
  const { ref } = useParams<{ ref: string }>();
  const S = useDemo(), router = useRouter();
  const [stars, setStars] = useState(5);
  const [sel, setSel] = useState<{ a: string; b: string }>({ a: "", b: "" });
  const [calOff, setCalOff] = useState(0);
  const p = S.props.find((x) => x.ref === ref && (x.validation === "validé" || x.owner === S.user?.email));
  if (!p) return <section className="section"><div className="empty">Ce bien n&apos;existe pas ou n&apos;est plus publié. <button className="btn ghost sm" onClick={() => router.push("/biens")}>Voir les biens</button></div></section>;

  const rs = S.reviews[p.ref] ?? [], fav = S.favs.includes(p.ref), u = S.user, ct = cats(S, p);
  const sim = pub(S).filter((x) => x.ref !== p.ref && (x.q === p.q || x.type === p.type)).slice(0, 4);
  const mine = u && S.requests.find((r) => r.by === u.email && r.ref === p.ref && r.status === "en attente");
  const [la, lo] = QUART[p.q], set = ROOMSET(p);
  const nights = nightsBetween(sel.a, sel.b);
  const book = () => openModal({ k: "book", ref: p.ref, a: sel.a, b: sel.b });
  const searchQ = (q: string) => { setFilters({ qs: [q], view: "list" }); router.push("/biens"); };
  const hl: [string, string][] = [["pin", `Situé à ${p.q}, Douala`], ["shield", "Dossier étudié par le pôle juridique avant attribution"], ["clock", "Réponse sous 72 h, code de référence pour le suivi"], ["phone", "Service après-vente de 8 h à 18 h, urgences dispatchées sous 24 h"]];
  const priceLabel = p.mode === "Saisonnière" ? "Prix par nuit" : p.mode === "Vente" ? "Prix de vente" : "Loyer mensuel";
  return (
    <>
      <nav className="crumbs" aria-label="Fil d'Ariane">
        <button onClick={() => router.push("/")}>Accueil</button> › <button onClick={() => router.push("/biens")}>Biens</button> › <button onClick={() => searchQ(p.q)}>{p.q}</button> › <span>{p.title}</span>
      </nav>
      <nav className="ptabs" aria-label="Sections de la fiche">
        <a href="#s-apercu">Vue d&apos;ensemble</a><a href="#s-360">Visite 360°</a><a href="#s-tarifs">Infos et tarifs</a><a href="#s-eq">Équipements</a><a href="#s-dispo">Disponibilités</a><a href="#s-cond">Conditions</a><a href="#s-avis">Avis ({rs.length})</a>
      </nav>
      <div className="phead" id="s-apercu">
        <div>
          <div className="tagrow" style={{ marginBottom: 8 }}><StatusPill s={p.status} />{p.pack ? <span className="tag gold">Pack {p.pack}</span> : null}<span className="tag">{p.type}</span><span className="tag">{p.mode}</span><span className="tag">{p.ref}</span></div>
          <h1>{p.title}</h1>
          <div className="loc small" style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}><Ic n="pin" className="sm" /> {p.q}, Douala · <a href={`https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=15/${la}/${lo}`} target="_blank" rel="noopener noreferrer">Voir sur OpenStreetMap</a></div>
        </div>
        <div className="acts">
          <button className="iconbtn" onClick={() => toggleFav(p.ref)} aria-pressed={fav} aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}><Ic n="heart" /></button>
          <button className="iconbtn" onClick={() => { navigator.clipboard?.writeText(location.href).then(() => toast("Lien copié.")); }} aria-label="Copier le lien du bien"><Ic n="share" /></button>
          <a className="iconbtn" href={`/imprimer/bien/${p.ref}`} target="_blank" rel="noreferrer" aria-label="Imprimer la fiche du bien"><Ic n="file" /></a>
          {p.status === "libre" && !mine ? <button className="btn gold" onClick={book}>Réserver</button> : null}
        </div>
      </div>
      <div className="mosaic">
        <figure><Art p={p} /><figcaption>Façade</figcaption></figure>
        {set.map(([k, l], i) => <figure key={i}>{k === "map" ? <MapSvg W={400} H={266} hl={p.q} label="Situation" /> : <Svg html={room(k)} />}<figcaption>{l}</figcaption></figure>)}
      </div>
      <p className="small muted">Illustrations en attendant les photos réelles, validées par l&apos;administrateur avant publication.</p>
      <TourSection p={p} />
      <div className="pgrid">
        <div>
          <div className="psec" style={{ borderTop: 0, paddingTop: 8 }}>
            <p style={{ fontSize: "1.02rem" }}>{p.desc}</p>
            <div className="dl" style={{ marginTop: 16 }}><div><span>Surface</span><b>{p.surface} m²</b></div><div><span>Pièces</span><b>{rl(p)}</b></div><div><span>Opération</span><b>{p.mode}</b></div><div><span>Disponibilité</span><b>{availTxt(p)}</b></div></div>
          </div>
          <div className="psec" id="s-tarifs"><h2>Infos et tarifs</h2><Tarifs p={p} />
            {p.mode !== "Vente" && p.mode !== "Saisonnière" && <p className="note" style={{ marginTop: 12 }}>Revenu net conseillé : au moins {fcfa(p.price * 3)} par mois (règle du tiers). <button className="btn ghost sm" onClick={() => router.push("/simulateur")}>Simuler mon budget</button></p>}
          </div>
          <div className="psec" id="s-eq"><h2>Équipements</h2><div className="eqgrid">{p.eq.map((e) => <div key={e}><Ic n={eqIcon(e)} />{e}</div>)}</div></div>
          <div className="psec" id="s-dispo"><h2>Disponibilités</h2>
            {p.mode === "Saisonnière" ? <Calendar p={p} sel={sel} setSel={setSel} off={calOff} setOff={setCalOff} /> : (
              <div className="box"><div className="row" style={{ gap: 10 }}><StatusPill s={p.status} /><b>{availTxt(p)}</b></div>
                <p className="small muted">{p.status === "libre" ? "Indiquez votre date d'entrée souhaitée lors de la réservation. La visite et l'état des lieux sont planifiés après validation du dossier." : "Ajoutez ce bien à vos favoris : vous serez prévenu s'il se libère."}</p></div>
            )}
          </div>
          <div className="psec" id="s-cond"><h2>Conditions du bailleur</h2><p>{p.cond}</p>
            <div className="hl" style={{ marginTop: 12 }}>{["Visite et état des lieux contradictoire avant signature", "Lettre d'engagement et déclaration sur l'honneur", "Les échanges passent par Immo Bell, jamais en direct"].map((x) => <div key={x}><Ic n="check" />{x}</div>)}</div>
            <p className="small" style={{ marginTop: 12 }}><button className="btn ghost sm" onClick={() => router.push("/juridique")}>Voir les pièces demandées</button></p></div>
          <div className="psec" id="s-avis"><h2>Avis des locataires</h2>
            {rs.length ? (
              <>
                <div className="row" style={{ gap: 14, marginBottom: 18 }}><Badge p={p} cls="big left" /></div>
                <div className="cats">{ct.map(([c, v]) => <div key={c} className={`cbar ${v >= 9 ? "hi" : ""}`}><div><span>{c}</span><span>{f1(v)}</span></div><div className="tr"><i style={{ width: `${v * 10}%` }} /></div></div>)}</div>
                <div className="revs">
                  {rs.map((r, i) => (
                    <div key={i} className="rev2"><div className="rwho"><span className="av">{r.who[0]}</span><div><b>{r.who}</b><div className="small muted">{fdate(r.t)}</div></div><span className="sb" style={{ marginLeft: "auto", minWidth: 32, height: 32, fontSize: ".85rem" }}>{r.stars * 2}</span></div>
                      <p className="small">« {r.text} »</p>
                      {!r.removed && <button className="linkb small" onClick={() => openModal({ k: "rep", key: `${p.ref}:${i}` })}>Signaler ce commentaire</button>}
                      {S.replies[`${p.ref}:${i}`] ? <div className="reply"><b>Réponse du propriétaire :</b> {S.replies[`${p.ref}:${i}`]}</div> : null}</div>
                  ))}
                </div>
              </>
            ) : <div className="empty">Pas encore d&apos;avis sur ce bien.</div>}
            {u ? (
              <form className="box" style={{ marginTop: 18 }} onSubmit={(e) => { e.preventDefault(); const t = new FormData(e.currentTarget).get("text"); addReview(p.ref, stars, String(t)); e.currentTarget.reset(); toast("Avis publié."); }}>
                <b>Donner mon avis</b>
                <div className="starpick" role="radiogroup" aria-label="Note">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" onClick={() => setStars(i)} className={i <= stars ? "on" : ""} aria-label={`${i} étoile${i > 1 ? "s" : ""}`}>★</button>)}</div>
                <textarea name="text" required placeholder="Votre expérience après visite ou location" />
                <button className="btn ghost sm" type="submit" style={{ justifySelf: "start" }}>Publier mon avis</button>
              </form>
            ) : <p className="small muted" style={{ marginTop: 12 }}><a href="#" onClick={(e) => { e.preventDefault(); openModal({ k: "auth", m: "login" }); }}>Connectez-vous</a> pour noter ce bien.</p>}
          </div>
          {sim.length ? <div className="psec"><h2>Biens similaires</h2><div className="grid3">{sim.map((x) => <Card key={x.ref} p={x} />)}</div></div> : null}
        </div>
        <aside className="side" aria-label="Réservation">
          <div className="box goldb">
            <div className="row between"><div><div className="small muted">{priceLabel}</div><div className="price num">{fcfa(p.price)}</div></div><Badge p={p} /></div>
            {p.status !== "libre" ? (
              <>
                <div className="verdict no" style={p.status === "réservé" ? { background: "var(--warn-bg)", color: "var(--warn-t)", borderColor: "var(--warn)" } : undefined}>{availTxt(p)}.</div>
                <button className="btn ghost" onClick={() => toggleFav(p.ref)}>{fav ? "Retirer des favoris" : "Me prévenir s'il se libère"}</button>
              </>
            ) : mine ? (
              <><div className="verdict">Demande <b>{mine.code}</b> en cours : {STAGES[mine.stage || 0].toLowerCase()}.</div><button className="btn ghost" onClick={() => router.push("/espace")}>Suivre ma demande</button></>
            ) : (
              <>
                {p.mode === "Saisonnière" && sel.a ? <div className="small"><b>{fdate(sel.a)}</b> → <b>{sel.b ? fdate(sel.b) : "choisir le départ"}</b>{sel.b ? <> · {nights} nuit{nights > 1 ? "s" : ""} = <b>{fcfa(nights * p.price)}</b></> : null}</div> : null}
                <button className="btn gold" onClick={book} style={{ width: "100%", minHeight: 48 }}>Réserver ce bien</button>
                <p className="small muted">Aucun paiement en ligne. Un code de référence est créé et votre dossier est étudié sous 72 h.</p>
              </>
            )}
          </div>
          <div className="box">
            {rs.length ? <><b>Les locataires apprécient</b>{ct.slice().sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c, v]) => <div key={c} className="row between small"><span>{c}</span><span className="sb" style={{ minWidth: 30, height: 28, fontSize: ".8rem" }}>{f1(v)}</span></div>)}</>
              : <><b>Nouveau sur Immo Bell</b><p className="small muted">Soyez le premier à donner votre avis après visite.</p></>}
          </div>
          <div className="box"><b>Points forts</b><div className="hl">{hl.map(([i, t]) => <div key={t}><Ic n={i} /><span>{t}</span></div>)}</div></div>
          <button className="mapbtn" onClick={() => searchQ(p.q)} aria-label={`Voir ${p.q} sur la carte des biens`}><MapSvg W={340} H={170} hl={p.q} /><span><Ic n="map" className="sm" /> Afficher sur la carte</span></button>
        </aside>
      </div>
      {p.status === "libre" && !mine ? <div className="mobbar"><div><div className="price num">{fcfa(p.price)}</div><div className="small muted">{unit(p).trim() || "Prix de vente"}</div></div><button className="btn gold" onClick={book}>Réserver</button></div> : null}
    </>
  );
}

function Tarifs({ p }: { p: Prop }) {
  const d = deposit(p);
  if (p.mode === "Vente") return <div className="tarifs"><div><span>Prix de vente</span><b>{fcfa(p.price)}</b></div><div><span>Contrôle des documents de propriété</span><span>Pôle juridique</span></div><div><span>Total affiché</span><b>{fcfa(p.price)}</b></div></div>;
  if (p.mode === "Saisonnière") return <div className="tarifs"><div><span>Prix par nuit</span><b>{fcfa(p.price)}</b></div><div><span>Ménage au standard hôtelier</span><span>Inclus</span></div><div><span>Caution</span><span>Demandée à l&apos;arrivée</span></div><div><span>Exemple : 3 nuits</span><b>{fcfa(p.price * 3)}</b></div></div>;
  return <div className="tarifs"><div><span>Loyer mensuel</span><b>{fcfa(p.price)}</b></div><div><span>Dépôt de garantie ({d} mois)</span><b>{fcfa(p.price * d)}</b></div><div><span>Assurance loyers impayés conseillée (2,5 à 4,5 %)</span><span>{fcfa(p.price * 0.025)} à {fcfa(p.price * 0.045)} / mois</span></div><div><span>À prévoir à l&apos;entrée (dépôt et 1er loyer)</span><b>{fcfa(p.price * (d + 1))}</b></div></div>;
}

/** Calendrier de séjour : deux mois, arrivée puis départ. */
function Calendar({ p, sel, setSel, off, setOff }: { p: Prop; sel: { a: string; b: string }; setSel: (s: { a: string; b: string }) => void; off: number; setOff: (n: number) => void }) {
  const S = useDemo();
  const booked = new Set([...(S.cal[p.ref] ?? []), ...(S.blocks[p.ref] ?? [])]);
  const T = today();
  const months = [0, 1].map((k) => { const d = new Date(T); d.setDate(1); d.setMonth(d.getMonth() + k + off); return d; });
  const { a, b } = sel;
  const pick = (k: string) => {
    if (!a || (a && b)) return setSel({ a: k, b: "" });
    if (k <= a) return setSel({ a: k, b: "" });
    for (let d = new Date(a).getTime(); iso(d) < k; d += DAY) if (booked.has(iso(d))) { toast("Certaines nuits sont déjà réservées. Choisissez d'autres dates."); return setSel({ a: k, b: "" }); }
    setSel({ a, b: k });
  };
  return (
    <>
      <div className="row between" style={{ marginBottom: 10 }}>
        <button className="btn ghost sm" onClick={() => setOff(off - 1)} disabled={off <= 0} aria-label="Mois précédents"><Ic n="left" className="sm" /></button>
        <b className="small">Choisissez l&apos;arrivée puis le départ</b>
        <button className="btn ghost sm" onClick={() => setOff(off + 1)} aria-label="Mois suivants"><Ic n="right" className="sm" /></button>
      </div>
      <div className="calw">
        {months.map((m) => {
          const y = m.getFullYear(), mo = m.getMonth(), first = (new Date(y, mo, 1).getDay() + 6) % 7, n = new Date(y, mo + 1, 0).getDate();
          return (
            <div key={mo + "-" + y} className="cal"><h3>{m.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h3>
              <div className="g">
                {["L", "M", "M", "J", "V", "S", "D"].map((x, i) => <span key={i}>{x}</span>)}
                {Array.from({ length: first }, (_, i) => <i key={"e" + i} />)}
                {Array.from({ length: n }, (_, i) => {
                  const d = i + 1, t = new Date(y, mo, d).getTime(), k = iso(t), past = t < T, bk = booked.has(k), edge = k === a || k === b, inr = !!(a && b && k > a && k < b);
                  return <button key={d} type="button" onClick={() => pick(k)} className={`${bk ? "bk" : ""} ${edge ? "edge" : ""} ${inr ? "in" : ""}`} disabled={past || bk} aria-label={`${d} ${m.toLocaleDateString("fr-FR", { month: "long" })}${bk ? ", déjà réservé" : ""}`} aria-pressed={edge}>{d}</button>;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="legend"><span><i style={{ background: "var(--ink)" }} />Votre séjour</span><span><i style={{ background: "var(--bad-bg)" }} />Déjà réservé</span><span><i style={{ background: "color-mix(in srgb,var(--gold) 30%,transparent)" }} />Nuits sélectionnées</span></div>
    </>
  );
}
