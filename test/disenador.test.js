const assert=require('assert');require('../static/js/volt.js');const A=require('../static/js/modules/disenador.js');
const cat={tipos:[{id:'termica',p:{in:{def:16,opc:[6,10,16,20,25,32,40,50,63]},polos:{def:1,opc:[1,2]}}},{id:'diferencial',p:{in:{def:25,opc:[25,40,63]},idn:{def:30}}}]};
const M=()=>({v:1,comp:[],cables:[],circ:[]});
// plantilla ordenada en un riel de 12 módulos
let m=M();m.comp=['general','dif','IUG','TUG','ACU'].map(k=>A.nuevo(cat,k));
assert.equal(A.ordenar(m,12),1);assert.deepEqual(A.lista(m).map(c=>c.x),[2,6,10,12,14]);
// un equipo nuevo entra al final, no al principio
m.comp.push(A.nuevo(cat,'TUG'));A.ordenar(m,12);assert.equal(A.lista(m).pop().rol,'circ');assert.equal(A.lista(m)[0].rol,'general');m.comp.pop();A.ordenar(m,12);
// se parte al llegar al límite del riel
m.comp.push(A.nuevo(cat,'TUE'));assert.equal(A.ordenar(m,6),2);
// ajustar: térmica normalizada por carga y general por simultaneidad
m=M();m.comp=['general','dif','IUG','TUG','ACU'].map(k=>A.nuevo(cat,k));m.comp[3].p.w=3500;A.ordenar(m,12);A.ajustar(m,cat);
assert.equal(m.comp[3].p.in,16);assert.equal(m.comp[2].p.in,10);
// verificación
assert.ok(A.verificar(M()).some(v=>v[0]==='bad'));
m.comp[4].p.in=6;assert.ok(A.verificar(m).some(v=>/supera la térmica/.test(v[1])));
// lo armado por Tablero (auto) no se toca
const t={id:'z',tipo:'termica',x:0,y:0,rol:'general',auto:true,p:{in:63}};m.comp.push(t);A.ordenar(m,12);assert.equal(t.x,0);
// dibujo: determinista y escapa nombres
m.comp[2].p.nombre='<b>x</b>';assert.ok(!/<b>x/.test(A.dibujar(m,12,null)));assert.equal(A.dibujar(m,12,null),A.dibujar(m,12,null));
console.log('disenador OK');
// montaje con DOM falso: cada selector solo existe donde está en el HTML (el lienzo #lz vive en host, no en panel)
(async()=>{const fs=require('fs'),V=globalThis.Volt;V.datos=n=>Promise.resolve(JSON.parse(fs.readFileSync(__dirname+'/../static/data/'+n+'.json','utf8')));
const d=V.modules.disenador,ids=[...d.html.matchAll(/id="([^"]+)"/g)].map(x=>'#'+x[1]),els={};
const panel={querySelector:s=>ids.includes(s)?(els[s]=els[s]||{innerHTML:'',onclick:null,onchange:null}):null};
const lz={innerHTML:''},host={_h:'',set innerHTML(v){this._h=v},get innerHTML(){return this._h},querySelector:s=>s==='#dzlz'?lz:null,onclick:null};
const mem={},st=V.Store('t',{getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v}});
d.mount({host,panel,store:st});await new Promise(r=>setTimeout(r,20));
els['#dzpal'].onclick({target:{dataset:{k:'general'}}});
assert.equal(st.get().comp.length,1);assert.ok(/<svg/.test(lz.innerHTML),'el riel se dibuja');
els['#dzpal'].onclick({target:{dataset:{k:'dif'}}});assert.equal(st.get().comp.length,2);assert.ok(/Diferencial/i.test(lz.innerHTML));assert.ok(!/dztpl/.test(d.html),'sin plantilla');
console.log('montaje OK')})().catch(e=>{console.error(e);process.exit(1)});
// subtablero: alimentadora en el principal + entrada propia; carga sincronizada, selectividad y borrado
(()=>{const A=require('../static/js/modules/disenador.js'),V=globalThis.Volt;
const M=()=>({v:1,comp:[],cables:[],circ:[]});let m=M();m.comp=['general','dif','IUG','TUG'].map(k=>A.nuevo(cat,k));
const [fd,en]=A.nuevoSub(cat,m);m.comp.push(fd,en);const t=en.p.tab;assert.equal(t,'S1');assert.equal(fd.p.alim,'S1');
m.comp.push(A.nuevo(cat,'ACU',t),A.nuevo(cat,'TUG',t));A.ordenar(m,12);
assert.deepEqual(A.tabs(m),['','S1']);assert.equal(A.lista(m,'S1').length,3);assert.equal(A.lista(m,'').length,5);
assert.ok(A.lista(m,'S1')[0].y>A.lista(m,'').pop().y,'el subtablero va en rieles propios, debajo');
assert.equal(fd.p.w,Math.round((3000+2500)*.7));
A.ajustar(m,cat);assert.ok(en.p.in<fd.p.in,'alimentadora un escalón arriba de la entrada');
assert.ok(!A.verificar(m).some(v=>v[0]==='bad'),JSON.stringify(A.verificar(m).filter(v=>v[0]==='bad')));
assert.ok(A.verificar(m).some(v=>/selectividad/.test(v[1])&&v[0]==='ok'));
en.p.in=fd.p.in;assert.ok(A.verificar(m).some(v=>v[0]==='wrn'));en.p.in=40;fd.p.in=25;assert.ok(A.verificar(m).some(v=>/supera la térmica que lo alimenta/.test(v[1])));
const svg=A.dibujar(m,12,null);assert.ok(/Subtablero 1/.test(svg)&&/#d97706/.test(svg));assert.equal(svg,A.dibujar(m,12,null));
const imp=V.importar(V.exportar(m));assert.equal(imp.comp.filter(c=>c.p.tab==='S1').length,3,'sobrevive a exportar/importar');
m.comp=m.comp.filter(c=>c!==fd&&!(c.p&&c.p.tab==='S1'));assert.deepEqual(A.tabs(m),['']);
console.log('subtablero OK')})();
// cajas reales: catálogo válido y verificación de capacidad
(()=>{const A=require('../static/js/modules/disenador.js'),fs=require('fs'),C=JSON.parse(fs.readFileSync(__dirname+'/../static/data/cajas.json','utf8')).cajas;
C.forEach(c=>{assert.ok(c.mod%c.filas===0&&c.w>0&&c.h>0&&c.d>=88,c.id);assert.ok(c.h/c.filas>=140,'entra una fila: '+c.id)});
assert.equal(new Set(C.map(c=>c.id)).size,C.length);
let m={v:1,comp:['general','dif','IUG','TUG','ACU'].map(k=>A.nuevo(cat,k)),cables:[],circ:[]};
const chica=()=>({nombre:'Genrod 4504',cap:4,filas:1,w:190,h:140,d:100}),ok=()=>({nombre:'Genrod 12',cap:12,filas:1,w:280,h:200,d:110});
A.ordenar(m,4);assert.ok(A.verificar(m,chica).some(v=>/No entra en la caja/.test(v[1])));
A.ordenar(m,12);assert.ok(!A.verificar(m,ok).some(v=>/entra en la caja/.test(v[1])));
assert.ok(/190×140×100/.test(A.dibujar(m,chica,null)));
console.log('cajas OK')})();
