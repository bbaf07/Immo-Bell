/* Effets visuels et traduction de la maquette, appliqués au DOM rendu par React (navigateur uniquement). */
import { EN_RX, fixDates, trText as baseTr } from "./engine/i18n-rx.js";

/** Traduction d'un texte, puis dates françaises restantes (« 1 août » → « Aug 1 »). */
const trText = (s: string) => { const r = baseTr(s); return r === s ? fixDates(s) : fixDates(r); };

EN_RX.unshift([/^Avis \((\d+)\)$/, "Reviews ($1)"], [/^Autre conseil \((\d+)\/(\d+)\)$/, "Another tip ($1/$2)"], [/^(\d+) bien\(s\) en attente de validation par l'administrateur : $/, "$1 propert(ies) awaiting administrator approval: "]);

/* ---------- traduction FR → EN des textes affichés ---------- */
const src = new WeakMap<Node, string>(), out = new WeakMap<Node, string>();
const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const aSrc = new WeakMap<Element, Record<string, string>>(), aOut = new WeakMap<Element, Record<string, string>>();
const SKIP = /^(SCRIPT|STYLE|TEXTAREA|CODE)$/;

/** Suite de nœuds texte adjacents (React découpe « Avis ({n}) » en plusieurs nœuds) : on traduit la phrase entière. */
function run(n: Node): Node[] {
  /* Les marqueurs <!-- --> de React entre deux textes ne coupent pas la phrase. */
  const l: Node[] = [n];
  for (let p = n.previousSibling; p && (p.nodeType === 3 || p.nodeType === 8); p = p.previousSibling) if (p.nodeType === 3) l.unshift(p);
  for (let p = n.nextSibling; p && (p.nodeType === 3 || p.nodeType === 8); p = p.nextSibling) if (p.nodeType === 3) l.push(p);
  return l;
}
function textNode(n: Node, en: boolean) {
  const nodes = run(n);
  const srcs = nodes.map((x) => { const cur = x.nodeValue ?? ""; if (out.get(x) !== cur) src.set(x, cur); return src.get(x) ?? cur; });
  const whole = srcs.join("");
  const next = en ? trText(whole) : whole;
  nodes.forEach((x, i) => {
    const v = en && next !== whole ? (i === 0 ? next : "") : srcs[i];
    if (x.nodeValue !== v) x.nodeValue = v;
    out.set(x, v);
  });
}
function attrs(el: Element, en: boolean) {
  const s = aSrc.get(el) ?? {}, o = aOut.get(el) ?? {};
  for (const a of ATTRS) {
    const cur = el.getAttribute(a); if (cur === null) continue;
    if (o[a] !== cur) s[a] = cur;
    const next = en ? trText(s[a] ?? cur) : s[a] ?? cur;
    if (next !== cur) el.setAttribute(a, next);
    o[a] = next;
  }
  aSrc.set(el, s); aOut.set(el, o);
}
export function translateTree(root: Node, en: boolean) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentNode && SKIP.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const nodes: Node[] = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach((n) => textNode(n, en));
  if (root instanceof Element) { attrs(root, en); root.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach((e) => attrs(e, en)); }
}

let tmo: MutationObserver | null = null;
/** Active ou coupe la traduction ; suit ensuite les mises à jour de React. */
export function setTranslation(en: boolean) {
  tmo?.disconnect(); tmo = null;
  translateTree(document.body, en);
  document.title = en ? trText(document.title) : document.title;
  if (!en) return;
  tmo = new MutationObserver((ms) => {
    tmo?.disconnect();
    for (const m of ms) {
      if (m.type === "characterData") textNode(m.target, true);
      else if (m.type === "attributes" && m.target instanceof Element) attrs(m.target, true);
      else m.addedNodes.forEach((n) => { if (n.nodeType === 3) textNode(n, true); else if (n.nodeType === 1) translateTree(n, true); });
    }
    tmo?.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  });
  tmo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

/* ---------- apparition progressive des blocs ---------- */
let rvObs: MutationObserver | null = null;
export function startReveal() {
  if (rvObs || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
  let n = 0;
  const scan = () => {
    document.querySelectorAll("main .sec-head, main .mini>div, main .step, main .flow>div, main .sim>.panel, main details").forEach((el) => {
      if (el.closest(".hero") || (el as HTMLElement).dataset.rv) return;
      (el as HTMLElement).dataset.rv = "1"; el.classList.add("rv"); (el as HTMLElement).style.transitionDelay = (n++ % 4) * 70 + "ms"; io.observe(el);
    });
  };
  let t: ReturnType<typeof setTimeout>;
  rvObs = new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 80); });
  rvObs.observe(document.body, { subtree: true, childList: true });
  scan();
}

/** Confettis de la confirmation de réservation. */
export function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("div"); c.className = "g-conf"; c.setAttribute("aria-hidden", "true");
  const cols = ["#F2B000", "#0A0A0A", "#FFFFFF", "#946700", "#1E8E5A"];
  c.innerHTML = Array.from({ length: 60 }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${cols[i % 5]};animation-delay:${Math.random() * 0.5}s;animation-duration:${1.4 + Math.random() * 1.2}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join("");
  document.body.appendChild(c); setTimeout(() => c.remove(), 3200);
}
