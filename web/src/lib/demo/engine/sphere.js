// @ts-nocheck
/* Moteur graphique repris à l'identique de la maquette (canvas / animation), exécuté côté navigateur uniquement. */
export function startSphere(){
  if(window.__sph)return;
let cv=null,box=null,ctx=null,ro=null,io=null,vis=true;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;const still=()=>document.documentElement.classList.contains('still');
const dark=()=>getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toUpperCase()==='#0A0A0A';
const rnd=(a,b)=>a+Math.random()*(b-a);
// couleurs (r,g,b)
const COL={gold:[214,158,10],goldL:[242,186,40],ink:[38,30,18],water:[56,160,196],waterL:[110,196,226],sand:[212,176,110],grass:[96,150,64],leaf:[66,138,72],trunk:[122,88,52],skin:[110,72,44],white:[236,228,210],arc:[242,176,0]};
const P=[]; // {x,y,z,c,s,k:type}
const add=(x,y,z,c,s=1,k='o')=>P.push({x,y,z,c,s,k});
// coque (spirale de Fibonacci)
const NS=1100,ga=Math.PI*(3-Math.sqrt(5));
for(let i=0;i<NS;i++){const y=1-(i/(NS-1))*2,r=Math.sqrt(1-y*y),t=ga*i;add(Math.cos(t)*r,y,Math.sin(t)*r,COL.gold,1,'shell')}
// île : calotte de points (sable puis herbe)
const H=-.22,TOP=-.08;
for(let i=0;i<520;i++){const u=Math.sqrt(Math.random()),a=rnd(0,Math.PI*2),r=u*.36*(1+.08*Math.sin(a*3));const y=TOP-(Math.pow(u,2.2))*(TOP-H+.03)+rnd(-.006,.006);add(Math.cos(a)*r,y,Math.sin(a)*r,u>.78?COL.sand:COL.grass,.95,'isle')}
for(let i=0;i<120;i++){const a=rnd(0,Math.PI*2),r=rnd(.36,.42);add(Math.cos(a)*r,H+rnd(-.01,.015),Math.sin(a)*r,COL.sand,.9,'isle')}
// la case Sawa : murs rayés, toit rayonnant or / encre, faîte en éventail
const HX=0,HZ=-.02;
for(let k=0;k<7;k++)for(let i=0;i<48;i++){const a=i/48*Math.PI*2,y=TOP+k*.017;const win=(Math.abs(Math.sin(a*2))>.75&&k>1&&k<6&&i%2===0);const door=(Math.abs(a-Math.PI/2)<.22&&k<6);add(HX+Math.cos(a)*.1,y,HZ+Math.sin(a)*.1,door?COL.ink:win?COL.ink:COL.goldL,1.05,'hut')}
for(let k=0;k<12;k++){const t=k/11,rad=.19*(1-t)+.006,y=TOP+.12+t*.15,n=Math.max(6,Math.round(rad*360));for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const stripe=((i/n*26)%1)<.3;add(HX+Math.cos(a)*rad,y,HZ+Math.sin(a)*rad,stripe?COL.ink:COL.gold,1.08,'hut')}}
for(let f=0;f<7;f++){const a=(f-3)*.2;for(let k=0;k<6;k++)add(HX+Math.sin(a)*k*.009,TOP+.28+k*.011,HZ,COL.ink,.95,'hut')}
// palmiers
[[-.22,-.12,.26],[.23,-.05,.22],[-.08,.24,.2],[.07,-.27,.22]].forEach(([x,z,h],pi)=>{for(let k=0;k<14;k++){const t=k/13;add(x+t*t*.05,TOP+t*h,z,COL.trunk,.9,'palm')}
 for(let f=0;f<8;f++){const a=f/8*Math.PI*2+pi;for(let k=1;k<=9;k++){const u=k/9;add(x+.05+Math.cos(a)*u*.12,TOP+h-u*u*.06,z+Math.sin(a)*u*.12,COL.leaf,.95,'palm')}}});
// tam-tam et mât aux fanions
for(let k=0;k<4;k++)for(let i=0;i<14;i++){const a=i/14*Math.PI*2;add(.17+Math.cos(a)*.025,TOP+k*.014,.1+Math.sin(a)*.025,k%3===0?COL.gold:COL.trunk,.9,'hut')}
for(let k=0;k<16;k++)add(-.19,TOP+k*.018,.06,COL.trunk,.85,'hut');
const FLAGS=[[COL.gold,.27],[COL.ink,.22],[COL.white,.17]].map(([c,y])=>{const pts=[];for(let i=0;i<5;i++)for(let j=0;j<3;j++){const p={x:0,y:0,z:0,c,s:.95,k:'flag',fx:i*.013,fy:TOP+y-j*.01};P.push(p);pts.push(p)}return pts});
// la pirogue (coque en points + pagayeurs), placée chaque image
const BOAT=[];{const L=.24;for(let i=0;i<=40;i++){const u=i/40*2-1;for(const s of [-1,1]){const w=.034*(1-.4*Math.pow(Math.abs(u),3));BOAT.push({bx:u*L,by:.05*Math.pow(Math.abs(u),5),bz:s*w,c:COL.ink});BOAT.push({bx:u*L,by:-.025+.05*Math.pow(Math.abs(u),5)*.6,bz:s*w*.55,c:COL.ink})}BOAT.push({bx:u*L,by:-.04+.04*Math.pow(Math.abs(u),4),bz:0,c:COL.ink})}
 for(let i=0;i<=40;i+=2){const u=i/40*2-1;BOAT.push({bx:u*L,by:.004+.05*Math.pow(Math.abs(u),5),bz:.034*(1-.4*Math.pow(Math.abs(u),3)),c:COL.gold})}
 for(let m=0;m<5;m++){const x=-.13+m*.065;for(let k=0;k<3;k++)BOAT.push({bx:x,by:.008+k*.009,bz:0,c:k===1?COL.gold:COL.skin,pad:m});}
 for(let k=0;k<6;k++)BOAT.push({bx:-.21,by:.01+k*.012,bz:0,c:COL.trunk});for(let i=0;i<4;i++)for(let j=0;j<2;j++)BOAT.push({bx:-.21-i*.01,by:.07-j*.009,bz:0,c:COL.gold});}
BOAT.forEach(b=>{b.s=1;b.k='boat';P.push(b)});
const PADDLE=[];for(let m=0;m<5;m++)for(let k=0;k<6;k++){const p={x:0,y:0,z:0,c:k>3?COL.gold:COL.trunk,s:.9,k:'boat',m,kk:k};P.push(p);PADDLE.push(p)}
// eau : grille polaire, la surface reste horizontale et ballotte
const RW=Math.sqrt(1-H*H)*.95,WATER=[];
for(let j=1;j<=14;j++){const r=j/14*RW;if(r<.37)continue;const n=Math.round(r*150);for(let i=0;i<n;i++){const p={x:0,y:0,z:0,c:j%3===0?COL.waterL:COL.water,s:1,k:'water',r,a0:i/n*Math.PI*2+j*.3};P.push(p);WATER.push(p)}}
// volume d'eau : quelques points en profondeur
for(let i=0;i<160;i++){let x,y,z;do{x=rnd(-.95,.95);z=rnd(-.95,.95);y=rnd(-.86,H-.04)}while(x*x+y*y+z*z>.9||x*x+z*z<.16);add(x,y,z,COL.water,.75,'deep')}
// poussière d'or
const DUST=[];
for(let i=0;i<(RM?0:70);i++){let x,y,z;do{x=rnd(-.8,.8);z=rnd(-.8,.8);y=rnd(0,.85)}while(x*x+y*y+z*z>.8);const p={x,y,z,c:COL.goldL,s:.85,k:'dust',vy:-rnd(.01,.04),ph:rnd(0,6)};P.push(p);DUST.push(p)}
// quartiers sur la coque + arcs
const ll=(lat,lon)=>{const a=lat*Math.PI/180,b=lon*Math.PI/180;return [Math.cos(a)*Math.sin(b),Math.sin(a),Math.cos(a)*Math.cos(b)]};
const Q={"Bonanjo":ll(30,0),"Akwa":ll(46,52),"Bonapriso":ll(18,-58),"Deido":ll(56,118),"Bali":ll(24,168),"Makepe":ll(40,-120),"Bonamoussadi":ll(12,-160),"Logpom":ll(62,-170)};
const ARCS=[["Bonanjo","Akwa"],["Bonanjo","Bonapriso"],["Akwa","Deido"],["Deido","Bali"],["Bonapriso","Makepe"],["Makepe","Bonamoussadi"],["Bali","Logpom"],["Bonanjo","Makepe"]];
const slerp=(a,b,t)=>{const d=Math.acos(Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));const s=Math.sin(d),k1=Math.sin((1-t)*d)/s,k2=Math.sin(t*d)/s;return [a[0]*k1+b[0]*k2,a[1]*k1+b[1]*k2,a[2]*k1+b[2]*k2]};
const ARCP=ARCS.map(([a,b])=>{const A=Q[a],B=Q[b],d=Math.acos(A[0]*B[0]+A[1]*B[1]+A[2]*B[2]),h=.04+d*.06,out=[];for(let i=0;i<=48;i++){const t=i/48,p=slerp(A,B,t),e=1+h*Math.sin(Math.PI*t);out.push([p[0]*e,p[1]*e,p[2]*e])}return {pts:out,off:Math.random(),sp:.15+Math.random()*.1}});

// état
let yaw=.5,pitch=0,vYaw=0,vPitch=0,drag=false,lx=0,ly=0,idle=0,W=0,Hh=0,R=0,cx=0,cy=0,dpr=1,last=performance.now();
let n=[0,1,0],nv=[0,0,0],flow=0,phase=0,amp=.008,prevYawV=0,boatA=0;
const PITCH0=0;
function size(){if(!box||!cv||!cv.isConnected)return;const r=box.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;Hh=r.height;cv.width=W*dpr;cv.height=Hh*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);R=Math.min(W*.37,Hh*.37);cx=W*.5;cy=Hh*.49}
function bind(el){cv=el;box=el.parentNode;ctx=el.getContext('2d');ro&&ro.disconnect();ro=new ResizeObserver(size);ro.observe(box);size();
 io&&io.disconnect();io=new IntersectionObserver(es=>{vis=es[0].isIntersecting});io.observe(box);
 el.addEventListener('pointerdown',e=>{drag=true;lx=e.clientX;ly=e.clientY;vYaw=0;el.setPointerCapture(e.pointerId);const h=box.querySelector('.sph-hint');if(h)h.style.opacity=0});
 el.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;yaw+=dx*.007;pitch=Math.max(-.5,Math.min(.5,pitch+dy*.005));vYaw=vYaw*.5+dx*.42*.5;idle=0});
 const end=()=>{drag=false;idle=0};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
 el.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){vYaw=-2.5;idle=0}if(e.key==='ArrowRight'){vYaw=2.5;idle=0}if(e.key==='ArrowUp')pitch=Math.max(-.5,pitch-.15);if(e.key==='ArrowDown')pitch=Math.min(.5,pitch+.15)})}
let cY,sY,cP,sP;
const cE=Math.cos(.36),sE=Math.sin(.36);const rot=(x,y,z)=>{const x1=x*cY+z*sY,z1=-x*sY+z*cY;const y2=y*cP-z1*sP,z2=y*sP+z1*cP;return [x1,y2*cE-z2*sE,y2*sE+z2*cE]};
function surf(x,z,t){let y=H-(n[0]*x+n[2]*z)/n[1];const c=Math.cos(phase),s=Math.sin(phase),u=x*c+z*s,v=-x*s+z*c;y+=amp*(Math.sin(u*7+t*2.2)*.6+Math.sin(v*11-t*3.1)*.3);return y}
let tt=0;function frame(now){const el=document.getElementById('sphere');if(!el||!el.isConnected){if(cv){ro&&ro.disconnect();io&&io.disconnect();vis=true}cv=null;last=now;requestAnimationFrame(frame);return}if(el!==cv)bind(el);
 if(!vis||document.hidden){last=now;requestAnimationFrame(frame);return}
 const st=still()||RM;const dt=st?0:Math.min(.05,(now-last)/1000);tt+=dt;const t=tt;last=now;idle+=dt;
 if(!drag){vYaw*=Math.pow(.15,dt);vPitch*=Math.pow(.05,dt);const auto=RM?0:(idle>1.2?.22:0);vYaw+=(auto-vYaw)*Math.min(1,dt*.6);yaw+=vYaw*dt;pitch+=(PITCH0-pitch)*Math.min(1,dt*1.5)}
 cY=Math.cos(yaw);sY=Math.sin(yaw);cP=Math.cos(pitch);sP=Math.sin(pitch);
 // eau : normale qui suit le « haut » réel avec un ressort (ballottement)
 const L=[sP*sY,cP,-sP*cY];
 for(let i=0;i<3;i++){nv[i]+=(L[i]-n[i])*dt*30;nv[i]*=1-dt*2.2;n[i]+=nv[i]*dt}const nl=Math.hypot(...n);n=n.map(v=>v/nl);if(n[1]<.6)n[1]=.6;
 const dY=(vYaw-prevYawV)/Math.max(dt,1e-3);prevYawV=vYaw;flow+=(-dY*.9-flow*.7)*dt;phase+=(flow+.08)*dt;
 amp+=((.008+Math.min(.04,Math.abs(vYaw)*.008+Math.abs(flow)*.012+Math.hypot(...nv)*.02))-amp)*Math.min(1,dt*2);
 // mise à jour des éléments animés
 for(const p of WATER){const a=p.a0+phase*.4;p.x=Math.cos(a)*p.r;p.z=Math.sin(a)*p.r;p.y=surf(p.x,p.z,t)}
 boatA+=dt*(.22+flow*.6);const br=.62,bx=Math.cos(boatA)*br,bz=Math.sin(boatA)*br,by=surf(bx,bz,t);const hd=-boatA-Math.PI/2,ch=Math.cos(hd),sh=Math.sin(hd);
 for(const b of BOAT){const bob=Math.sin(t*2+b.bx*8)*.004;b.x=bx+b.bx*ch+b.bz*sh;b.z=bz-b.bx*sh+b.bz*ch;b.y=by+b.by-.005+bob}
 for(const p of PADDLE){const m=p.m,x=-.13+m*.065,sw=Math.sin(t*4.2)*.03,side=m%2?-1:1;const lx_=x+sw*(p.kk/5),ly_=.018-p.kk*.009,lz=side*(.028+p.kk*.012);p.x=bx+lx_*ch+lz*sh;p.z=bz-lx_*sh+lz*ch;p.y=by+ly_}
 FLAGS.forEach((f,fi)=>f.forEach(p=>{p.x=-.19+p.fx;p.y=p.fy;p.z=.06+Math.sin(p.fx*90-t*6+fi)*p.fx*.35}));
 for(const d of DUST){d.y+=d.vy*dt*(1+Math.abs(flow));d.x+=Math.sin(t*.7+d.ph)*.0008;if(d.y<surf(d.x,d.z,t)+.02){let x,z;do{x=rnd(-.7,.7);z=rnd(-.7,.7)}while(x*x+z*z>.45);d.x=x;d.z=z;d.y=.8-x*x*.5}}
 // projection + tri par profondeur
 const dk=dark();ctx.clearRect(0,0,W,Hh);
 const pr=[];for(const p of P){const [x,y,z]=rot(p.x,p.y,p.z);const f=1+z*.08;pr.push([cx+x*R*f,cy-y*R*f,z,p])}
 pr.sort((a,b)=>a[2]-b[2]);
 for(const [sx,sy,z,p] of pr){let a,rr;const k=p.k;
  if(k==='shell'){a=z<0?.1+.12*(1+z):.45+.5*z;rr=(1+Math.max(0,z)*1.1)*p.s}
  else if(k==='base'){a=.3+.6*Math.max(0,(z+1)/2);rr=1.25*p.s}
  else if(k==='deep'){a=.18;rr=1.1}
  else if(k==='water'){a=.42+.4*(z+1)/2;rr=1.35}
  else if(k==='dust'){a=.5+.4*Math.sin(t*3+p.ph);rr=1.3}
  else{a=.55+.42*(z+1)/2;rr=1.45*p.s}
  let [r,g,b]=p.c;if(dk&&p.c===COL.ink){r=150;g=128;b=90}
  ctx.fillStyle=`rgba(${r},${g},${b},${a.toFixed(3)})`;ctx.beginPath();ctx.arc(sx,sy,rr,0,6.283);ctx.fill()}
 // arcs et quartiers
 for(const A of ARCP){ctx.beginPath();let pen=false;for(const q of A.pts){const [x,y,z]=rot(q[0],q[1],q[2]);const f=1+z*.08,sx=cx+x*R*f,sy=cy-y*R*f;if(z>-.05){if(!pen){ctx.moveTo(sx,sy);pen=true}else ctx.lineTo(sx,sy)}else pen=false}
  ctx.strokeStyle='rgba(242,176,0,.6)';ctx.lineWidth=1.3;ctx.stroke();
  if(!RM){const kk=((t*A.sp+A.off)%1),i=Math.floor(kk*48),q=A.pts[i],[x,y,z]=rot(q[0],q[1],q[2]);if(z>0){const f=1+z*.08;ctx.fillStyle='rgba(242,176,0,.95)';ctx.beginPath();ctx.arc(cx+x*R*f,cy-y*R*f,2.4,0,6.283);ctx.fill()}}}
 ctx.font=`500 ${Math.max(12,Math.min(17,R*.05))}px Inter, system-ui, sans-serif`;ctx.textBaseline='middle';
 for(const [name,q] of Object.entries(Q)){const [x,y,z]=rot(q[0],q[1],q[2]);if(z<.02)continue;const f=1+z*.08,sx=cx+x*R*f,sy=cy-y*R*f,al=Math.min(1,z*2.5);
  ctx.strokeStyle=`rgba(242,176,0,${.55*al})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sy,7,0,6.283);ctx.stroke();
  ctx.fillStyle=`rgba(214,158,10,${al})`;ctx.beginPath();ctx.arc(sx,sy,3.6,0,6.283);ctx.fill();
  ctx.fillStyle=dk?`rgba(255,214,120,${al})`:`rgba(176,122,0,${.95*al})`;ctx.fillText(name,sx+13,sy)}
 requestAnimationFrame(frame)}
requestAnimationFrame(frame);
window.__sph={spin:v=>{vYaw=v;idle=0},tilt:v=>{pitch=v}};
}
