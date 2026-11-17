/* PurpleVolt · módulo Diseñador: armado manual del riel DIN sobre el modelo común (store.comp).
   Escribe componentes con rol general|dif|circ y sin auto (los de Tablero son auto:true y no se tocan).
   Posición en celdas de 20 px: x = 2 + 2·módulos usados en el riel, y = 2 + 10·riel (mismo criterio que lee Vista 3D).
   Criterio de carga (NO es norma): Ib = W / 220; simultaneidad 0,7 para la general. Cables de referencia, sin validar. */
(function(g){
const f=(n,d=1)=>(+n).toFixed(d).replace('.',',').replace(/,0+$/,''),
esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CAJA_PPAL='genrod-12',CAJA_SUB='genrod-4508',W=52,TEN=220,SIM=.7,STD=[6,10,16,20,25,32,40,50,63];
const USOS={IUG:['Iluminación',10,1500],TUG:['Tomas',16,2500],ACU:['Aire acond.',20,3000],TUE:['Cocina eléctrica',25,5000]};
const sec=a=>a<=10?1.5:a<=20?2.5:a<=25?4:6;
// nomenclatura profesional: ITM <polos>P <curva><In> y, al final, el uso (IUG, TUG, ACU, TUE o el subtablero que alimenta)
const nom=c=>{const p=c.p||{};if(p.nombre)return String(p.nombre);const u=p.uso||p.alim||'';return 'ITM '+Math.round(num(p.polos,1))+'P '+(p.curva||'C')+num(p.in,0)+(u?' · '+u:'')};
const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:d;
const propio=c=>!c.auto&&(c.rol==='general'||c.rol==='dif'||c.rol==='circ');
const ancho=c=>c.rol==='dif'?2:Math.max(1,Math.min(2,Math.round(num(c.p&&c.p.polos,1))));
const tab=c=>c.p&&typeof c.p.tab==='string'?c.p.tab:'';
const subs=m=>{const o=[];m.comp.forEach(c=>{if(propio(c)&&c.p)[c.p.alim,tab(c)].forEach(x=>{if(typeof x==='string'&&x&&!o.includes(x))o.push(x)})});return o};
const tabs=m=>[''].concat(subs(m));
const alim=(m,t)=>m.comp.find(c=>propio(c)&&c.p&&c.p.alim===t);
const lista=(m,t)=>m.comp.filter(c=>propio(c)&&(t===undefined||tab(c)===t)).sort((a,b)=>num(a.y,0)-num(b.y,0)||num(a.x,0)-num(b.x,0));
const titulo=(m,t)=>{if(!t)return'Tablero principal';const a=alim(m,t);return(a&&a.p.nombre)||'Subtablero '+t.replace(/^S/,'')};
const ib=c=>num(c.p&&c.p.w,0)/TEN;
const tot=L=>L.reduce((a,c)=>a+(c.p&&c.p.alim?ib(c):ib(c)*SIM),0);
const opc=(cat,id)=>cat.tipos.find(t=>t.id===id).p.in.opc.slice().sort((a,b)=>a-b);
// la alimentadora de un subtablero lleva la carga simultánea de lo que cuelga de él
function sync(m){subs(m).forEach(t=>{const a=alim(m,t);if(a)a.p.w=Math.round(tot(lista(m,t).filter(c=>c.rol==='circ'))*TEN)})}
function ordenar(m,cap){sync(m);let r=0,any=false;tabs(m).forEach(t=>{const L=lista(m,t);if(!L.length)return;const cp=typeof cap==='function'?cap(t):cap;let off=0;if(any)r++;any=true;L.forEach(c=>{const w=ancho(c);if(off+w>cp&&off>0){r++;off=0}c.x=2+off*2;c.y=2+r*10;off+=w})});return r+1}
const def=(cat,t)=>{const p={};for(const[a,v]of Object.entries(cat.tipos.find(q=>q.id===t).p))p[a]=v.def;return p};
function nuevo(cat,k,t){const id=g.Volt.uid('k');let c;
if(k==='general')c={id,tipo:'termica',x:1e6,y:1e6,rol:'general',p:Object.assign(def(cat,'termica'),{in:40,polos:2})};
else if(k==='dif')c={id,tipo:'diferencial',x:1e6,y:1e6,rol:'dif',p:Object.assign(def(cat,'diferencial'),{in:40,idn:30})};
else{const u=USOS[k];c={id,tipo:'termica',x:1e6,y:1e6,rol:'circ',p:Object.assign(def(cat,'termica'),{in:u[1],polos:1,uso:k,w:u[2]})}}
if(t)c.p.tab=t;return c}
function nuevoSub(cat,m){let n=1;while(subs(m).includes('S'+n))n++;const t='S'+n,id=g.Volt.uid('k');
return[{id,tipo:'termica',x:1e6,y:1e6,rol:'circ',p:Object.assign(def(cat,'termica'),{in:25,polos:2,w:0,alim:t})},
{id:g.Volt.uid('k'),tipo:'termica',x:1e6,y:1e6,rol:'general',p:Object.assign(def(cat,'termica'),{in:25,polos:2,tab:t,caja:CAJA_SUB})}]}
function verificar(m,bx){const o=[],pad=i=>String(i+1).padStart(2,'0'),hay=lista(m).length;
if(!lista(m,'').find(c=>c.rol==='general'))o.push(['bad','Falta la térmica general.']);
const D0=lista(m,'').find(c=>c.rol==='dif');if(!D0)o.push(['bad','Falta el diferencial.']);
tabs(m).forEach(t=>{const L=lista(m,t);if(t&&!L.length)return;const G=L.find(c=>c.rol==='general'),D=L.find(c=>c.rol==='dif'),cs=L.filter(c=>c.rol==='circ'),P=t?titulo(m,t)+': ':'',a=t&&alim(m,t);
if(t&&!G)o.push(['bad',P+'falta la térmica de entrada.']);
if(bx&&L.length){const B=bx(t),rs=L.map(c=>Math.round((num(c.y,2)-2)/10)),R=Math.max(...rs)-Math.min(...rs)+1;if(R>B.filas)o.push(['bad',P+(P?'no':'No')+' entra en la caja ('+B.nombre+', '+B.cap*B.filas+' módulos): necesita '+R+' riel(es). Elegí una caja más grande.'])}
if(t&&!a)o.push(['bad',P+'ninguna térmica del tablero principal lo alimenta.']);
if(D&&num(D.p.idn,30)>30)o.push(['bad',P+'El diferencial debería ser de 30 mA para uso general en vivienda.']);
if(G&&D&&D.p.in<G.p.in)o.push(['bad',P+'El diferencial ('+D.p.in+' A) es menor que la general ('+G.p.in+' A).']);
cs.forEach((c,i)=>{const n=P+'Circuito '+pad(i)+': ';if(G&&c.p.in>G.p.in)o.push(['bad',n+'la térmica ('+c.p.in+' A) supera a la '+(t?'de entrada':'general')+'.']);
if(ib(c)>c.p.in)o.push(['bad',n+'la carga ('+f(ib(c))+' A) supera la térmica de '+c.p.in+' A.'])});
const x=tot(cs);if(G&&x>0)o.push([x>G.p.in?'bad':'ok',P+'Corriente estimada con simultaneidad 0,7: '+f(x)+' A. '+(t?'Entrada':'General')+': '+G.p.in+' A.']);
if(a&&G){if(G.p.in>a.p.in)o.push(['bad',P+'la entrada ('+G.p.in+' A) supera la térmica que lo alimenta ('+a.p.in+' A).']);
else if(G.p.in===a.p.in)o.push(['wrn',P+'misma corriente que su alimentadora: no hay selectividad. Conviene un escalón más en la alimentadora.']);
else o.push(['ok',P+'selectividad: alimentadora de '+a.p.in+' A, entrada de '+G.p.in+' A.'])}
if(t&&!D&&D0)o.push(['mu',P+'queda aguas abajo del diferencial principal.'])});
if(!hay)o.push(['mu','Todavía no hay equipos. Agregalos con los botones de arriba.']);
o.push(['mu','Secciones de referencia para cobre, sin validar. No reemplaza la verificación de un matriculado (AEA 90364).']);return o}
function ajustar(m,cat){const OD=cat?opc(cat,'diferencial'):STD;
subs(m).forEach(t=>{const L=lista(m,t),cs=L.filter(c=>c.rol==='circ');cs.forEach(c=>{if(ib(c)>0)c.p.in=STD.find(s=>s>=ib(c))||63});
const x=tot(cs);if(!(x>0))return;const gi=STD.find(s=>s>=Math.max(x,10))||63;
L.forEach(c=>{if(c.rol==='general')c.p.in=gi;if(c.rol==='dif')c.p.in=OD.find(s=>s>=gi)||OD[OD.length-1]});
const a=alim(m,t);if(a)a.p.in=STD.find(s=>s>gi)||gi});
sync(m);
const L=lista(m,''),cs=L.filter(c=>c.rol==='circ');
cs.forEach(c=>{if(ib(c)>0)c.p.in=Math.max(STD.find(s=>s>=ib(c))||63,c.p.alim?c.p.in:0)});
const t=tot(cs);if(!(t>0))return;const gi=STD.find(s=>s>=Math.max(t,25))||63;
L.forEach(c=>{if(c.rol==='general')c.p.in=gi;if(c.rol==='dif')c.p.in=OD.find(s=>s>=gi)||OD[OD.length-1]})}
function wrap(s,n){const o=[];let l='';s.split(' ').forEach(w=>{if((l+' '+w).trim().length>n&&l){o.push(l);l=w}else l=(l+' '+w).trim()});if(l)o.push(l);return o.slice(0,4)}
// Térmica modular estándar (IEC 60898 / DIN 43880, la que se vende en Argentina): 18 mm por polo, 90 mm de alto, frente de 45 mm centrado, 70 mm de fondo
const K=W/18,H=Math.round(90*K),FR=Math.round(45*K),FY=(H-FR)/2,TS=32,BLK=378,BL=48,BN=62,BY=74,CAPH=44,GAP=36;
const DEFS='<defs><linearGradient id="dzpl" x1="0" x2="1"><stop offset="0" stop-color="#d6d6cf"/><stop offset=".16" stop-color="#fcfcf9"/><stop offset=".82" stop-color="#f0f0eb"/><stop offset="1" stop-color="#cbcbc3"/></linearGradient><linearGradient id="dzrl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef0f3"/><stop offset=".5" stop-color="#b4b9c1"/><stop offset="1" stop-color="#8b9199"/></linearGradient><radialGradient id="dzmt" cx=".4" cy=".35"><stop offset="0" stop-color="#f6f6f6"/><stop offset="1" stop-color="#868b93"/></radialGradient><linearGradient id="dzbx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6e8ec"/><stop offset="1" stop-color="#c0c3c9"/></linearGradient><linearGradient id="dzcr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e5443a"/><stop offset="1" stop-color="#a01f18"/></linearGradient><linearGradient id="dzcb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4da3ee"/><stop offset="1" stop-color="#1b63b0"/></linearGradient><pattern id="dzsl" width="108" height="101" patternUnits="userSpaceOnUse"><rect x="18" y="43" width="72" height="15" rx="7.5" fill="#3c4048"/><rect x="18" y="43" width="72" height="5" rx="2.5" fill="#23262b"/></pattern></defs>';
const scr=(x,y,r=9)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#dzmt)" stroke="#656a72"/><path d="M${x-r*.62} ${y}h${r*1.24}M${x} ${y-r*.62}v${r*1.24}" stroke="#454951" stroke-width="2.2" stroke-linecap="round"/>`;
const bor=(x,y,w,pe)=>{let t=`<rect x="${x}" y="${y}" width="${w}" height="34" rx="5" fill="${pe?'#2e9d3f':'#2d7fd6'}" stroke="${pe?'#e9c81a':'#1b5aa5'}" stroke-width="${pe?3:1.5}"${pe?' stroke-dasharray="9 6"':''}/>`;const n=Math.floor((w-10)/26);for(let i=0;i<n;i++)t+=scr(x+5+(w-10)/n*(i+.5),y+17,7);return t};
const gen=n=>()=>({nombre:'Caja genérica',cap:n,filas:1,w:(72+n*W)/K,h:(BLK+20)/K,d:0,gen:1});
function dibujar(m,box,sel){const bx=typeof box==='function'?box:gen(box||12),TX='#3a3d46',COL={general:'#b3261e',dif:'#2563eb',circ:'#1b6e3c'},feeds=[];
const info=tabs(m).map(t=>{const L=lista(m,t),rs=L.map(c=>Math.round((num(c.y,2)-2)/10)),r0=rs.length?Math.min(...rs):0,B=bx(t),R=rs.length?Math.max(...rs)-r0+1:1,P=B.h*K/B.filas,wd=Math.round(B.w*K);return{t,L,r0,R,B,P,wd,h:Math.max(R,B.filas)*P,over:R>B.filas}}).filter((q,i)=>i===0||q.L.length);
let oy=0;const MW=Math.max(...info.map(q=>q.wd));info.forEach(q=>{q.oy=oy;q.xo=(MW-q.wd)/2;oy+=CAPH+q.h+GAP});
let s=DEFS;
info.forEach(q=>{const{t,L,r0,R,B,P,wd,h}=q,cap=B.cap,X0=(wd-cap*W)/2,rx=wd-20;let n=0;
const used=L.reduce((a,c)=>a+ancho(c),0),tt=titulo(m,t);
s+=`<text x="${q.xo+4}" y="${q.oy+16}" font-size="14" font-weight="700" fill="var(--tx)">${esc(tt.length>30?tt.slice(0,29)+'…':tt)}</text><text x="${q.xo+4}" y="${q.oy+34}" font-size="11.5" fill="${q.over?'var(--bad)':'var(--mut)'}">${esc(B.nombre)}${B.gen?'':' · '+B.w+'×'+B.h+'×'+B.d+' mm · '+B.tipo} · ${used} de ${cap*B.filas} módulos${q.over?' · no entra':''}</text>`;
s+=`<g transform="translate(${q.xo} ${q.oy+CAPH})"><rect x="2" y="2" width="${wd-4}" height="${h-4}" rx="18" fill="url(#dzbx)" stroke="#8e9199" stroke-width="3"/><rect x="14" y="14" width="${wd-28}" height="${h-28}" rx="10" fill="${q.over?'#f6e7e5':'#eef0f3'}" stroke="#b9bcc4" stroke-width="2"/>`;
[[8,8],[wd-8,8],[8,h-8],[wd-8,h-8]].forEach(z=>{s+=scr(z[0],z[1],5)});
[.25,.5,.75].forEach(k=>{s+=`<ellipse cx="${wd*k}" cy="7" rx="14" ry="3.5" fill="#b3b6bd"/><ellipse cx="${wd*k}" cy="${h-7}" rx="14" ry="3.5" fill="#b3b6bd"/>`});
for(let r=0;r<Math.max(R,B.filas);r++){const fila=L.filter(c=>Math.round((num(c.y,2)-2)/10)===r0+r),us=fila.reduce((a,c)=>a+ancho(c),0),y=r*P+(P-BLK)/2,by=y+BY,xe=X0+us*W;
if(r)s+=`<line x1="14" y1="${r*P}" x2="${wd-14}" y2="${r*P}" stroke="#b9bcc4" stroke-width="2"/>`;
s+=`<text x="26" y="${y+24}" font-size="11" font-weight="700" fill="${TX}">RIEL ${r+1}</text>`+(wd>=480?bor(rx-150,y,150,0)+bor(rx-310,y,150,1):'');
s+=`<rect x="18" y="${by+80}" width="${wd-36}" height="101" fill="url(#dzrl)" stroke="#7d838b"/><rect x="18" y="${by+80}" width="${wd-36}" height="101" fill="url(#dzsl)"/>`;
for(let k=0;k<=cap;k++)s+=`<line x1="${X0+k*W}" y1="${by-8}" x2="${X0+k*W}" y2="${by-2}" stroke="#9ca0aa" stroke-width="1.5"/>`;
if(us){s+=`<rect x="${X0}" y="${y+BL-5}" width="${us*W}" height="11" rx="5" fill="url(#dzcr)" stroke="#7a1712"/><rect x="${X0}" y="${y+BN-5}" width="${us*W}" height="11" rx="5" fill="url(#dzcb)" stroke="#124a85"/><text x="${xe+8}" y="${y+BL+4}" font-size="10" font-weight="700" fill="#a01f18">L</text><text x="${xe+8}" y="${y+BN+4}" font-size="10" font-weight="700" fill="#1b63b0">N</text>`}
fila.forEach(c=>{const off=(num(c.x,2)-2)/2,x=X0+off*W,w=ancho(c)*W,np=ancho(c),isc=c.rol==='circ',fd=!!(c.p&&c.p.alim),on=c.id===sel,cx=x+w/2;
for(let i=0;i<np;i++){const tx=x+W*(i+.5),f1=i===0;s+=`<line x1="${tx}" y1="${y+(f1?BL:BN)}" x2="${tx}" y2="${by+TS}" stroke="${f1?'#c62828':'#1e88e5'}" stroke-width="4" stroke-linecap="round"/>`;
if(isc)s+=`<line x1="${tx}" y1="${by+H-TS}" x2="${tx}" y2="${by+H+10}" stroke="${f1?'#c62828':'#1e88e5'}" stroke-width="4" stroke-linecap="round"/>`}
let gg=`<g data-id="${esc(c.id)}" style="cursor:pointer"><rect x="${x+1.5}" y="${by}" width="${w-3}" height="${H}" rx="6" fill="url(#dzpl)" stroke="${on?'#6d28d9':'#9b9b93'}" stroke-width="${on?4:1.5}"/><rect x="${x+5}" y="${by+4}" width="${w-10}" height="${FY-8}" rx="4" fill="#d5d5cf"/><rect x="${x+5}" y="${by+H-FY+4}" width="${w-10}" height="${FY-8}" rx="4" fill="#d5d5cf"/><rect x="${x+7}" y="${by+FY}" width="${w-14}" height="${FR}" rx="4" fill="#f4f4f0" stroke="#d3d3cb"/>`;
for(let i=0;i<np;i++){gg+=scr(x+W*(i+.5),by+TS)+scr(x+W*(i+.5),by+H-TS)}
const sw=c.rol==='dif'?w-52:np===2?w-30:20,sx=c.rol==='dif'?x+12:cx-sw/2,lw=sw-4;
if(c.rol==='dif'){gg+=`<text x="${cx}" y="${by+80}" text-anchor="middle" font-size="9" font-weight="700" fill="${TX}">DIFERENCIAL</text><text x="${cx}" y="${by+99}" text-anchor="middle" font-size="16" font-weight="800" fill="#1e1b2e">${c.p.in} A</text><rect x="${cx-24}" y="${by+105}" width="48" height="18" rx="9" fill="#2563eb"/><text x="${cx}" y="${by+118}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff">${num(c.p.idn,30)} mA</text><circle cx="${x+w-22}" cy="${by+160}" r="9" fill="#f2c230" stroke="#8a6d00"/><text x="${x+w-22}" y="${by+164}" text-anchor="middle" font-size="10" font-weight="800" fill="#5a4400">T</text>`}
else{if(fd)gg+=`<rect x="${cx-15}" y="${by+44}" width="30" height="13" rx="6.5" fill="#d97706"/><text x="${cx}" y="${by+54}" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">${esc(c.p.alim)}</text>`;
gg+=`<text x="${cx}" y="${by+88}" text-anchor="middle" font-size="${np===2?18:15}" font-weight="800" fill="#1e1b2e">C${c.p.in}</text><text x="${cx}" y="${by+101}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#5a5e68">${np===2?np+'P · '+c.p.in+' A':'1P'}</text><text x="${cx}" y="${by+111}" text-anchor="middle" font-size="7.5" fill="#7a7e88">6000</text>`}
gg+=`<text x="${sx+sw/2}" y="${by+131}" text-anchor="middle" font-size="8" font-weight="700" fill="#5a5e68">I</text><rect x="${sx}" y="${by+134}" width="${sw}" height="52" rx="5" fill="#2a2c31"/><rect x="${sx+2}" y="${by+136}" width="${lw}" height="28" rx="4" fill="#0d0e10"/><rect x="${sx+4}" y="${by+138}" width="${lw-4}" height="5" rx="2.5" fill="#4a4d55"/><text x="${sx+sw/2}" y="${by+194}" text-anchor="middle" font-size="8" font-weight="700" fill="#5a5e68">0</text></g>`;
s+=gg;
if(isc){n++;const no=String(n).padStart(2,'0'),nm=String(c.p.nombre||c.p.uso||c.p.alim||''),mx=Math.max(4,Math.floor((w-12)/4.6)),ty=by+H+10;
s+=`<rect x="${x+6}" y="${ty}" width="${w-12}" height="36" rx="4" fill="#fff" stroke="#c9ccd3"/><text x="${cx}" y="${ty+15}" text-anchor="middle" font-size="13" font-weight="800" fill="#1e1b2e">${no}</text>`
+(nm?`<text x="${cx}" y="${ty+28}" text-anchor="middle" font-size="8" fill="${TX}">${esc(nm.length>mx?nm.slice(0,mx-1)+'…':nm)}</text>`:'');
if(fd)feeds.push({id:c.p.alim,x:q.xo+cx,y:q.oy+CAPH+ty+36,bottom:q.oy+CAPH+h,inn:c.p.in,nm:String(c.p.nombre||c.p.alim)})}})}
s+='</g>'});
feeds.forEach(f=>{const q2=info.find(q=>q.t===f.id);if(!q2)return;const g2=q2.L.find(c=>c.rol==='general'),gx=q2.xo+(q2.wd-q2.B.cap*W)/2+(g2?(num(g2.x,2)-2)/2*W:0)+W*.5,ym=f.bottom+GAP/2+CAPH/2-6,y1=q2.oy+CAPH+(q2.P-BLK)/2+BL;
s+=`<path d="M${f.x} ${f.y}V${ym}H${gx}V${y1}" fill="none" stroke="#d97706" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="${Math.max(f.x,gx)+14}" y="${ym-6}" font-size="11" font-weight="700" fill="var(--tx)">${esc(f.nm.length>26?f.nm.slice(0,25)+'…':f.nm)} · ${f.inn} A</text>`});
return `<svg role="img" aria-label="Tablero" viewBox="0 0 ${MW} ${oy-GAP}" style="--wd:${MW};display:block;width:100%;height:auto;margin:auto">${s}</svg>`}
const api={ordenar,verificar,ajustar,nuevo,nuevoSub,dibujar,lista,tabs,subs,ancho,ib,sec,USOS,STD};
if(typeof module!=='undefined')module.exports=api;
if(!g.Volt)return;
g.Volt.register({id:'disenador',name:'Diseñador',hint:'',
css:'#dzbox select{width:100%}#dzlz{display:flex}#dzlz svg{min-width:calc(var(--wd)*1px);max-width:calc(var(--wd)*1.3px)}@media (min-width:820px){#dzlz{padding:18px!important}#dzlz svg{min-width:calc(var(--wd)*.55px)}}',
html:`<div class="tp"><div class="nt"><b>Solo para visualizar.</b> Distribución y cálculo de partida; no reemplaza el proyecto ni la verificación de un matriculado.</div>
<p class="sub">Agregar</p><div id="dzact"></div><div class="ch" id="dzpal"></div>
<div class="ch" style="margin-top:8px"><button id="dzfit">Ajustar protecciones</button></div>
<div id="dzbox"></div>
<p class="sub">Equipo elegido</p><div id="dzins"></div>
<p class="sub">Circuitos</p><div class="scr"><table class="tbl" id="dztb"></table></div>
<p class="sub">Verificación</p><div id="dzck"></div></div>`,
mount({host,panel,store}){
const $=s=>panel.querySelector(s);let cat=null,cajas=[],sel=null,act='';const cm={};
const bfn=t=>{const G=lista(store.get(),t).find(c=>c.rol==='general'),id=(G&&G.p.caja)||cm[t]||(t?CAJA_SUB:CAJA_PPAL),c=cajas.find(x=>x.id===id)||cajas.find(x=>x.id===CAJA_PPAL)||{id:'',marca:'',nombre:'Caja',tipo:'',mod:12,filas:1,w:280,h:200,d:100};return{id:c.id,nombre:(c.marca+' '+c.nombre).trim(),cap:c.mod/c.filas,filas:c.filas,w:c.w,h:c.h,d:c.d,tipo:c.tipo}};
const tx=fn=>store.set(m=>{fn(m);ordenar(m,t=>bfn(t).cap)}),acto=()=>tabs(store.get()).includes(act)?act:'';
host.innerHTML='<div id="dzlz" style="height:100%;overflow:auto;padding:10px;touch-action:pan-x pan-y;box-sizing:border-box"></div>';
host.onclick=e=>{const k=e.target.closest('[data-id]');sel=k?k.dataset.id:null;pintar()};
$('#dzpal').innerHTML=[['general','Térmica general'],['dif','Diferencial']].concat(Object.entries(USOS).map(([k,u])=>[k,u[0]]),[['sub','Subtablero']]).map(([k,n])=>`<button data-k="${k}">+ ${esc(n)}</button>`).join('');
$('#dzpal').onclick=e=>{const k=e.target.dataset.k;if(!k||!cat)return;
if(k==='sub'){const[a,b]=nuevoSub(cat,store.get());act=b.p.tab;sel=a.id;tx(m=>{m.comp.push(a,b)});return}
const c=nuevo(cat,k,acto());if(k==='general'&&cm[acto()])c.p.caja=cm[acto()];sel=c.id;tx(m=>m.comp.push(c))};
$('#dzact').onchange=e=>{if(e.target.dataset.act){act=e.target.value;pintar()}};
$('#dzfit').onclick=()=>{if(cat)tx(m=>ajustar(m,cat))};
$('#dzbox').onchange=e=>{if(!e.target.dataset.box)return;const t=acto(),id=e.target.value;cm[t]=id;tx(m=>{const G=lista(m,t).find(c=>c.rol==='general');if(G)G.p.caja=id})};
$('#dzins').onchange=e=>{const k=e.target.dataset.f;if(!k)return;tx(m=>{const c=m.comp.find(x=>x.id===sel&&propio(x));if(!c)return;const v=e.target.value;c.p[k]=k==='nombre'?v.slice(0,40):Math.max(0,+v||0)})};
$('#dzins').onclick=e=>{const a=e.target.dataset.a;if(!a)return;const c0=lista(store.get()).find(x=>x.id===sel);if(!c0)return;
if(a==='del'&&c0.p.alim&&!confirm('Se borra también el subtablero y todos sus equipos. ¿Seguir?'))return;
tx(m=>{const c=m.comp.find(x=>x.id===sel),L=lista(m,tab(c)),i=L.indexOf(c);
if(a==='del'){const al=c.p.alim;m.comp=m.comp.filter(x=>x!==c&&!(al&&x.p&&x.p.tab===al));sel=null}
else if(a==='dup'){const d=JSON.parse(JSON.stringify(c));d.id=g.Volt.uid('k');d.x=c.x+1;m.comp.push(d);sel=d.id}
else{const o=L[i+(a==='izq'?-1:1)];if(o){[c.x,o.x]=[o.x,c.x];[c.y,o.y]=[o.y,c.y]}}})};
function pintar(){if(!cat)return;const m=store.get(),L=lista(m),ts=tabs(m),a0=acto(),sb=ts.length>1;
host.querySelector('#dzlz').innerHTML=dibujar(m,bfn,sel);
const bb=bfn(a0),cj=cajas.find(x=>x.id===bb.id);
$('#dzbox').innerHTML=cajas.length?`<label class="mu">Caja de ${esc(titulo(m,a0))} <select data-box="1">${['Genrod','Roker'].map(mk=>`<optgroup label="${mk}">${cajas.filter(x=>x.marca===mk).map(x=>`<option value="${esc(x.id)}"${x.id===bb.id?' selected':''}>${esc(x.nombre)} · ${x.tipo} · ${x.mod} mód${x.filas>1?' ('+x.filas+'×'+x.mod/x.filas+')':''} · ${x.w/10}×${x.h/10}×${x.d/10} cm</option>`).join('')}</optgroup>`).join('')}</select></label>${cj?`<p class="mu sm">Térmica estándar IEC 60898 / DIN 43880: 18 mm por polo, 90 mm de alto, frente de 45 mm y unos 70 mm de profundidad. Esta caja tiene ${cj.d} mm de fondo.</p>`:''}`:'';
$('#dzact').innerHTML=sb?`<label class="mu">Agregar en <select data-act="1">${ts.map(t=>`<option value="${esc(t)}"${t===a0?' selected':''}>${esc(titulo(m,t))}</option>`).join('')}</select></label>`:'';
const c=L.find(x=>x.id===sel),fd=c&&c.p.alim;
$('#dzins').innerHTML=c?`<div class="ch">${c.rol==='circ'?`<label class="mu">Nombre <input data-f="nombre" value="${esc(c.p.nombre||'')}" placeholder="${esc(nom(c))}"></label>${fd?'':`<label class="mu">Potencia (W) <input class="num" type="number" min="0" step="100" data-f="w" value="${num(c.p.w,0)}"></label>`}`:''}
<label class="mu">Corriente (A) <select data-f="in">${opc(cat,c.tipo).map(o=>`<option${o===c.p.in?' selected':''}>${o}</option>`).join('')}</select></label>
${c.tipo==='termica'?`<label class="mu">Polos <select data-f="polos">${[1,2].map(o=>`<option${o===num(c.p.polos,1)?' selected':''}>${o}</option>`).join('')}</select></label>`:''}</div>
${fd?`<p class="mu">Alimenta al subtablero <b>${esc(c.p.alim)}</b>. Carga calculada: ${num(c.p.w,0)} W (lo que cuelga de él, con simultaneidad 0,7).</p>`:''}
<div class="ch" style="margin-top:8px"><button data-a="izq">Izquierda</button><button data-a="der">Derecha</button>${fd?'':'<button data-a="dup">Duplicar</button>'}<button data-a="del">${fd?'Eliminar subtablero':'Eliminar'}</button></div>`:'<p class="mu">Tocá un equipo del riel para editarlo.</p>';
const fil=[];ts.forEach(t=>lista(m,t).filter(x=>x.rol==='circ').forEach((x,i)=>fil.push([t,x,i])));
$('#dztb').innerHTML='<thead><tr><th>N.º</th>'+(sb?'<th>Tab.</th>':'')+'<th>Circuito</th><th>W</th><th>Ib</th><th>Térmica</th><th>Cable</th></tr></thead><tbody>'+(fil.map(([t,x,i])=>`<tr><td>${String(i+1).padStart(2,'0')}</td>${sb?`<td>${t?esc(t):'P'}</td>`:''}<td>${esc(nom(x))}${x.p.alim?' ›':''}</td><td>${num(x.p.w,0)}</td><td${ib(x)>x.p.in?' class="bad"':''}>${f(ib(x))} A</td><td>${x.p.in} A</td><td>${f(sec(x.p.in))} mm²</td></tr>`).join('')||`<tr><td colspan="${sb?7:6}">Agregá circuitos para listarlos.</td></tr>`)+'</tbody>';
$('#dzck').innerHTML=verificar(m,bfn).map(([k,t])=>`<p class="mu${k==='bad'?' bad':k==='wrn'?' wrn':''}"${k==='ok'?' style="color:var(--ok)"':''}>${esc(t)}</p>`).join('')}
Promise.all([Volt.datos('catalogo'),Volt.datos('cajas').catch(()=>({cajas:[]}))]).then(([c,k])=>{cat=c;cajas=k.cajas||[];pintar()}).catch(()=>{$('#dzck').innerHTML='<p class="bad">No se pudo cargar el catálogo.</p>'});
store.on(pintar)}});
})(typeof window!=='undefined'?window:globalThis);
