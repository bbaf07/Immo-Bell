// @ts-nocheck
/* Moteur graphique repris à l'identique de la maquette (canvas / animation), exécuté côté navigateur uniquement. */
const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches};
const BG={on:false,t:0,parts:[],motifs:[],boats:[],pulses:[],mx:-9999,my:-9999,next:2};
function bgInit(){if(BG.on)return;BG.on=true;const c=document.createElement("canvas");c.id="sawa";c.setAttribute("aria-hidden","true");document.body.prepend(c);BG.c=c;BG.x=c.getContext("2d");
  const rs=()=>{BG.dpr=Math.min(1.5,devicePixelRatio||1);BG.w=innerWidth;BG.h=innerHeight;c.width=BG.w*BG.dpr;c.height=BG.h*BG.dpr;BG.x.setTransform(BG.dpr,0,0,BG.dpr,0,0)};rs();addEventListener("resize",rs);
  const n=Math.round(Math.min(70,BG.w/18));for(let i=0;i<n;i++)BG.parts.push({x:Math.random()*BG.w,y:Math.random()*BG.h,r:.6+Math.random()*2.2,s:.15+Math.random()*.5,p:Math.random()*6.3,vx:0,vy:0});
  for(let i=0;i<7;i++)BG.motifs.push({x:Math.random(),y:Math.random()*.7,r:40+Math.random()*90,rot:Math.random()*6,vr:(Math.random()-.5)*.12,k:i%3,dx:(Math.random()-.5)*.006,dy:(Math.random()-.5)*.004});
  addEventListener("pointermove",e=>{BG.mx=e.clientX;BG.my=e.clientY},{passive:true});
  addEventListener("pointerdown",e=>{if(!e.target.closest("button,a,input,select,textarea,label,.card,.rcard"))BG.pulses.push({x:e.clientX,y:e.clientY,t:0,big:false})},{passive:true});
  let last=performance.now();const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;
    const rm=matchMedia("(prefers-reduced-motion: reduce)").matches,still=document.documentElement.classList.contains("still");if(document.hidden)return;if((rm||still)&&BG.drawn)return;bgDraw(rm||still?0:dt);BG.drawn=true};
  requestAnimationFrame(loop)}
const waveY=(i,x,t)=>{const H0=BG.h*(.84+i*.045)+Math.min(40,scrollY*.03*(i+1));return H0+Math.sin(x*.006+t*(.5+i*.18)+i*1.7)*(10+i*3)+Math.sin(x*.013-t*.7+i)*5};
function bgDraw(dt){const x=BG.x,w=BG.w,h=BG.h,dark=isDark();BG.t+=dt;const t=BG.t;x.clearRect(0,0,w,h);
  const G1=dark?"242,180,0":"242,176,0",G2=dark?"246,243,234":"10,10,10";
  // motifs géométriques sawa (anneaux de triangles, comme le sceau)
  BG.motifs.forEach(m=>{m.x+=m.dx*dt;m.y+=m.dy*dt;if(m.x<-.1)m.x=1.1;if(m.x>1.1)m.x=-.1;if(m.y<-.1)m.y=.8;if(m.y>.8)m.y=-.1;
    const cx=m.x*w,cy=m.y*h,r=m.r*.9;x.save();x.translate(cx,cy);x.strokeStyle=`rgba(${G1},${dark?.2:.3})`;x.lineWidth=1.2;x.lineJoin="miter";
    x.beginPath();x.moveTo(-r,r*.5);x.lineTo(-r,r*.18);x.lineTo(0,-r*.8);x.lineTo(r,r*.18);x.lineTo(r,r*.48);x.lineTo(0,-r*.38);x.closePath();x.stroke();
    if(m.k!==1){x.beginPath();x.rect(-r*.16,r*.1,r*.32,r*.32);x.stroke()}
    x.restore()});
  // pulsations du tam-tam
  BG.next-=dt;if(BG.next<=0&&dt>0){BG.next=3.4;BG.pulses.push({x:w*(.15+Math.random()*.7),y:h*(.6+Math.random()*.25),t:0,big:true})}
  BG.pulses=BG.pulses.filter(p=>{p.t+=dt;const life=p.big?3:1.6;if(p.t>life)return false;for(let k=0;k<(p.big?3:2);k++){const tt=p.t-k*.25;if(tt<0)continue;const r=tt*(p.big?110:80),a=(1-tt/life)*(p.big?.28:.4);x.strokeStyle=`rgba(${G1},${a})`;x.lineWidth=p.big?1.6:1.2;x.beginPath();x.arc(p.x,p.y,r,0,7);x.stroke()}return true});
  // étincelles dorées
  BG.parts.forEach(p=>{p.y-=p.s*dt*22;p.x+=Math.sin(t*.8+p.p)*dt*8;const dx=p.x-BG.mx,dy=p.y-BG.my,d2=dx*dx+dy*dy;if(d2<12000){const f=(12000-d2)/12000*60*dt;p.x+=dx/Math.sqrt(d2+1)*f;p.y+=dy/Math.sqrt(d2+1)*f}
    if(p.y<-10){p.y=h+10;p.x=Math.random()*w}const tw=.35+.35*Math.sin(t*2.2+p.p);x.fillStyle=`rgba(${G1},${tw})`;x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()});
  // vagues du Wouri
  for(let i=0;i<4;i++){x.beginPath();x.moveTo(0,h);for(let X=0;X<=w+20;X+=20)x.lineTo(X,waveY(i,X,t));x.lineTo(w,h);x.closePath();x.fillStyle=`rgba(${G1},${[.05,.06,.075,.09][i]})`;x.fill();
    x.beginPath();for(let X=0;X<=w+20;X+=20)X?x.lineTo(X,waveY(i,X,t)):x.moveTo(X,waveY(i,X,t));x.strokeStyle=`rgba(${G1},${[.35,.3,.26,.22][i]})`;x.lineWidth=[1.8,1.5,1.2,1][i];x.stroke()}
  // pirogues du Ngondo
  if(dt>0&&Math.random()<dt*.18&&BG.boats.length<3){const dir=Math.random()<.5?1:-1;BG.boats.push({x:dir>0?-160:w+160,dir,lane:Math.random()<.5?1:2,sp:38+Math.random()*30,ph:Math.random()*6,n:3+Math.floor(Math.random()*4)})}
  if(!BG.boats.length&&!dt){BG.boats.push({x:w*.3,dir:1,lane:1,sp:0,ph:0,n:5})}
  BG.boats=BG.boats.filter(b=>{b.x+=b.dir*b.sp*dt;if(b.x<-200||b.x>w+200)return false;const y=waveY(b.lane,b.x,t)-2,y2=waveY(b.lane,b.x+6,t),ang=Math.atan2(y2-y,6);drawBoat(x,b,y,ang,t,G1,G2);return true});
}
function drawBoat(x,b,y,ang,t,G1,G2){x.save();x.translate(b.x,y);x.rotate(ang);x.scale(b.dir,1);const L=60+b.n*14;
  x.fillStyle=`rgba(${G2},.4)`;x.beginPath();x.moveTo(-L/2-14,-10);x.quadraticCurveTo(-L/2,6,0,7);x.quadraticCurveTo(L/2,6,L/2+18,-12);x.lineTo(L/2+10,-6);x.quadraticCurveTo(0,-1,-L/2-6,-5);x.closePath();x.fill();
  x.strokeStyle=`rgba(${G1},.8)`;x.lineWidth=1.4;x.beginPath();x.moveTo(-L/2,-2);x.quadraticCurveTo(0,4,L/2+6,-4);x.stroke();
  for(let i=0;i<b.n;i++){const px=-L/2+16+i*((L-20)/Math.max(1,b.n-1)),st=Math.sin(t*6+b.ph+i*.4);x.fillStyle=`rgba(${G2},.6)`;x.beginPath();x.arc(px,-17,3.2,0,7);x.fill();x.fillRect(px-1.6,-14,3.2,9);
    x.strokeStyle=`rgba(${G2},.55)`;x.lineWidth=1.3;x.beginPath();x.moveTo(px+1,-10);x.lineTo(px-8+st*7,6+Math.abs(st)*3);x.stroke()}
  x.strokeStyle=`rgba(${G1},.85)`;x.lineWidth=1.2;x.beginPath();x.moveTo(L/2+12,-10);x.lineTo(L/2+12,-30);x.stroke();x.fillStyle=`rgba(${G1},.85)`;x.beginPath();x.moveTo(L/2+12,-30);x.lineTo(L/2+12+Math.sin(t*4+b.ph)*2+12,-25);x.lineTo(L/2+12,-21);x.fill();
  x.restore()}
export function startBg(){bgInit()}
