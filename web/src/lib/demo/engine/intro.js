// @ts-nocheck
const $=s=>document.querySelector(s);
const guideAct=()=>{};
/* Moteur graphique repris à l'identique de la maquette (canvas / animation), exécuté côté navigateur uniquement. */
const LG_ROOF='<path d="M293 542V448L512 238 731 448V537L512 330Z"/>',LG_WIN='<path fill-rule="evenodd" d="M464 468h96v97h-96zM480 484v65h64v-65z"/>';
const LG_W1="M246 621C310 598 400 596 460 612C490 621 534 621 564 612C624 596 714 598 780 621",LG_W2="M240 651C304 628 396 626 456 642C488 651 536 651 568 642C628 626 718 628 786 651";
function introMark(){return `<div class="im"><svg viewBox="236 232 556 430" aria-hidden="true" focusable="false"><g class="ir" stroke-width="5">${LG_ROOF}</g><g class="iw" stroke-width="5">${LG_WIN}</g><g class="iv" fill="none" stroke-width="4" stroke-linecap="round"><path pathLength="1" d="${LG_W1}"/><path pathLength="1" d="${LG_W2}"/></g></svg></div>`}
function intro(force){if(!force){try{if(sessionStorage.getItem("ib_intro"))return}catch(e){}}if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const en=document.documentElement.lang==="en";
  const d=document.createElement("div");d.id="intro";d.setAttribute("role","dialog");d.setAttribute("aria-label",en?"Immo Bell opening":"Ouverture Immo Bell");
  d.innerHTML=`<div class="ih ih-t"></div><div class="ih ih-b"></div>
  <svg class="iwaves" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70 q75 -40 150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0"/><path d="M0 100 q75 -28 150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0 t150 0"/></svg>
  <svg class="iboat" viewBox="0 0 200 60" aria-hidden="true"><path d="M4 30 Q30 52 100 52 Q170 52 196 26 L188 34 Q100 40 12 34Z" fill="#F6F3EA"/><path d="M14 38 Q100 46 186 34" stroke="#F2B000" stroke-width="3" fill="none"/>${[40,70,100,130,160].map((x,i)=>`<g><circle cx="${x}" cy="14" r="5" fill="#F6F3EA"/><rect x="${x-2.5}" y="18" width="5" height="14" fill="#F6F3EA"/><line x1="${x+2}" y1="24" x2="${x-12}" y2="50" stroke="#F2B000" stroke-width="2.5"><animate attributeName="x2" values="${x-14};${x+6};${x-14}" dur="0.9s" begin="${i*.08}s" repeatCount="indefinite"/></line></g>`).join("")}</svg>
  <div class="stagei">${introMark()}
   <h2 aria-label="Immo Bell">${"IMMO BELL".split("").map((c,i)=>`<span style="animation-delay:${1.7+i*.06}s">${c===" "?"&nbsp;":c}</span>`).join("")}</h2>
   <div class="ibar"><i></i></div></div>
  <button class="skip2" type="button" aria-label="${en?"Skip intro":"Passer l'intro"}" title="${en?"Skip intro":"Passer l'intro"}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5l7 7-7 7M13 5l7 7-7 7"/></svg></button>`;
  document.body.appendChild(d);document.body.classList.add("lock");const sk=d.querySelector(".skip2");sk.focus({preventScroll:true});
  const ts=[];let done=false;const end=()=>{if(done)return;done=true;ts.forEach(clearTimeout);d.classList.add("open");document.body.classList.remove("lock");try{sessionStorage.setItem("ib_intro","1")}catch(e){}setTimeout(()=>{d.remove();$("#main")?.focus({preventScroll:true});guideAct("hop")},950)};
  sk.onclick=end;d.addEventListener("click",e=>{if(e.target===d||e.target.classList.contains("ih"))end()});const kd=e=>{if(e.key==="Escape"){end();removeEventListener("keydown",kd)}};addEventListener("keydown",kd);
  ts.push(setTimeout(()=>{d.querySelector(".ibar i").style.width="100%"},1200));
  ts.push(setTimeout(end,5000))}
export function startIntro(force){intro(force)}
