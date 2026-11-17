/* PurpleVolt · núcleo (agnóstico: no conoce ningún módulo).
   Modelo en JSON puro, unidades SI (V, A, W, Ω, mm²). comp: {id,tipo,x,y,p:{}}; cables: {id,a:[compId,borne],b:[compId,borne]};
   circ: {id,nombre,uso,p,fs,cosf,largo,bocas,metodo,s,in} (lo escribe Cálculo; lo leen Tablero y Materiales).
   Un módulo se registra con Volt.register({id,name,hint,css,html,mount({host,panel,store})}). */
(function(g){
const V=g.Volt=g.Volt||{};
V.modules={};
V.register=m=>{if(!m||!m.id||typeof m.mount!=='function')throw new Error('Módulo inválido');V.modules[m.id]=m};
V.nuevo=()=>({v:1,comp:[],cables:[],circ:[]});
V.uid=p=>(p||'x')+Math.random().toString(36).slice(2,8);
V.Store=function(clave,alm){
const propio=!!alm;try{alm=alm||g.localStorage}catch(e){alm=null}
const leer=()=>{let m;try{m=JSON.parse(alm&&alm.getItem(clave))}catch(e){m=null}
if(!m||m.v!==1||!Array.isArray(m.comp)||!Array.isArray(m.cables))return V.nuevo();
if(!Array.isArray(m.circ))m.circ=[];return m};
let m=leer();
const ls=[],save=()=>{try{alm&&alm.setItem(clave,JSON.stringify(m))}catch(e){}},fire=()=>ls.slice().forEach(f=>f(m));
const s={get:()=>m,set(fn){fn(m);save();fire()},reset(){m=V.nuevo();save();fire()},recargar(){m=leer();fire()},
on(f){ls.push(f);return()=>{const i=ls.indexOf(f);if(i>=0)ls.splice(i,1)}}};
// cada módulo corre en su iframe con su propia copia: el evento storage trae los cambios de los demás
if(!propio&&typeof g.addEventListener==='function')g.addEventListener('storage',e=>{if(e.key===clave||e.key===null)s.recargar()});
return s};
V.store=V.Store('purplevolt:v1');
const memo={};
V.datos=n=>memo[n]||(memo[n]=fetch('static/data/'+n+'.json').then(r=>{if(!r.ok)throw new Error(n);return r.json()}).catch(e=>{delete memo[n];throw e}));
V.tabs=(panel,fn)=>{const bs=[].slice.call(panel.querySelectorAll('#tb button[data-t]')),ps=[].slice.call(panel.querySelectorAll('.tp[data-t]'));
const ir=t=>{bs.forEach(b=>{const on=b.dataset.t===t;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});ps.forEach(p=>{p.hidden=p.dataset.t!==t});fn&&fn(t)};
bs.forEach(b=>{b.onclick=()=>ir(b.dataset.t)});if(bs[0])ir(bs[0].dataset.t)};
const MAX_TXT=2e6,MAX_N=2000,PROHIB=['__proto__','constructor','prototype'];
const ok=(c,m)=>{if(!c)throw new Error(m)},num=v=>typeof v==='number'&&isFinite(v),txt=v=>typeof v==='string'&&v.length>0&&v.length<=200;
// Valida un texto JSON y devuelve un modelo nuevo y limpio (solo campos conocidos). Si algo está mal, lanza Error con un mensaje en castellano.
V.importar=t=>{ok(typeof t==='string'&&t.length<=MAX_TXT,'El archivo es demasiado grande.');
let o;try{o=JSON.parse(t)}catch(e){throw new Error('El archivo no es un JSON válido.')}
ok(o&&o.v===1&&Array.isArray(o.comp)&&Array.isArray(o.cables),'No parece un proyecto de PurpleVolt (versión 1).');
const circ=o.circ===undefined?[]:o.circ;ok(Array.isArray(circ),'La lista de circuitos está mal armada.');
ok(o.comp.length<=MAX_N&&o.cables.length<=MAX_N&&circ.length<=MAX_N,'El proyecto tiene demasiados elementos.');
const ids=new Set(),uno=id=>{ok(txt(id)&&!ids.has(id),'Hay identificadores vacíos o repetidos.');ids.add(id);return id};
const lim=(src,perm)=>{const r={};for(const k of Object.keys(src||{})){ok(!PROHIB.includes(k),'El archivo trae claves no permitidas.');const v=src[k];if(perm?perm(v):(num(v)||typeof v==='string'||typeof v==='boolean'))r[k]=v}return r};
const comp=o.comp.map(c=>{ok(c&&typeof c==='object'&&txt(c.tipo)&&num(c.x)&&num(c.y),'Hay un componente con datos inválidos.');
const r={id:uno(c.id),tipo:c.tipo,x:c.x,y:c.y,p:lim(c.p)};if(c.auto===true)r.auto=true;for(const k of['rol','circ'])if(typeof c[k]==='string'&&c[k].length<=200)r[k]=c[k];if(num(c.grupo))r.grupo=c.grupo;return r});
const cables=o.cables.map(w=>{ok(w&&Array.isArray(w.a)&&Array.isArray(w.b)&&w.a.length===2&&w.b.length===2&&[].concat(w.a,w.b).every(txt),'Hay un cable con datos inválidos.');
return{id:uno(w.id),a:w.a.slice(),b:w.b.slice()}});
const cir=circ.map(c=>{ok(c&&typeof c==='object'&&txt(c.nombre),'Hay un circuito con datos inválidos.');const r=lim(c,v=>num(v)||typeof v==='string'&&v.length<=200);r.id=uno(c.id);return r});
return{v:1,comp,cables,circ:cir}};
V.exportar=m=>JSON.stringify({v:1,comp:m.comp,cables:m.cables,circ:m.circ||[]},null,1);
V.json=(n,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([V.exportar(m)],{type:'application/json'}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
V.CSV_CAB=['Rubro','Material','Cantidad','Unidad','Medida','Nota'];
V.csvTexto=f=>[V.CSV_CAB].concat(f).map(r=>r.map(c=>{c=String(c==null?'':c);return /[;"\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(';')).join('\r\n');
V.csv=(n,f)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+V.csvTexto(f)],{type:'text/csv;charset=utf-8'}));a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
})(typeof window!=='undefined'?window:globalThis);
