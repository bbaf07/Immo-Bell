// @ts-nocheck
/* Traductions à motifs (dates, pluriels, montants) de la maquette. Le dictionnaire exact est dans en.json. */
import EN from "../en.json";
const EN_RX=[];
let trText=s=>{if(!s)return s;const t=s.trim();if(!t)return s;let r=EN[t];if(r===undefined){for(const [rx,f] of EN_RX){if(rx.test(t)){r=t.replace(rx,f);break}}}if(r===undefined)return s;return s.replace(t,r)};
const LANG="en";
const fdate=t=>new Date(t).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
const MO={"janv.":"Jan","févr.":"Feb","mars":"Mar","avr.":"Apr","mai":"May","juin":"Jun","juil.":"Jul","août":"Aug","sept.":"Sep","oct.":"Oct","nov.":"Nov","déc.":"Dec","janvier":"January","février":"February","avril":"April","juillet":"July","septembre":"September","octobre":"October","novembre":"November","décembre":"December"};
const moRx=/(\d{1,2}) (janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.|janvier|février|avril|juillet|septembre|octobre|novembre|décembre)/g;
const fixDates=s=>s.replace(moRx,(m,d,mo)=>`${MO[mo]||mo} ${d}`).replace(/(octobre|novembre|décembre|septembre|janvier|février) (\d{4})/g,(m,mo,y)=>`${MO[mo]} ${y}`);
const T=s=>EN[s]!==undefined?EN[s]:s;
const plural=(n,a,b)=>+n>1?b:a;
EN_RX.push(
 [/^(\d+) pièces?$/,(m,n)=>`${n} ${plural(n,"room","rooms")}`],
 [/^(\d+) avis$/,(m,n)=>`${n} ${plural(n,"review","reviews")}`],
 [/^(\d+) biens?$/,(m,n)=>`${n} ${plural(n,"property","properties")}`],
 [/^(\d+) biens? · dès (.+) FCFA$/,(m,n,p)=>`${n} ${plural(n,"property","properties")} · from ${p.replace(",",".")} FCFA`],
 [/^Douala : (\d+) biens? trouvés?$/,(m,n)=>`Douala: ${n} ${plural(n,"property","properties")} found`],
 [/^Autre conseil \((\d+)\/(\d+)\)$/,(m,a,b)=>`Another tip (${a}/${b})`],
 [/^Notifications \((\d+) non lues?\)$/,(m,n)=>`Notifications (${n} unread)`],
 [/^Note ([\d,]+) sur 10$/,(m,n)=>`Rating ${n.replace(",",".")} out of 10`],
 [/^Prix de (IB-[A-Z]{3}-\d{3})$/,(m,r)=>`Price of ${r}`],
 [/^Disponibilité de (IB-[A-Z]{3}-\d{3})$/,(m,r)=>`Availability of ${r}`],
 [/^Voir le bien : (.+)$/,(m,t)=>`View property: ${T(t)}`],
 [/^Voir (.+) : (.+)$/,(m,t)=>m],
 [/^Réserver (.+)$/,(m,t)=>`Book ${T(t)}`],
 [/^Bonjour, (.+)$/,(m,n)=>`Hello, ${n}`],
 [/^Démo : vous êtes (.+) \((.+)\)\.$/,(m,n,r)=>`Demo: you are ${n.replace("Administrateur Immo Bell","Immo Bell administrator")} (${T(r)}).`],
 [/^Dépôt : (\d+) mois$/,(m,n)=>`Deposit: ${n} ${plural(n,"month","months")}`],
 [/^Pièces \((\d+)\/(\d+)\)$/,(m,a,b)=>`Documents (${a}/${b})`],
 [/^Tout effacer \((\d+)\)$/,(m,n)=>`Clear all (${n})`],
 [/^Avis \((\d+)\)$/,(m,n)=>`Reviews (${n})`],
 [/^(\d+) dossier\(s\) à étudier, du plus ancien au plus récent$/,(m,n)=>`${n} application(s) to review, oldest first`],
 [/^(\d+) dossiers? attend(?:ent)? votre étude\. Commencez par le plus ancien\.$/,(m,n)=>`${n} application${+n>1?"s":""} awaiting your review. Start with the oldest.`],
 [/^J'ai trouvé (\d+) biens? pour vous\. Affinez avec les filtres ou affichez la carte\.$/,(m,n)=>`I found ${n} ${plural(n,"property","properties")} for you. Refine with the filters or show the map.`],
 [/^Il vous manque (\d+) pièces?\. Déposez-la dans « Mes documents »\.$/,(m,n)=>`You're missing ${n} document${+n>1?"s":""}. Upload it in “My documents”.`],
 [/^Revenu net conseillé : au moins (.+) FCFA par mois \(règle du tiers\)\.$/,(m,p)=>`Recommended net income: at least ${p.replace(/ /g,",")} FCFA a month (one-third rule).`],
 [/^Revenu conseillé pour ce bien : (.+) FCFA par mois\.$/,(m,p)=>`Recommended income for this property: ${p.replace(/ /g,",")} FCFA a month.`],
 [/^Loyer accepté : (.+) de loyer et charges pour une capacité de (.+)\.$/,(m,a,b)=>`Rent accepted: ${a} in rent and charges for a capacity of ${b}.`],
 [/^Loyer refusé : (.+) de loyer et charges pour une capacité de (.+)\.$/,(m,a,b)=>`Rent declined: ${a} in rent and charges for a capacity of ${b}.`],
 [/^Solvabilité conforme : capacité (.+) pour un loyer de (.+)\.$/,(m,a,b)=>`Solvency OK: capacity ${a} for a rent of ${b}.`],
 [/^Loyer supérieur au tiers de vos revenus : capacité (.+) pour un loyer de (.+)\. Un garant solidaire est fortement conseillé\.$/,(m,a,b)=>`Rent above one third of your income: capacity ${a} for a rent of ${b}. A joint guarantor is strongly advised.`],
 [/^Solvabilité conforme : capacité (.+) pour (.+)\.$/,(m,a,b)=>`Solvency OK: capacity ${a} for ${b}.`],
 [/^Solvabilité insuffisante : capacité (.+) pour (.+)\.$/,(m,a,b)=>`Insufficient solvency: capacity ${a} for ${b}.`],
 [/^Situé à (.+), Douala$/,(m,q)=>`Located in ${q}, Douala`],
 [/^Voir (.+) sur la carte des biens$/,(m,q)=>`See ${q} on the property map`],
 [/^Relevé de (.+)$/,(m,d)=>`Statement for ${fixDates(d)}`],
 [/^(\d+) libres?$/,(m,n)=>`${n} available`],[/^(\d+) réservés?$/,(m,n)=>`${n} reserved`],[/^(\d+) occupés?$/,(m,n)=>`${n} occupied`],
 [/^(\d+) libres?, (\d+) réservés?, (\d+) occupés?$/,(m,a,b,c)=>`${a} available, ${b} reserved, ${c} occupied`],
 [/^(\d+) bien\(s\) loué\(s\) sur (\d+)$/,(m,a,b)=>`${a} of ${b} properties rented`],
 [/^(\d+) demandes · (\d+) en attente$/,(m,a,b)=>`${a} requests · ${b} pending`],
 [/^Pièces du dossier · (.+)$/,(m,s)=>`Application documents · ${T(s)}`],
 [/^Déposer : (.+)$/,(m,s)=>`Upload: ${T(s)}`],
 [/^(\d+) h restantes$/,(m,n)=>`${n} h left`],[/^Délai dépassé$/,()=>"Deadline passed"],
 [/^Dès le (.+)$/,(m,d)=>`From ${fixDates(d)}`],
 [/^(\d+) et plus$/,(m,n)=>`${n} or more`],
 [/^(\d+) nuits? = (.+)$/,(m,n,p)=>`${n} night${+n>1?"s":""} = ${p}`],
 [/^(\d+) nuits?$/,(m,n)=>`${n} night${+n>1?"s":""}`],
 [/^Entrée souhaitée le (.+)$/,(m,d)=>`Preferred move-in ${fixDates(d)}`],
 [/^· Entrée souhaitée le (.+)$/,(m,d)=>`· Preferred move-in ${fixDates(d)}`],
 [/^Demande (RES-\d{4}-\d{4}) en cours : (.+)\.$/,(m,c,s)=>`Request ${c} in progress: ${T(s.charAt(0).toUpperCase()+s.slice(1)).toLowerCase()}.`],
 [/^(.+) : (libre|occupé|réservé|réservé par un client|bloqué)$/,(m,d,s)=>`${fixDates(d)}: ${{libre:"available",occupé:"occupied",réservé:"reserved","réservé par un client":"booked by a client",bloqué:"blocked"}[s]}`],
 [/^(\d+) (\S+), déjà réservé$/,(m,d,mo)=>`${MO[mo]||mo} ${d}, already booked`],
 [/^(\d+) bien\(s\) en attente de validation par l'administrateur : (.+)$/,(m,n,r)=>`${n} propert${+n>1?"ies":"y"} awaiting approval by the administrator: ${T(r)}`],
 [/^Passer à « (.+) »$/,(m,s)=>`Move to “${T(s)}”`],
 [/^Demande (RES-\d{4}-\d{4}) annulée\.$/,(m,c)=>`Request ${c} cancelled.`],
 [/^(.+) : (validé|refusé|archivé)$/,(m,r,v)=>`${r}: ${T(v)}`],
 [/^Pack (Basic|Standard|Premium|Diaspora)$/,(m,p)=>`${p} pack`],
 [/^(Basic|Standard|Premium|Diaspora) \((\d+) %\)$/,(m,p,n)=>`${p} (${n}%)`],
 [/^Étape (\d)$/,(m,n)=>`Step ${n}`],
 [/^(.+) · (Immo Bell)$/,(m,t)=>`${T(t)} · Immo Bell`]
);
const _trText=trText;
trText=function(s){if(LANG!=="en"||!s)return s;const t=s.trim();if(!t)return s;let r=_trText(s);if(r!==s)return r;
  if(t.includes(" · ")){const parts=t.split(" · ").map(p=>{const q=_trText(p);return q!==p?q:fixDates(p)});const j=parts.join(" · ");if(j!==t)return s.replace(t,j)}
  if(/, Douala$/.test(t))return s;
  const d=fixDates(t);if(d!==t)return s.replace(t,d);
  if(/^« (.+) »$/.test(t))return s;
  return s};

const TT=s=>{for(const k in EN){if(k.length>12&&k.startsWith(s.replace(/…$/,"")))return EN[k].slice(0,25)+"…"}return s};
EN_RX.push(
 [/^(\d+) dossier\(s\) affiché\(s\)$/,(m,n)=>`${n} application(s) shown`],
 [/^Décision du (.+?)(?: · (.+))?$/,(m,d,b)=>`Decision on ${d}${b?" · "+(EN[b]!==undefined?EN[b]:b):""}`],
 [/^Dossier (\S+) accepté\. Notification envoyée\.$/,(m,c)=>`Application ${c} accepted. Notification sent.`],
 [/^Dossier (\S+) rejeté\. Le motif a été transmis au demandeur\.$/,(m,c)=>`Application ${c} rejected. The reason was sent to the applicant.`],
 [/^Dossier accepté : votre demande (\S+) pour (.+) est acceptée\.$/,(m,c,t)=>`Application accepted: your request ${c} for ${EN[t]!==undefined?EN[t]:t} is accepted.`],
 [/^Dossier rejeté : votre demande (\S+) pour (.+?) n'a pas été retenue\. Motif : (.+?)(?: \((.+)\))?\.$/,(m,c,t,w,n)=>`Application rejected: your request ${c} for ${EN[t]!==undefined?EN[t]:t} was not accepted. Reason: ${EN[w]!==undefined?EN[w]:w}${n?" ("+n+")":""}.`]
);
EN_RX.unshift(
 [/^(.+), ([\d\s\u202f\u00a0]+ FCFA)$/,(m,t,p)=>EN[t]!==undefined?`${EN[t]}, ${p}`:m],
 [/^(.{20,26})…$/,(m,t)=>{const r=TT(m);return r}],
 [/^« (.+) »$/,(m,t)=>EN[t]!==undefined?`“${EN[t]}”`:m],
 [/^(.+) \/ mois$/,(m,p)=>`${p} / month`],
 [/^(.+) · (\d+) m²$/,(m,t,n)=>`${T(t)} · ${n} m²`],
 [/^Suspension du compte (.+)$/,(m,e)=>`Account suspension ${e}`],
 [/^Validation du bien (.+)$/,(m,r)=>`Property approval ${r}`],
 [/^Code DEV-…$/,()=>"Code DEV-…"],
 [/^, (.+)$/,(m,t)=>EN[t]!==undefined?`, ${EN[t]}`:m],
 [/^RAPPORT D'ACTIVITÉ IMMO BELL/,(m)=>m]
);
EN_RX.push([/^Préparation de (.+?)( : \d+ %)?…?$/,(m,a,b)=>"Preparing "+a+(b||"")],[/^(\d+) photo\(s\) ajoutée\(s\)\. ?$/,"$1 photo(s) added."]);
EN_RX.push(
[/^(.+) \((Modérateur|Gestionnaire|Super-administrateur|Auditeur)\)$/,(m,a,b)=>a+" ("+trText(b)+")"],[/^(.+) · agréé par Immo Bell$/,(m,a)=>trText(a)+" · approved by Immo Bell"],[/^(.+) · en attente d'agrément$/,(m,a)=>trText(a)+" · awaiting approval"],[/^Décision rendue : (.+)$/,(m,a)=>"Decision given: "+trText(a)],[/^(.+) est invitée? à répondre sous 72 h$/,"$1 is invited to reply within 72 h"],[/^Litige (LIT-\d+) : (.+)$/,(m,a,b)=>"Dispute "+a+": "+({"décision rendue":"decision given","prise en charge":"case taken"}[b]||b)],[/^Prix, description, équipements.+$/,"Price, description, amenities and terms can be edited freely. Title, district, surface and number of rooms send the listing back for validation."],[/^Le locataire est prévenu tout de suite.+$/,"The tenant is told straight away with your reason. The property goes back to “available”. Administration is alerted and offers the tenant other properties."],[/^Cliquez sur « Prendre en charge ».+$/,"Click “Take case”: the case is assigned to you until resolution or escalation. All administrators (except read-only) can take a case."],
[/^(\d+) h pour répondre$/,"$1 h left to reply"],[/^Délai de réponse dépassé$/,"Reply deadline passed"],[/^(\d+) litige\(s\) attendent votre réponse$/,"$1 dispute(s) awaiting your reply"],[/^(\d+) action\(s\)$/,"$1 action(s)"],
[/^Journal de (.+)$/,"Log of $1"],[/^Dossier (LIT-\d+)$/,"Case $1"],[/^Prestataires \((\d+)\)$/,"Providers ($1)"],[/^Équipe \((\d+)\)$/,"Team ($1)"],[/^Prestataires agréés( : (.+))?$/,(m,a,b)=>"Approved providers"+(b?": "+trText(b):"")],
[/^Modifier (IB-.+)$/,"Edit $1"],[/^Annuler la réservation (RES-.+)$/,"Cancel booking $1"],[/^(Litige|Signalement) · (.+) · (Vous avez déclaré|Déclaré contre vous)$/,(m,a,b,c)=>trText(a)+" · "+b+" · "+(c==="Vous avez déclaré"?"You reported":"Reported against you")],
[/^(Litige|Signalement)( · niveau 2)?$/,(m,a,b)=>trText(a)+(b?" · level 2":"")],[/^Répondre ?$/,"Reply"],[/^Votre réponse :?$/,"Your reply"],[/^Commentaire signalé : (.+)$/,(m,a)=>"Comment reported: "+a],
[/^Décision : (.+)$/,(m,a)=>"Decision: "+(trText(a))],[/^Réponse de la partie adverse \((.+)\) :$/,"Other party's reply ($1):"],[/^Note interne : (.+)$/,"Internal note: $1"],[/^Rôle de (.+)$/,"Role of $1"],[/^Devis (Classique|Standard|Golf)$/,(m,a)=>"Quote "+trText(a)],
[/^Nouveau litige (LIT-\d+) : (.+)\.$/,"New dispute $1: $2."],[/^Litige (LIT-\d+) déclaré\. L'autre partie est prévenue\.$/,"Dispute $1 reported. The other party has been notified."],[/^Cas pris en charge : il vous est assigné jusqu'à résolution ou escalade\.$/,"Case taken: it is assigned to you until resolution or escalation."]);
export {EN_RX,trText,fixDates};
