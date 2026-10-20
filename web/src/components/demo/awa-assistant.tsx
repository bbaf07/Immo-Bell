"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { acOffline, acSearch, type Ctx } from "@/lib/demo/awa-brain";
import { fcfa } from "@/lib/demo/consts";
import { useSearch } from "@/lib/demo/filters";
import { Ic } from "@/lib/demo/icons";
import { L, trText } from "@/lib/demo/i18n";
import { byRef, filtered } from "@/lib/demo/props";
import { useDemo } from "@/lib/demo/store";
import { openModal, useUI } from "@/lib/demo/ui";
import { CH } from "./common";

/** Ouvre la fenêtre de chat d'Awa depuis n'importe quel bouton du site. */
export const openChat = () => window.dispatchEvent(new Event("ib-chat"));

type Msg = { role: "user" | "assistant"; content: string; greet?: boolean; err?: boolean };
const unit = (m: string) => (m === "Saisonnière" ? "/ nuit" : m === "Vente" ? "" : "/ mois");

/** Conseillère flottante (bulle de conseils contextuels) et fenêtre de chat. */
export function Awa() {
  const S = useDemo(), path = usePathname(), ui = useUI(), search = useSearch();
  const [tip, setTip] = useState(0), [min, setMin] = useState(false), [hide, setHide] = useState(false), [chat, setChat] = useState(false);
  const lang = ui.lang;
  const view = path === "/" ? "home" : path.startsWith("/biens/") ? "bien" : path.slice(1);
  const ref = path.startsWith("/biens/") ? path.split("/")[2] : undefined;
  useEffect(() => { try { setMin(localStorage.getItem("immobell_guide") === "min"); } catch { /* préférence indisponible */ } }, []);
  useEffect(() => { const f = () => setChat(true); window.addEventListener("ib-chat", f); return () => window.removeEventListener("ib-chat", f); }, []);
  const u = S.user, p = ref ? byRef(S, ref) : undefined;
  const step = ui.modal?.k === "book" ? 1 : 0;
  const tips: string[] = (() => {
    if (step) return ["Choisissez vos dates. Pour un séjour court, les nuits déjà réservées sont exclues."];
    if (view === "home") return ["Bonjour ! Je suis votre conseillère Immo Bell. Cherchez un bien par quartier, type ou budget.", "Chaque dossier est étudié par notre pôle juridique sous 72 h.", "Vous êtes propriétaire ? Confiez-nous votre bien avec l'un de nos packs."];
    if (view === "biens") { const n = filtered(S, search.f).length; return n ? [`J'ai trouvé ${n} bien${n > 1 ? "s" : ""} pour vous. Affinez avec les filtres ou affichez la carte.`, "Cochez « Comparer » sur deux ou trois biens pour les voir côte à côte.", "Les biens en vert sont libres. Les rouges sont déjà occupés."] : ["Aucun bien ne correspond. Essayez un budget plus large ou retirez un filtre."]; }
    if (view === "bien") return !p ? ["Ce bien n'est plus disponible."] : p.status === "libre" ? [p.mode === "Saisonnière" ? "Choisissez vos nuits dans le calendrier, puis réservez." : "Ce bien est libre. Réservez : votre dossier sera étudié sous 72 h.", `Revenu conseillé pour ce bien : ${fcfa(p.price * 3)} par mois.`, "Ajoutez-le à vos favoris pour le retrouver dans votre espace."] : ["Ce bien n'est pas libre pour le moment. Ajoutez-le en favori : vous serez prévenu."];
    if (view === "services") return ["Nos packs vont de la simple gestion des loyers à la formule Diaspora avec rapport vidéo.", "Une urgence (fuite, panne) ? Signalez-la : un prestataire intervient sous 24 h."];
    if (view === "juridique") return ["Voici les pièces demandées selon votre situation : CDI, CDD, étudiant…", "Le pôle juridique sécurise chaque bail, pour le bailleur comme pour le locataire."];
    if (view === "simulateur") return ["La règle est simple : loyer et charges au plus égaux au tiers de votre revenu net."];
    if (view === "espace") {
      if (!u) return ["Choisissez un profil pour découvrir chaque espace de la démonstration."];
      if (u.role === "visitor") { const miss = Object.values(S.docs[u.email] ?? {}).filter((x) => x === "manquant").length; return [miss ? `Il vous manque ${miss} pièce${miss > 1 ? "s" : ""}. Déposez-la dans « Mes documents ».` : "Votre dossier est complet. Suivez l'avancement dans « Mes réservations ».", "Une question ? Écrivez-moi dans « Messages »."]; }
      if (u.role === "owner") return ["Votre calendrier montre l'occupation de tous vos biens.", "Répondez aux avis : votre réponse s'affiche sur la fiche du bien."];
      if (u.role === "legal") { const n = S.requests.filter((r) => r.status === "en attente").length; return [`${n} dossier${n > 1 ? "s" : ""} attend${n > 1 ? "ent" : ""} votre étude. Commencez par le plus ancien.`]; }
      if (u.role === "provider") return ["Passez l'intervention « en route » : le client est prévenu automatiquement."];
      return ["Les compteurs rouges signalent les délais de 72 h qui approchent."];
    }
    return ["Je reste là si vous avez besoin d'aide."];
  })();
  const key = view + "|" + step + "|" + (u?.role ?? "");
  useEffect(() => { setTip(0); setHide(false); const t = setTimeout(() => setHide(true), window.innerWidth <= 640 ? 6500 : 10000); return () => clearTimeout(t); }, [key]);
  const cur = tips[tip % tips.length];
  const pose = view === "biens" && !filtered(S, search.f).length ? "ch_conseillere_reflexion" : (view === "home" && tip % 3 === 0) || (view === "espace" && !u) || tip % 3 === 2 ? "ch_conseillere_salut" : "ch_conseillere";
  const [narrow, setNarrow] = useState(false);
  useEffect(() => { const f = () => setNarrow(window.innerWidth <= 900); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const lift = (view === "bien" && narrow) || (!!search.cmp.length && view === "biens");
  const tx = (s: string) => trText(s, lang);
  return (
    <>
      <div id="guide" className={lift ? "lift" : ""}>
        {min ? (
          <button className="g-mini" onClick={() => { setMin(false); try { localStorage.setItem("immobell_guide", "open"); } catch { /* ignoré */ } }} aria-label="Afficher la conseillère Immo Bell"><img src={CH("ch_conseillere")} alt="" /></button>
        ) : (
          <>
            <div className={`g-bub ${hide ? "hide" : ""}`} role="status" aria-live="polite"><b>{tx("Votre conseillère")}</b>{tx(cur)}
              {tips.length > 1 && <><br /><button className="g-act" onClick={() => { setTip(tip + 1); setHide(false); }}>{tx("Autre conseil")} ({tip % tips.length + 1}/{tips.length})</button></>}<br />
              <button className="g-chat" onClick={() => setChat(true)}><Ic n="spark" />{tx("Discuter avec Awa")}</button>
              <button className="g-x" onClick={() => { setMin(true); try { localStorage.setItem("immobell_guide", "min"); } catch { /* ignoré */ } }} aria-label="Réduire la conseillère">✕</button></div>
            <button className="g-fig" onClick={() => { setTip(tip + 1); setHide(false); }} aria-label="Conseillère Immo Bell : afficher un autre conseil"><img src={CH(pose)} alt="" /></button>
          </>
        )}
      </div>
      {chat && <AwaChat onClose={() => setChat(false)} />}
    </>
  );
}

/** Texte d'Awa avec **gras**, listes et références [[IB-XXX-000]] cliquables. */
function Rich({ text, open }: { text: string; open: (ref: string) => void }) {
  const S = useDemo(), lang = useUI().lang;
  const inline = (s: string, k: string): ReactNode[] => {
    const parts = s.split(/(\*\*.+?\*\*|\[\[IB-[A-Z]{3}-\d{3}\]\])/g);
    return parts.map((x, i) => {
      if (/^\*\*.+\*\*$/.test(x)) return <b key={k + i}>{x.slice(2, -2)}</b>;
      const m = /^\[\[(IB-[A-Z]{3}-\d{3})\]\]$/.exec(x);
      if (m) {
        const p = byRef(S, m[1]); if (!p) return m[1];
        const dot = p.status === "libre" ? "ok" : p.status === "réservé" ? "warn" : "bad";
        return <button key={k + i} className="ac-ref" onClick={() => open(m[1])}><i className={dot} />{trText(p.title, lang)}<em>{fcfa(p.price)}{unit(p.mode) ? " " + trText(unit(p.mode), lang) : ""}</em></button>;
      }
      return x;
    });
  };
  const lines = text.split("\n"), out: ReactNode[] = [];
  let ul: ReactNode[] = [];
  const flush = () => { if (ul.length) { out.push(<ul key={"u" + out.length}>{ul}</ul>); ul = []; } };
  lines.forEach((l, i) => { if (/^\s*[-•] /.test(l)) ul.push(<li key={i}>{inline(l.replace(/^\s*[-•] /, ""), "l" + i)}</li>); else { flush(); if (l.trim()) out.push(<p key={i}>{inline(l, "p" + i)}</p>); } });
  flush();
  return <>{out}</>;
}

function AwaChat({ onClose }: { onClose: () => void }) {
  const S = useDemo(), router = useRouter(), path = usePathname(), lang = useUI().lang;
  const [msgs, setMsgs] = useState<Msg[]>([]), [busy, setBusy] = useState(false), [text, setText] = useState("");
  const [mode, setMode] = useState<"…" | "ai" | "off">("…");
  const logRef = useRef<HTMLDivElement>(null), inRef = useRef<HTMLTextAreaElement>(null), ctl = useRef<AbortController | null>(null);
  const l = (fr: string, en: string) => L(lang, fr, en);
  const ref = path.startsWith("/biens/") ? path.split("/")[2] : undefined;
  const ctx: Ctx = { lang, nav: (h) => router.push(h), book: (r) => openModal({ k: "book", ref: r }), page: path === "/" ? "home" : ref ? "bien" : path.slice(1), ref };
  const u = S.user;
  const greeting = u ? l(`Bonjour ${u.name.split(" ")[0]} ! Je peux consulter votre espace et agir pour vous. Que puis-je faire ?`, `Hello ${u.name.split(" ")[0]}! I can check your account and act for you. What can I do?`)
    : l("Bonjour, je suis Awa ! Dites-moi ce que vous cherchez : je trouve les biens, je calcule votre budget, je prépare votre dossier et j'ouvre la réservation.", "Hello, I'm Awa! Tell me what you're looking for: I find properties, check your budget, prepare your application and open the booking.");
  const shown: Msg[] = msgs.length ? msgs : [{ role: "assistant", content: greeting, greet: true }];
  useEffect(() => { document.body.classList.add("ac-on"); inRef.current?.focus(); return () => document.body.classList.remove("ac-on"); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [msgs, busy]);
  const chips = (): string[] => {
    if (!u) return ref && byRef(S, ref)?.status === "libre" ? [l("Réserver ce bien", "Book this property"), l("Quel revenu faut-il ?", "What income do I need?"), l("Biens similaires moins chers", "Similar, cheaper properties")]
      : [l("Un 3 pièces à Bonanjo sous 400 000 FCFA", "A 3-room flat in Bonanjo under 400,000 FCFA"), l("Je gagne 450 000 FCFA par mois, que puis-je louer ?", "I earn 450,000 FCFA a month, what can I rent?"), l("Quelles pièces pour un étudiant ?", "Which documents for a student?"), l("Je suis propriétaire, quels packs ?", "I'm an owner, which packs?")];
    return ({ visitor: [l("Où en est ma demande ?", "Where is my request?"), l("J'ai une fuite d'eau", "I have a water leak"), l("Un studio meublé à Akwa", "A furnished studio in Akwa")], owner: [l("Résume l'état de mes biens", "Summarise my properties"), l("Quelles demandes ai-je reçues ?", "Which requests did I receive?"), l("Ouvre mon calendrier", "Open my calendar")], legal: [l("Quels dossiers sont urgents ?", "Which files are urgent?"), l("Résume le dossier le plus ancien", "Summarise the oldest file"), l("Rappelle la règle de solvabilité", "Remind me of the solvency rule")], provider: [l("Quelles sont mes interventions ?", "What are my jobs?"), l("Laquelle est la plus urgente ?", "Which is the most urgent?")], admin: [l("Fais-moi le point du jour", "Give me today's overview"), l("Quels biens dois-je valider ?", "Which properties must I approve?"), l("Ouvre les urgences", "Open emergencies")] } as Record<string, string[]>)[u.role] ?? [];
  };
  const applyActions = useCallback((actions: { type: string; payload: Record<string, unknown> }[]) => {
    for (const a of actions) {
      const p = a.payload;
      if (a.type === "show_results") acSearch(ctx, { quartiers: p.quartiers as string[], types: p.types as string[], modes: p.modes as string[], max_price: p.max_price as number, min_rooms: p.min_rooms as number });
      else if (a.type === "open_property") router.push(`/biens/${String(p.ref)}`);
      else if (a.type === "open_booking") { router.push(`/biens/${String(p.ref)}`); openModal({ k: "book", ref: String(p.ref) }); }
      else if (a.type === "navigate") router.push(p.page === "home" ? "/" : `/${String(p.page)}${p.tab ? `?tab=${String(p.tab)}` : ""}`);
      else if (a.type === "confirm_emergency") router.push("/services?tab=urgences");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const send = async (raw: string) => {
    const t = raw.trim().slice(0, 600);
    if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next); setBusy(true); setText("");
    let ans = "";
    try {
      /* Agent Claude de l'API quand elle est activée, sinon petit agent à règles de la maquette. */
      const c = new AbortController(); ctl.current = c;
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, signal: c.signal,
        body: JSON.stringify({ messages: next.filter((m) => !m.greet && !m.err).slice(-12).map(({ role, content }) => ({ role, content })), lang, context: { page: ctx.page, ref } }) });
      if (r.ok) { const j = await r.json() as { reply: string; actions?: { type: string; payload: Record<string, unknown> }[] }; ans = j.reply; applyActions(j.actions ?? []); setMode("ai"); }
      else throw new Error("offline");
    } catch (e) {
      if ((e as Error).name === "AbortError") { setBusy(false); return; }
      setMode("off"); await new Promise((r) => setTimeout(r, 550));
      try { ans = acOffline(t, ctx); } catch { ans = l("Désolée, je n'ai pas compris. Reformulez ?", "Sorry, I didn't get that. Could you rephrase?"); }
    }
    setBusy(false); ctl.current = null;
    setMsgs([...next, { role: "assistant", content: ans }]);
    setTimeout(() => inRef.current?.focus({ preventScroll: true }), 30);
  };
  const openRef = (r: string) => { router.push(`/biens/${r}`); if (window.innerWidth < 700) onClose(); };
  return (
    <section id="awachat" role="dialog" aria-modal="false" aria-labelledby="ac-title">
      <header><img src={CH("ch_conseillere_salut")} alt="" /><div><b id="ac-title">Awa</b><small>{l("Conseillère Immo Bell", "Immo Bell advisor")} · <span className={`ac-mode ${mode === "ai" ? "ai" : "off"}`} title={mode === "ai" ? l("Réponses générées par Claude.", "Answers generated by Claude.") : l("Assistant simplifié, sans IA : l'IA s'active quand la clé de l'API est configurée.", "Simplified assistant, no AI: the AI turns on when the API key is configured.")}>{mode === "…" ? l("Connexion…", "Connecting…") : mode === "ai" ? l("IA Claude", "Claude AI") : l("Mode démo", "Demo mode")}</span></small></div>
        <button className="ac-ic" onClick={() => { ctl.current?.abort(); setMsgs([]); setBusy(false); }} aria-label={l("Nouvelle conversation", "New conversation")} title={l("Nouvelle conversation", "New conversation")}><Ic n="refresh" className="sm" /></button>
        <button className="ac-ic" onClick={onClose} aria-label={l("Fermer le chat", "Close chat")}>✕</button></header>
      <div className="ac-log" role="log" aria-live="polite" aria-relevant="additions" ref={logRef}>
        {shown.map((m, i) => <div key={i} className={`ac-m ${m.role === "user" ? "me" : "her"}${m.err ? " err" : ""}`}>{m.role === "user" ? <p>{m.content}</p> : <Rich text={m.content} open={openRef} />}</div>)}
        {busy && <div className="ac-m her ac-live"><div className="ac-think"><i /><i /><i /><span>{l("Awa réfléchit…", "Awa is thinking…")}</span></div></div>}
      </div>
      <div className="ac-chips">{busy ? null : chips().map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}</div>
      <form className="ac-form" onSubmit={(e: FormEvent) => { e.preventDefault(); send(text); }}>
        <label className="sr" htmlFor="ac-in">{l("Votre message à Awa", "Your message to Awa")}</label>
        <textarea id="ac-in" ref={inRef} rows={1} maxLength={600} placeholder={l("Écrivez à Awa…", "Message Awa…")} value={text} disabled={busy}
          onChange={(e) => { setText(e.target.value); e.target.style.height = ""; e.target.style.height = Math.min(120, e.target.scrollHeight) + "px"; }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
        <button type="submit" className="ac-send" aria-label={l("Envoyer", "Send")} hidden={busy}><Ic n="send" className="sm" /></button>
        <button type="button" className="ac-stop" onClick={() => ctl.current?.abort()} hidden={!busy}>{l("Arrêter", "Stop")}</button>
      </form>
      <p className="ac-note">{l("Awa agit dans le site et peut se tromper. Ne partagez ni mot de passe ni numéro de pièce d'identité.", "Awa acts in the site and can make mistakes. Never share a password or ID number.")}</p>
    </section>
  );
}
