// @ts-nocheck
/* Visite à 360° de la maquette : panoramas générés (lancer de rayons), visionneuse WebGL et photos déposées (IndexedDB). */
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const trText=s=>s, tr=()=>{};
const ECO={on:()=>document.documentElement.classList.contains("eco")};
let TU=()=>({});
const $=s=>document.querySelector(s);
const hsh=(a,b)=>{const x=Math.sin(a*127.1+(b||0)*311.7)*43758.5453;return x-Math.floor(x)};
const mixc=(a,b,t)=>a+(b-a)*t,cl01=x=>x<0?0:x>1?1:x;
const vnz=(x,y)=>{const i=Math.floor(x),j=Math.floor(y);let fx=x-i,fy=y-j;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);return mixc(mixc(hsh(i,j),hsh(i+1,j),fx),mixc(hsh(i,j+1),hsh(i+1,j+1),fx),fy)};
const strHash=s=>{let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%9973;return h};
const PAL=[{wall:[236,224,204],floor:[150,104,66],trim:[242,176,0]},{wall:[222,232,226],floor:[196,190,178],trim:[205,150,35]},{wall:[238,214,190],floor:[120,84,56],trim:[242,176,0]},{wall:[228,226,238],floor:[168,150,130],trim:[210,160,30]}];
const WOOD=[132,92,60],WOOD2=[98,68,46],WHITE=[240,240,236],DARK=[38,40,46];
function sceneOf(kind,seed){
  const pal=PAL[Math.floor(hsh(seed,3)*PAL.length)],sofas=[[52,86,120],[170,92,60],[80,110,84],[190,170,140]],sofa=sofas[Math.floor(hsh(seed,5)*4)];
  const sc={y0:-1.4,y1:1.2,ox:0,oz:0,hx:3,hz:2.3,boxes:[],spheres:[],ops:{e:[],w:[],n:[],s:[]},wallC:pal.wall,trim:pal.trim,floorC:pal.floor,floorT:"wood",ceilC:[247,245,239],lamp:[0.3,0.2],rug:null,out:false,tileW:null,seed};
  const B=(cx,cz,w,d,h,c,o)=>{o=o||{};sc.boxes.push({x0:cx-w/2,x1:cx+w/2,z0:cz-d/2,z1:cz+d/2,y0:sc.y0+(o.y||0),y1:sc.y0+(o.y||0)+h,c,t:o.t,e:o.e})};
  const SP=(x,y,z,r,c,e)=>sc.spheres.push({x,y:sc.y0+y,z,r,c,e:!!e});
  const W=(w,u0,u1,y0,y1,k,c)=>sc.ops[w].push({u0,u1,y0,y1,k,c});
  const chair=(x,z,c)=>{B(x,z,0.42,0.42,0.45,c||WOOD);B(x,z-0.19,0.42,0.06,0.45,c||WOOD,{y:0.45})};
  if(kind==="salon"){
    sc.hx=3;sc.hz=2.3;sc.ox=-0.3;sc.oz=-0.2;const hx=sc.hx,hz=sc.hz;sc.rug={cx:0.5,cz:0.9,rx:1.7,rz:1.2,c:[168,70,48]};
    B(0.6,hz-0.62,2.4,0.95,0.42,sofa,{t:"cush"});B(0.6,hz-0.2,2.4,0.22,0.55,sofa,{y:0.42});B(-0.6,hz-0.6,0.2,0.95,0.3,sofa,{y:0.42});B(1.8,hz-0.6,0.2,0.95,0.3,sofa,{y:0.42});
    B(0.5,0.85,1.05,0.6,0.4,WOOD2);B(-hx+0.25,0.5,0.5,1.8,0.5,WOOD);B(-hx+0.08,0.5,0.08,1.25,0.72,[16,18,24],{y:0.95,t:"screen"});
    B(hx-0.2,-0.9,0.35,1.3,2.0,WOOD2,{t:"books"});B(0.1,-1.45,1.5,0.9,0.75,WOOD);chair(-0.4,-1.0);chair(0.6,-1.0);chair(-0.4,-1.9,WOOD2);chair(0.6,-1.9,WOOD2);
    B(-hx+0.4,-hz+0.4,0.3,0.3,0.35,[150,90,60]);SP(-hx+0.4,0.78,-hz+0.4,0.38,[48,120,64]);B(hx-0.45,hz-0.45,0.05,0.05,1.5,[40,40,40]);SP(hx-0.45,1.6,hz-0.45,0.2,[255,240,200],true);
    W("e",0.2,1.9,0.9,2.2,"win");W("s",1.0,1.9,0,2.1,"door");W("n",-0.5,1.3,1.25,2.0,"art");W("w",-2.0,-1.0,1.3,2.0,"mirror");sc.lamp=[0.4,0.3]}
  else if(kind==="chambre"){
    sc.hx=2.1;sc.hz=1.8;sc.ox=0.1;sc.oz=-0.5;const hx=sc.hx,hz=sc.hz;sc.rug={cx:0,cz:0.4,rx:1.2,rz:0.9,c:[70,100,120]};
    B(0,hz-0.07,1.9,0.1,1.0,WOOD2);B(0,hz-1.1,1.7,2.0,0.35,WOOD);B(0,hz-1.1,1.62,1.94,0.2,WHITE,{y:0.35});B(0,hz-1.55,1.66,1.05,0.1,sofa,{y:0.55,t:"cush"});B(-0.42,hz-0.35,0.58,0.36,0.12,WHITE,{y:0.55});B(0.42,hz-0.35,0.58,0.36,0.12,WHITE,{y:0.55});
    B(-1.3,hz-0.3,0.45,0.4,0.5,WOOD);B(1.3,hz-0.3,0.45,0.4,0.5,WOOD);SP(-1.3,0.7,hz-0.3,0.14,[255,236,190],true);SP(1.3,0.7,hz-0.3,0.14,[255,236,190],true);
    B(hx-0.35,-0.3,0.6,1.8,2.2,WOOD2);B(-hx+0.3,-0.8,0.5,1.0,0.75,WOOD);B(-0.9,-hz+0.12,0.5,0.1,2.3,[190,150,120]);B(0.9,-hz+0.12,0.5,0.1,2.3,[190,150,120]);
    W("s",-0.7,0.7,0.9,2.2,"win");W("w",0.3,1.2,0,2.1,"door");W("e",-1.4,-0.2,1.2,1.9,"art");sc.lamp=[0,0]}
  else if(kind==="cuisine"){
    sc.hx=1.9;sc.hz=1.5;sc.ox=0;sc.oz=-0.2;sc.floorT="tile";sc.floorC=[196,190,180];const hx=sc.hx,hz=sc.hz,cab=[236,232,224];
    B(0,hz-0.35,3.7,0.7,0.9,cab);B(0,hz-0.35,3.74,0.74,0.05,[60,60,66],{y:0.9});B(-hx+0.95,hz-0.17,1.8,0.34,0.7,cab,{y:1.5});B(hx-0.4,hz-0.9,0.7,0.7,1.85,[226,228,232]);
    B(-hx+0.35,0.0,0.7,2.0,0.9,cab);B(-hx+0.35,0.0,0.74,2.04,0.05,[60,60,66],{y:0.9});B(0.2,-0.5,1.2,0.8,0.75,WOOD);chair(-0.2,-0.5,WOOD2);chair(0.6,-0.5,WOOD2);chair(0.2,-1.15,WOOD2);
    SP(0.2,0.95,-0.5,0.16,[200,60,50]);W("n",-0.2,0.9,1.0,1.9,"win");W("s",0.2,1.1,0,2.1,"door");sc.lamp=[0,0]}
  else if(kind==="bain"){
    sc.hx=1.5;sc.hz=1.2;sc.ox=0;sc.oz=-0.3;sc.floorT="tile";sc.floorC=[170,180,184];sc.tileW=[206,228,234];const hx=sc.hx,hz=sc.hz;
    B(hx-0.45,0.1,0.8,1.7,0.55,WHITE);B(hx-0.45,0.1,0.64,1.54,0.04,[190,220,235],{y:0.55,t:"water"});B(-hx+0.3,0.2,0.5,1.0,0.8,WOOD);B(-hx+0.3,0.2,0.52,0.6,0.05,WHITE,{y:0.8});B(0,-hz+0.45,0.4,0.6,0.4,WHITE);B(0,-hz+0.15,0.4,0.2,0.8,WHITE);B(-0.2,hz-0.3,0.4,0.4,0.3,[150,200,190]);
    W("w",-0.5,0.9,1.1,2.1,"mirror");W("n",-0.35,0.4,1.4,2.0,"win");W("s",-1.0,-0.2,0,2.1,"door");sc.lamp=[0,0]}
  else if(kind==="bureau"||kind==="reunion"){
    sc.hx=kind==="bureau"?4.2:3;sc.hz=kind==="bureau"?2.8:2.2;sc.ox=-0.5;sc.oz=-0.3;sc.floorT="tile";sc.floorC=[120,124,132];sc.wallC=[236,236,232];const hx=sc.hx,hz=sc.hz;
    if(kind==="bureau"){for(let r=0;r<2;r++)for(let c=0;c<3;c++){const x=-2.6+c*2.2,z=0.6+r*1.8;B(x,z,1.5,0.75,0.75,WOOD);B(x,z+0.2,0.55,0.05,0.38,DARK,{y:0.8});chair(x,z-0.7,DARK)}
      B(2.5,-1.4,2.2,0.7,1.0,WOOD2);SP(3.5,0.5,-2.2,0.45,[60,120,70]);B(3.5,-2.2,0.35,0.35,0.35,[130,130,130]);W("e",-2.0,2.0,0.8,2.2,"glass");W("n",-3.0,-0.4,1.0,2.1,"art");W("s",1.5,2.4,0,2.1,"door")}
    else{B(0,0,2.8,1.1,0.75,WOOD2);for(let i=0;i<3;i++){chair(-0.9+i*0.9,-0.95,DARK);chair(-0.9+i*0.9,0.95,DARK)}B(0,hz-0.1,2.4,0.1,1.2,[250,250,250],{y:0.9,t:"screen"});W("e",-1.4,1.4,0.8,2.2,"glass");W("s",0.8,1.7,0,2.1,"door")}
    sc.lamp=[0,0]}
  else if(kind==="boutique"||kind==="boulangerie"||kind==="coiffure"){
    sc.hx=3;sc.hz=2.3;sc.ox=0;sc.oz=-0.5;sc.floorT="tile";sc.floorC=[205,198,188];const hx=sc.hx,hz=sc.hz;
    if(kind==="boutique"){W("n",-2.8,2.8,0.4,2.2,"shelf");W("w",-2.0,2.0,0.4,2.2,"shelf");B(1.2,-0.8,2.4,0.7,1.0,WOOD2);B(1.2,-0.8,2.5,0.78,0.05,WHITE,{y:1.0});B(-1.0,0.2,1.6,0.8,0.8,WOOD,{t:"items"});B(1.2,0.9,1.4,0.7,0.8,WOOD,{t:"items"})}
    if(kind==="boulangerie"){sc.wallC=[240,226,200];B(0,0.8,3.6,0.8,1.0,[240,236,228]);B(0,0.8,3.5,0.7,0.35,[190,120,60],{y:1.0,t:"items"});B(1.0,-0.9,2.0,0.7,1.0,WOOD2);W("n",-2.8,2.8,0.6,2.2,"shelf")}
    if(kind==="coiffure"){sc.wallC=[222,226,232];W("n",-2.8,2.8,0.9,2.2,"mirror");for(let i=0;i<3;i++){const x=-1.8+i*1.8;B(x,hz-0.5,1.0,0.5,0.8,WOOD2);B(x,hz-1.4,0.6,0.6,0.5,[190,60,60]);B(x,hz-1.65,0.6,0.1,0.55,[190,60,60],{y:0.5})}B(0,-1.0,2.0,0.6,1.0,WOOD2);W("e",-1.2,1.2,0.6,2.2,"art")}
    W("s",-2.6,1.4,0,2.4,"glass");W("s",1.6,2.5,0,2.1,"door");sc.lamp=[0,0]}
  else if(kind==="salle"){
    sc.hx=4.5;sc.hz=3.0;sc.ox=-1;sc.oz=-0.5;sc.floorC=[140,98,62];const hx=sc.hx,hz=sc.hz;
    for(let r=0;r<2;r++)for(let c=0;c<3;c++){const x=-3+c*2.6,z=-0.6+r*2.0;B(x,z,0.9,0.9,0.75,[240,236,228]);chair(x-0.7,z,WOOD2);chair(x+0.7,z,WOOD2);chair(x,z-0.7,WOOD2);chair(x,z+0.7,WOOD2);SP(x,2.3,z,0.2,[255,214,140],true)}
    B(0,hz-0.4,7.5,0.8,1.1,WOOD2);B(0,hz-0.4,7.6,0.9,0.05,[60,50,44],{y:1.1});W("n",-3.5,3.5,1.4,2.3,"art");W("e",-2.0,2.0,0.8,2.2,"win");W("s",-1.0,0.2,0,2.1,"door");sc.lamp=[0,0]}
  else if(kind==="jardin"||kind==="terrain"){
    sc.out=true;sc.floorT=kind==="jardin"?"grass":"soil";sc.floorC=kind==="jardin"?[98,142,64]:[170,98,62];
    const tree=(x,z,h)=>{B(x,z,0.4,0.4,h,[110,80,56]);SP(x,h+0.2,z,2.0+hsh(x,z)*0.8,[56+Math.floor(hsh(z,x)*30),128+Math.floor(hsh(x,z)*30),64])};
    const palm=(x,z)=>{B(x,z,0.3,0.3,5.0,[140,110,76]);for(let k=0;k<5;k++){const a=k*1.2566;SP(x+Math.cos(a)*1.2,5.2,z+Math.sin(a)*1.2,0.9,[60,140,70])}};
    for(let i=0;i<14;i++){const a=i/14*6.2832+hsh(i,seed)*0.3,d=26+hsh(i,7)*14;(i%3===0)?palm(Math.sin(a)*d,Math.cos(a)*d):tree(Math.sin(a)*d,Math.cos(a)*d,3+hsh(i,2)*3)}
    for(let i=0;i<9;i++){const a=i/9*6.2832+0.4,d=55+hsh(i,11)*25,h=6+hsh(i,13)*26;B(Math.sin(a)*d,Math.cos(a)*d,8+hsh(i,17)*8,8+hsh(i,19)*8,h,[170+Math.floor(hsh(i,3)*40),168,166],{t:"facade"})}
    if(kind==="jardin"){B(0,13,16,5,5.4,[246,240,228],{t:"facade"});B(0,13,16.6,5.6,0.4,[196,98,56],{y:5.4});B(-3.2,4,4.2,2.2,0.12,[70,170,200],{t:"water"});B(-3.2,4,4.6,2.6,0.05,[240,240,236]);B(-8.5,2,0.1,12,1.4,[240,236,228]);B(8.5,2,0.1,12,1.4,[240,236,228]);B(3,2.5,1.6,0.5,0.4,WOOD2);B(3,3.4,1.6,0.5,0.4,WOOD2)}
    else{for(const [x,z] of [[-12,12.5],[12,12.5],[-12,-12.5],[12,-12.5]]){B(x,z,0.3,0.3,1.2,[246,246,246]);B(x,z,0.32,0.32,0.3,[200,40,40],{y:0.9})}B(4,8,1.6,0.1,1.2,[250,250,246],{y:0.6,t:"sign"});B(4,8,0.1,0.1,0.7,WOOD2)}}
  return sc}
/* tracé d'un panorama équirectangulaire (pièces en boîte, objets en boîtes et sphères) */
const SUN=(()=>{const x=0.45,y=0.5,z=0.74,l=Math.hypot(x,y,z);return[x/l,y/l,z/l]})();
function skyAt(dx,dy,dz,o){
  const k=Math.pow(cl01(dy),0.5);o[0]=mixc(238,86,k);o[1]=mixc(231,150,k);o[2]=mixc(214,214,k);
  if(dy>0.02){const lon=Math.atan2(dx,dz),n=vnz(lon*2.2+3,dy*7),m=cl01((n-0.52)*4);o[0]=mixc(o[0],252,m*0.8);o[1]=mixc(o[1],252,m*0.8);o[2]=mixc(o[2],252,m*0.8)}
  const d=dx*SUN[0]+dy*SUN[1]+dz*SUN[2];if(d>0.9992){o[0]=255;o[1]=250;o[2]=225}else if(d>0.96){let g=(d-0.96)/0.04;g*=g*0.55;o[0]=mixc(o[0],255,g);o[1]=mixc(o[1],246,g);o[2]=mixc(o[2],210,g)}
}
function shadeBox(sc,b,ax,sg,px,py,pz,o){
  let r=b.c[0],g=b.c[1],bl=b.c[2],f=1;
  if(b.e){o[0]=r;o[1]=g;o[2]=bl;return}
  if(ax===1&&sg>0)f=1.1;else if(ax===1)f=0.5;else if(ax===0)f=sg>0?0.74:0.82;else f=sg>0?0.9:0.8;
  const h=py-sc.y0;if(h<0.12)f*=0.78;
  const u=ax===0?pz:px,t=b.t;
  if(t==="cush"&&ax!==1){const m=Math.abs(((u*1.3)%1+1)%1-0.5);if(m>0.46)f*=0.82}
  else if(t==="screen"){if(ax===0&&sg>0){const q=cl01((h-b.y0+sc.y0)/0.75);r=mixc(20,56,q*q);g=mixc(26,70,q*q);bl=mixc(40,110,q);const dg=Math.abs((pz*3+h*3)%1-0.5);if(dg<0.08){r+=26;g+=26;bl+=26}}else if(ax===2&&b.c[0]>200){r=g=bl=250}}
  else if(t==="books"&&ax===0&&sg>0){const row=Math.floor(h/0.33),k=Math.floor(pz*14+row*3);if(h%0.33>0.03){const q=hsh(k,row);r=60+q*160;g=50+hsh(k,3)*120;bl=60+hsh(k,5)*120}else{r=70;g=48;bl=34}}
  else if(t==="items"&&ax===1&&sg>0){const k=Math.floor(px*9)+Math.floor(pz*9)*7;r=140+hsh(k,1)*110;g=110+hsh(k,2)*100;bl=90+hsh(k,3)*110}
  else if(t==="water"&&ax===1&&sg>0){const w=Math.sin(px*5+pz*3)*0.5+0.5;r=mixc(r,r*1.1,w);g=mixc(g,g*1.06,w);bl=mixc(bl,255,w*0.2);f=1.05}
  else if(t==="facade"&&ax!==1){const wx=Math.floor(u*0.6),wy=Math.floor((py-sc.y0)*0.45);if((u*0.6)%1>0.25&&(u*0.6)%1<0.75&&((py-sc.y0)*0.45)%1>0.3&&((py-sc.y0)*0.45)%1<0.8){r=50+hsh(wx,wy)*70;g=70+hsh(wx,wy)*70;bl=90+hsh(wy,wx)*80}}
  else if(t==="sign"&&ax===2){const q=Math.abs(((u*2)%1)-0.5);r=q>0.35?200:250;g=q>0.35?40:250;bl=q>0.35?40:240}
  o[0]=r*f;o[1]=g*f;o[2]=bl*f}
function shadeFloor(sc,x,z,o,far){
  const fc=sc.floorC;let r=fc[0],g=fc[1],b=fc[2],f=1;const T=sc.floorT;
  if(T==="wood"){const id=Math.floor(z/0.16),j=Math.floor((x+hsh(id,2)*1.2)/1.2);f=0.9+0.16*hsh(id,j);const q=(z/0.16)%1;if(q<0.04||q>0.97)f*=0.72}
  else if(T==="tile"){const gx=x/0.6,gz=z/0.6,fx=gx-Math.floor(gx),fz=gz-Math.floor(gz);f=((Math.floor(gx)+Math.floor(gz))&1)?1:0.93;f*=0.97+0.05*hsh(Math.floor(gx),Math.floor(gz));if(fx<0.02||fz<0.02){f=1.05;r=g=b=Math.min(255,(r+g+b)/3+20)}}
  else if(T==="grass"){const n=vnz(x*0.5,z*0.5),m=vnz(x*2.2,z*2.2);f=0.74+0.5*n+0.14*m;r=mixc(r,120,n*0.4)}
  else if(T==="soil"){const n=vnz(x*0.4+9,z*0.4),m=vnz(x*3,z*3);f=0.82+0.3*n+0.1*m;if(n>0.62){r=mixc(r,120,0.5);g=mixc(g,146,0.5);b=mixc(b,70,0.5)}}
  const rg=sc.rug;if(rg){const dx=(x-rg.cx)/rg.rx,dz=(z-rg.cz)/rg.rz,d=Math.sqrt(dx*dx+dz*dz);if(d<1){const c=rg.c;if(d>0.9){r=242;g=176;b=0}else if(d>0.8){r=c[0]*0.55;g=c[1]*0.55;b=c[2]*0.55}else{const dm=Math.abs(((dx*5)%1)-0.5)+Math.abs(((dz*4)%1)-0.5);const q=dm<0.4?1:0.82;r=c[0]*q;g=c[1]*q;b=c[2]*q}f=1}}
  if(!sc.out){const m=Math.min(sc.hx-Math.abs(x-sc.ox),sc.hz-Math.abs(z-sc.oz));f*=0.8+0.2*cl01(m/0.9)}
  if(far!=null){const k=cl01(far/95);r=mixc(r*f,238,k);g=mixc(g*f,231,k);b=mixc(b*f,214,k);o[0]=r;o[1]=g;o[2]=b;return}
  o[0]=r*f;o[1]=g*f;o[2]=b*f}
function shadeWall(sc,face,u,h,o){
  const ops=sc.ops[face==="e"?"e":face==="w"?"w":face==="n"?"n":"s"],H=sc.y1-sc.y0;
  for(let i=0;i<ops.length;i++){const p=ops[i];if(u>=p.u0&&u<=p.u1&&h>=p.y0&&h<=p.y1){
    const du=u-p.u0,dw=p.u1-p.u0,dv=h-p.y0,dh=p.y1-p.y0,e=Math.min(du,p.u1-u,dv,p.y1-h);
    if(p.k==="door"){let r=120,g=78,b=48;if(e<0.05){r=84;g=56;b=36}else{const pn=(du>0.12&&du<dw-0.12)&&((dv>0.15&&dv<dh*0.45)||(dv>dh*0.55&&dv<dh-0.15));if(pn){r*=0.82;g*=0.82;b*=0.82}if(Math.abs(du-(dw-0.14))<0.03&&Math.abs(dv-1.0)<0.03){r=242;g=176;b=0}}o[0]=r;o[1]=g;o[2]=b;return}
    if(p.k==="win"||p.k==="glass"){if(e<(p.k==="win"?0.06:0.04)){o[0]=o[1]=o[2]=246;return}
      const v=dv/dh;let r=mixc(236,130,v),g=mixc(240,190,v),b=mixc(244,236,v);const sk=Math.floor(du*7);if(v<0.3+0.18*hsh(sk,2)){r=mixc(r,70,0.7);g=mixc(g,110,0.6);b=mixc(b,80,0.7)}
      if(p.k==="win"&&(Math.abs(du-dw/2)<0.025||Math.abs(v-0.5)<0.012)){o[0]=o[1]=o[2]=244;return}
      if(p.k==="glass"){const sh=Math.abs(((du*0.8+dv*0.8)%1)-0.5);if(sh<0.05){r+=22;g+=22;b+=22}}
      o[0]=r;o[1]=g;o[2]=b;return}
    if(p.k==="mirror"){if(e<0.04){o[0]=60;o[1]=48;o[2]=40;return}const s=Math.abs(((du*0.9+dv*0.6)%1)-0.5);const k=s<0.1?1:0;o[0]=196+k*50;o[1]=222+k*30;o[2]=232+k*20;return}
    if(p.k==="art"){if(e<0.05){o[0]=52;o[1]=40;o[2]=30;return}const k=Math.floor(du*4)+Math.floor(dv*4)*5,q=hsh(k,sc.seed);const pc=[[242,176,0],[170,70,48],[52,86,120],[236,230,214],[60,120,84]][Math.floor(q*5)];o[0]=pc[0];o[1]=pc[1];o[2]=pc[2];return}
    if(p.k==="shelf"){const row=Math.floor(dv/0.42);if(dv%0.42<0.03){o[0]=96;o[1]=66;o[2]=44;return}const k=Math.floor(du*10),q=hsh(k,row+sc.seed);const pc=[[200,60,60],[60,100,170],[236,200,60],[70,150,90],[230,230,225],[150,80,160]][Math.floor(q*6)];const hh=0.15+0.25*hsh(k,row);if((dv%0.42)<0.03+hh){o[0]=pc[0];o[1]=pc[1];o[2]=pc[2]}else{o[0]=214;o[1]=204;o[2]=188}return}
  }}
  let r=sc.wallC[0],g=sc.wallC[1],b=sc.wallC[2],f=1;
  if(sc.tileW&&h<1.7){const gx=Math.floor(u/0.3),gy=Math.floor(h/0.3),eu=(u/0.3)-gx,ev=(h/0.3)-gy;r=sc.tileW[0];g=sc.tileW[1];b=sc.tileW[2];f=0.96+0.06*hsh(gx,gy);if(eu<0.04||ev<0.04){f=1.04;r=g=b=240}}
  else{if(h<0.12){f=0.72}else if(h<0.14){f=0.9}
    const top=H-h;if(top>0.18&&top<0.28){const tri=Math.abs(((u*5)%1+1)%1-0.5)*2;if(top<0.18+0.1*(1-tri)){r=sc.trim[0];g=sc.trim[1];b=sc.trim[2]}}}
  const wd=face==="n"||face==="s"?sc.hx:sc.hz,m=Math.min(u+wd,wd-u);f*=(0.8+0.2*cl01(m/0.8))*(0.9+0.1*cl01((H-h)/0.5))*(face==="n"?1:face==="s"?0.9:face==="e"?0.86:0.94);
  o[0]=r*f;o[1]=g*f;o[2]=b*f}
const PO=[0,0,0];
function traceRay(sc,dx,dy,dz,o){
  const ox=sc.ox,oz=sc.oz,y0=sc.y0,y1=sc.y1;let t=1e9,face=0;
  if(!sc.out){
    if(dx>1e-7){const k=(sc.hx-ox)/dx;if(k<t){t=k;face=1}}else if(dx<-1e-7){const k=(-sc.hx-ox)/dx;if(k<t){t=k;face=2}}
    if(dz>1e-7){const k=(sc.hz-oz)/dz;if(k<t){t=k;face=3}}else if(dz<-1e-7){const k=(-sc.hz-oz)/dz;if(k<t){t=k;face=4}}
    if(dy>1e-7){const k=y1/dy;if(k<t){t=k;face=6}}else if(dy<-1e-7){const k=y0/dy;if(k<t){t=k;face=5}}
  }else if(dy<-1e-7){t=y0/dy;face=5;if(t>140){t=1e9;face=0}}
  let bt=t,bi=-1,bax=0,bsg=0,si=-1;const bx=sc.boxes,nb=bx.length;
  for(let i=0;i<nb;i++){const b=bx[i];let t0=-1e9,t1=1e9,ax=-1,sg=0;
    if(dx!==0){let a=(b.x0-ox)/dx,c=(b.x1-ox)/dx,s=-1;if(a>c){const q=a;a=c;c=q;s=1}if(a>t0){t0=a;ax=0;sg=s}if(c<t1)t1=c}else if(ox<b.x0||ox>b.x1)continue;
    if(dy!==0){let a=b.y0/dy,c=b.y1/dy,s=-1;if(a>c){const q=a;a=c;c=q;s=1}if(a>t0){t0=a;ax=1;sg=s}if(c<t1)t1=c}else if(0<b.y0||0>b.y1)continue;
    if(dz!==0){let a=(b.z0-oz)/dz,c=(b.z1-oz)/dz,s=-1;if(a>c){const q=a;a=c;c=q;s=1}if(a>t0){t0=a;ax=2;sg=s}if(c<t1)t1=c}else if(oz<b.z0||oz>b.z1)continue;
    if(t0<=t1&&t1>0&&t0>1e-6&&t0<bt){bt=t0;bi=i;bax=ax;bsg=sg}}
  const sp=sc.spheres,ns=sp.length;
  for(let i=0;i<ns;i++){const s=sp[i],cx=ox-s.x,cy=-s.y,cz=oz-s.z,bb=cx*dx+cy*dy+cz*dz,c=cx*cx+cy*cy+cz*cz-s.r*s.r,d=bb*bb-c;if(d>0){const k=-bb-Math.sqrt(d);if(k>1e-6&&k<bt){bt=k;si=i;bi=-1}}}
  if(si>=0){const s=sp[si];if(s.e){o[0]=s.c[0];o[1]=s.c[1];o[2]=s.c[2]}else{const px=ox+dx*bt-s.x,py=dy*bt-s.y,pz=oz+dz*bt-s.z,nl=Math.max(0.35,(px*SUN[0]+py*SUN[1]+pz*SUN[2])/s.r*0.5+0.6);o[0]=s.c[0]*nl;o[1]=s.c[1]*nl;o[2]=s.c[2]*nl}return}
  if(bi>=0){const px=ox+dx*bt,py=dy*bt,pz=oz+dz*bt;shadeBox(sc,bx[bi],bax,bsg,px,py,pz,o);if(sc.out){const k=cl01(bt/110);o[0]=mixc(o[0],238,k);o[1]=mixc(o[1],231,k);o[2]=mixc(o[2],214,k)}return}
  if(face===0){skyAt(dx,dy,dz,o);return}
  const px=ox+dx*t,py=dy*t,pz=oz+dz*t;
  if(face===5){shadeFloor(sc,px,pz,o,sc.out?t:null);return}
  if(face===6){const lx=px-sc.lamp[0],lz=pz-sc.lamp[1],d=Math.sqrt(lx*lx+lz*lz);let f=0.96;if(d<0.3){o[0]=255;o[1]=250;o[2]=228;return}f+=0.1*Math.exp(-d*1.1);const m=Math.min(sc.hx-Math.abs(px-ox),sc.hz-Math.abs(pz-oz));f*=0.86+0.14*cl01(m/0.5);o[0]=sc.ceilC[0]*f;o[1]=sc.ceilC[1]*f;o[2]=sc.ceilC[2]*f;return}
  if(face===1)shadeWall(sc,"e",pz,py-y0,o);else if(face===2)shadeWall(sc,"w",pz,py-y0,o);else if(face===3)shadeWall(sc,"n",px,py-y0,o);else shadeWall(sc,"s",px,py-y0,o)}
async function panoCanvas(sc,W,H,onP){
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;const cx=cv.getContext("2d"),img=cx.createImageData(W,H),px=img.data,o=[0,0,0];
  for(let j=0;j<H;j++){const lat=(0.5-(j+0.5)/H)*Math.PI,cl=Math.cos(lat),sl=Math.sin(lat);
    for(let i=0;i<W;i++){const lon=((i+0.5)/W)*6.283185307-Math.PI;traceRay(sc,cl*Math.sin(lon),sl,cl*Math.cos(lon),o);const k=(j*W+i)*4,n=(hsh(i,j)-0.5)*3;px[k]=o[0]+n;px[k+1]=o[1]+n;px[k+2]=o[2]+n;px[k+3]=255}
    if(j%32===31){if(onP)onP((j+1)/H);await new Promise(r=>setTimeout(r,0))}}
  cx.putImageData(img,0,0);return cv}
/* ---------- scènes d'un bien ---------- */
function tourPlan(p){
  const T=(p.title||"").toLowerCase();
  if(p.type==="Terrain")return [["Terrain","terrain"]];
  if(p.type==="Villa")return [["Salon","salon"],["Chambre","chambre"],["Cuisine","cuisine"],["Salle de bain","bain"],["Jardin","jardin"]];
  if(p.mode==="Colocation")return [["Chambre","chambre"],["Cuisine partagée","cuisine"]];
  if(p.type==="Studio")return [["Pièce de vie","salon"],["Cuisine","cuisine"],["Salle de bain","bain"]];
  if(p.type==="Bureau")return [["Plateau","bureau"],["Salle de réunion","reunion"]];
  if(p.type==="Boutique")return [["Boutique","boutique"]];
  if(p.type==="Fonds de commerce"){if(/restaur/.test(T))return [["Salle","salle"],["Cuisine","cuisine"]];if(/coiff/.test(T))return [["Salon","coiffure"]];if(/boulang/.test(T))return [["Boutique","boulangerie"],["Fournil","cuisine"]];return [["Local","boutique"]]}
  const l=[["Salon","salon"],["Chambre","chambre"],["Cuisine","cuisine"]];if((p.rooms||0)>=2)l.push(["Salle de bain","bain"]);return l}
const tourScenes=p=>{const up=TU()[p.ref]||[];return up.length?up.map(x=>({label:x.label,up:x.id})):tourPlan(p).map(([label,kind])=>({label,kind}))};
/* stockage des photos déposées (IndexedDB, avec repli en mémoire) */
const PANO_MEM={};
const IDBX={db:null,async open(){if(this.db)return this.db;return new Promise(res=>{try{const q=indexedDB.open("immobell360",1);q.onupgradeneeded=()=>q.result.createObjectStore("pano");q.onsuccess=()=>{this.db=q.result;res(this.db)};q.onerror=()=>res(null)}catch(e){res(null)}})},
  async put(k,v){PANO_MEM[k]=v;const d=await this.open();if(!d)return false;return new Promise(r=>{try{const t=d.transaction("pano","readwrite");t.objectStore("pano").put(v,k);t.oncomplete=()=>r(true);t.onerror=()=>r(false)}catch(e){r(false)}})},
  async get(k){if(PANO_MEM[k])return PANO_MEM[k];const d=await this.open();if(!d)return null;return new Promise(r=>{try{const q=d.transaction("pano").objectStore("pano").get(k);q.onsuccess=()=>r(q.result||null);q.onerror=()=>r(null)}catch(e){r(null)}})},
  async del(k){delete PANO_MEM[k];const d=await this.open();if(!d)return;try{d.transaction("pano","readwrite").objectStore("pano").delete(k)}catch(e){}}};
/* ---------- visionneuse ---------- */
const VS="attribute vec2 a;varying vec2 uv;void main(){uv=a*0.5+0.5;gl_Position=vec4(a,0.,1.);}";
const FS="#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nvarying vec2 uv;uniform sampler2D tx;uniform float yaw,pit,tf,asp;void main(){vec2 p=uv*2.-1.;vec3 d=normalize(vec3(p.x*asp*tf,p.y*tf,1.));float cp=cos(pit),sp=sin(pit);d=vec3(d.x,d.y*cp+d.z*sp,-d.y*sp+d.z*cp);float cy=cos(yaw),sy=sin(yaw);d=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);float lon=atan(d.x,d.z),lat=asin(clamp(d.y,-1.,1.));gl_FragColor=texture2D(tx,vec2(lon/6.2831853+.5,.5-lat/3.1415927));}";
const stillMode=()=>document.documentElement.classList.contains("still")||(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
class Pano{
  constructor(cv,onUser){this.cv=cv;this.onUser=onUser||(()=>{});this.yaw=0;this.pit=0;this.fov=1.15;this.vy=0;this.vp=0;this.auto=!stillMode();this.vis=true;this.dirty=true;this.src=null;this.run=false;this.last=0;this.ptr=new Map();this.pinch=0;this.dead=false;
    let gl=null;try{gl=cv.getContext("webgl",{antialias:false,alpha:false,powerPreference:"low-power"})||cv.getContext("experimental-webgl")}catch(e){}
    this.gl=gl;if(gl)this.initGL();else this.c2=cv.getContext("2d");
    cv.addEventListener("webglcontextlost",e=>{e.preventDefault()});cv.addEventListener("webglcontextrestored",()=>{this.initGL();if(this.src)this.upload();this.dirty=true;this.kick()});
    this.bind()}
  initGL(){const gl=this.gl,sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x},pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);this.pr=pr;
    const bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(pr,"a");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    this.u={yaw:gl.getUniformLocation(pr,"yaw"),pit:gl.getUniformLocation(pr,"pit"),tf:gl.getUniformLocation(pr,"tf"),asp:gl.getUniformLocation(pr,"asp")};this.tex=gl.createTexture()}
  setSource(s){this.src=s;if(this.gl)this.upload();this.dirty=true;this.kick()}
  upload(){const gl=this.gl;let s=this.src;const mx=gl.getParameter(gl.MAX_TEXTURE_SIZE);if(s.width>mx){const c=document.createElement("canvas");c.width=mx;c.height=mx/2;c.getContext("2d").drawImage(s,0,0,c.width,c.height);s=c}
    gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,s)}
  resize(){const r=this.cv.parentElement.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,1.5),w=Math.max(2,Math.round(r.width*d)),h=Math.max(2,Math.round(r.height*d));if(this.cv.width!==w||this.cv.height!==h){this.cv.width=w;this.cv.height=h;if(this.gl)this.gl.viewport(0,0,w,h)}this.dirty=true;this.kick()}
  draw(){if(!this.src||this.dead)return;const cv=this.cv,asp=cv.width/cv.height,tf=Math.tan(this.fov/2);
    if(this.gl){const gl=this.gl;if(gl.isContextLost())return;gl.viewport(0,0,cv.width,cv.height);gl.uniform1f(this.u.yaw,this.yaw);gl.uniform1f(this.u.pit,this.pit);gl.uniform1f(this.u.tf,tf);gl.uniform1f(this.u.asp,asp);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}
    else{const c=this.c2,S0=this.src,W=S0.width,H=S0.height,sw=Math.min(W,W*(this.fov*asp)/6.2832),sh=H*this.fov/Math.PI;let sx=((this.yaw/6.2832)+0.5)*W-sw/2;const sy=Math.max(0,Math.min(H-sh,(0.5-this.pit/Math.PI)*H-sh/2));
      c.clearRect(0,0,cv.width,cv.height);if(sx<0){const w1=-sx/sw*cv.width;c.drawImage(S0,W+sx,sy,-sx,sh,0,0,w1,cv.height);c.drawImage(S0,0,sy,sw+sx,sh,w1,0,cv.width-w1,cv.height)}else if(sx+sw>W){const w1=(W-sx)/sw*cv.width;c.drawImage(S0,sx,sy,W-sx,sh,0,0,w1,cv.height);c.drawImage(S0,0,sy,sw-(W-sx),sh,w1,0,cv.width-w1,cv.height)}else c.drawImage(S0,sx,sy,sw,sh,0,0,cv.width,cv.height)}
    this.dirty=false}
  kick(){if(this.run||this.dead)return;this.run=true;this.last=performance.now();requestAnimationFrame(t=>this.loop(t))}
  loop(t){if(this.dead){this.run=false;return}const dt=Math.min(0.05,(t-this.last)/1000||0.016);this.last=t;
    if(!this.vis||document.hidden){this.run=false;return}
    const dragging=this.ptr.size>0;let mv=false;
    if(!dragging&&(Math.abs(this.vy)>1e-4||Math.abs(this.vp)>1e-4)){this.yaw+=this.vy*dt;this.pit=Math.max(-1.45,Math.min(1.45,this.pit+this.vp*dt));const k=Math.exp(-4*dt);this.vy*=k;this.vp*=k;mv=true}
    if(this.auto&&!dragging&&!stillMode()){this.yaw+=0.07*dt;mv=true}
    if(mv||this.dirty)this.draw();
    if(mv||dragging||this.dirty)requestAnimationFrame(t2=>this.loop(t2));else this.run=false}
  bind(){const cv=this.cv,self=this;
    cv.addEventListener("pointerdown",e=>{cv.setPointerCapture(e.pointerId);self.ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});self.vy=self.vp=0;self.pinch=self.ptr.size===2?self.dist():0;if(self.auto){self.auto=false;self.onUser()}});
    cv.addEventListener("pointermove",e=>{const p=self.ptr.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
      if(self.ptr.size===2){const d=self.dist();if(self.pinch){self.fov=Math.max(0.5,Math.min(1.9,self.fov*self.pinch/d))}self.pinch=d}
      else{const k=self.fov/(cv.clientHeight||300);self.yaw-=dx*k;self.pit=Math.max(-1.45,Math.min(1.45,self.pit+dy*k));self.vy=-dx*k*40;self.vp=dy*k*40}
      self.dirty=true;self.kick()});
    const up=e=>{self.ptr.delete(e.pointerId);self.pinch=0;self.kick()};cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
    cv.addEventListener("wheel",e=>{e.preventDefault();self.zoom(Math.exp(e.deltaY*0.0012));if(self.auto){self.auto=false;self.onUser()}},{passive:false});
    cv.addEventListener("keydown",e=>{const k=e.key,s=0.12*self.fov;let h=true;if(k==="ArrowLeft")self.yaw-=s;else if(k==="ArrowRight")self.yaw+=s;else if(k==="ArrowUp")self.pit=Math.min(1.45,self.pit+s);else if(k==="ArrowDown")self.pit=Math.max(-1.45,self.pit-s);else if(k==="+"||k==="=")self.zoom(0.88);else if(k==="-"||k==="_")self.zoom(1.14);else if(k==="Home"){self.yaw=0;self.pit=0;self.fov=1.15}else h=false;if(h){e.preventDefault();if(self.auto){self.auto=false;self.onUser()}self.dirty=true;self.kick()}})}
  dist(){const a=[...this.ptr.values()];return a.length<2?0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}
  zoom(f){this.fov=Math.max(0.5,Math.min(1.9,this.fov*f));this.dirty=true;this.kick()}
  destroy(){this.dead=true;try{const x=this.gl&&this.gl.getExtension("WEBGL_lose_context");x&&x.loseContext()}catch(e){}}}
const TOUR={on:false,ref:null,host:null,v:null,i:0,scenes:[],cache:new Map(),gen:0};
function tourPoster(p){return `<div class="tour-poster"><div class="tp-art" aria-hidden="true"><svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3"><circle cx="60" cy="60" r="46"/><ellipse cx="60" cy="60" rx="46" ry="16"/><ellipse cx="60" cy="60" rx="16" ry="46"/><path d="M14 60h92M60 14v92" stroke-width="1.5"/></svg></div><div class="tp-body"><b style="font-size:1.1rem">Visitez ce bien sans vous déplacer</b><p class="small muted">Regardez dans toutes les directions, pièce par pièce. Le chargement ne démarre qu'au clic, pour économiser votre connexion.</p><div><button class="btn gold" data-tour="${p.ref}">Lancer la visite 360°</button></div><p class="small muted">${(TU()[p.ref]||[]).length?"Photos 360° déposées par le propriétaire.":"Panoramas d'exemple générés pour la démonstration."}</p></div></div>`}
function tourKill(){if(TOUR.v){TOUR.v.destroy();TOUR.v=null}if(TOUR.host){TOUR.host.remove();TOUR.host=null}TOUR.on=false;TOUR.gen++}
function tourSync(){
  const slot=$("#tour-slot");
    if(TOUR.on&&TOUR.ref!==UI.ref){tourKill();return}
  if(!TOUR.on)return;
  if(!TOUR.host)tourBuild(slot);else if(TOUR.host.parentNode!==slot){slot.replaceChildren(TOUR.host);TOUR.v&&TOUR.v.resize()}}
function tourBuild(slot){
  const p=TOUR.p;if(!p)return;TOUR.scenes=tourScenes(p);TOUR.i=0;
  const h=document.createElement("div");h.className="tour-host";h.setAttribute("role","group");h.setAttribute("aria-label","Visite à 360° de "+p.title);
  h.innerHTML=`<div class="tour-stage"><canvas tabindex="0" aria-label="Visite à 360° : glissez pour regarder autour de vous, flèches du clavier pour tourner, plus et moins pour zoomer"></canvas><div class="tour-load" role="status">Préparation de la visite…</div></div><div class="tour-bar"><div class="tour-scenes" role="tablist" aria-label="Pièces"></div><div class="tour-tools"><button type="button" data-tt="rot" aria-pressed="false">Rotation auto</button><button type="button" data-tt="zi" aria-label="Zoom avant">+</button><button type="button" data-tt="zo" aria-label="Zoom arrière">−</button><button type="button" data-tt="big" aria-pressed="false">Plein écran</button></div></div>`;
  TOUR.host=h;slot.replaceChildren(h);
  const cv=h.querySelector("canvas"),sc=h.querySelector(".tour-scenes");
  sc.innerHTML=TOUR.scenes.map((s,i)=>`<button type="button" role="tab" data-ts="${i}" aria-selected="${i===0}">${esc(s.label)}</button>`).join("");
  const rot=h.querySelector('[data-tt="rot"]'),sync=()=>rot.setAttribute("aria-pressed",String(!!(TOUR.v&&TOUR.v.auto&&!stillMode())));
  const v=new Pano(cv,sync);TOUR.v=v;sync();
  h.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.ts!=null){tourShow(+b.dataset.ts);return}
    const k=b.dataset.tt;if(k==="rot"){v.auto=!v.auto;sync();v.kick()}else if(k==="zi")v.zoom(0.85);else if(k==="zo")v.zoom(1.18);else if(k==="big"){const on=h.classList.toggle("big");b.setAttribute("aria-pressed",String(on));document.body.classList.toggle("lock",on);setTimeout(()=>v.resize(),30)}});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&TOUR.host===h&&h.classList.contains("big")){e.stopPropagation();h.querySelector('[data-tt="big"]').click()}},true);
  if(window.ResizeObserver)new ResizeObserver(()=>{TOUR.v===v&&v.resize()}).observe(cv.parentElement);
  if(window.IntersectionObserver)new IntersectionObserver(es=>{v.vis=es[0].isIntersecting;if(v.vis)v.kick()},{threshold:0.05}).observe(h);
  tr(h);tourShow(0)}
async function tourShow(i){
  const h=TOUR.host,v=TOUR.v,p=TOUR.p;if(!h||!v||!p)return;const sc=TOUR.scenes[i];if(!sc)return;TOUR.i=i;const g=++TOUR.gen,ld=h.querySelector(".tour-load");
  h.querySelectorAll("[data-ts]").forEach((b,k)=>b.setAttribute("aria-selected",String(k===i)));
  const key=sc.up?TOUR.ref+"|"+sc.up:TOUR.ref+"|"+sc.kind;let src=TOUR.cache.get(key);
  if(!src){ld.hidden=false;ld.textContent=trText("Préparation de "+sc.label.toLowerCase()+"…");
    try{if(sc.up){const bl=await IDBX.get(TOUR.ref+"|"+sc.up);if(bl)src=await createImageBitmap(bl)}
      if(!src){const spec=sceneOf(sc.kind||"salon",strHash(p.ref));src=await panoCanvas(spec,ECO.on()?1280:2048,ECO.on()?640:1024,f=>{if(g===TOUR.gen)ld.textContent=trText("Préparation de "+sc.label.toLowerCase()+" : "+Math.round(f*100)+" %")})}}catch(e){ld.textContent="Cette pièce n'a pas pu être chargée.";return}
    TOUR.cache.set(key,src);if(TOUR.cache.size>8)TOUR.cache.delete(TOUR.cache.keys().next().value)}
  if(g!==TOUR.gen||!TOUR.host)return;
  v.yaw=sc.up?0:Math.PI*0.1*i;v.pit=0;v.setSource(src);ld.hidden=true;ld.textContent=""}

/** Monte la visionneuse dans `slot` pour le bien `p`. `getUploads` renvoie les photos déposées { ref: [{id,label}] }. */
export function mountTour(slot,p,getUploads){
  TU=getUploads;tourKill();TOUR.on=true;TOUR.ref=p.ref;TOUR.p=p;tourBuild(slot);
  const h=TOUR.host;h&&h.querySelector("canvas").focus({preventScroll:true});
}
export function unmountTour(){tourKill()}
export function forgetTourCache(ref){for(const k of [...TOUR.cache.keys()])if(k.startsWith(ref+"|"))TOUR.cache.delete(k)}
export {IDBX};
