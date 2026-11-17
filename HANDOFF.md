# HANDOFF - PurpleVolt Diseñador (v1)

## Qué se hizo
- Proyecto con la arquitectura de la familia Purple: núcleo `static/js/volt.js` agnóstico (store, registro, datos, importar/exportar), módulos en `static/js/modules/` registrados en `registry.json`, cada uno en su iframe vía `app.html?m=<id>`, datos en `static/data/*.json`, PWA con `sw.js` y `manifest.webmanifest`.
- Marca copiada del zip de referencia: corazón (`static/assets/purple.svg`, íconos), tokens de color (morado #6d28d9 claro / #a78bfa oscuro), Inter + Instrument Serif y las clases de `modulo.css`.
- Módulo `disenador` (`static/js/modules/disenador.js`): arma a mano el riel DIN sobre el modelo común (`store.comp`). Equipos con `rol` general | dif | circ y sin `auto`, así que conviven con lo que arme el módulo Tablero (auto:true), que no se toca.
  - Agregar general, diferencial y circuitos (Iluminación 10 A, Tomas 16 A, Aire 20 A, Cocina 25 A); plantilla vivienda; editar nombre, potencia, corriente y polos; mover, duplicar, eliminar.
  - Dibujo SVG: caja, riel, buses de fase y neutro, bornera N, barra PE, salidas numeradas con caño y tierra.
  - Ib = W / 220; "Ajustar protecciones" elige térmica normalizada y general/diferencial con simultaneidad 0,7. Verificación y tabla con cable de referencia (1,5 / 2,5 / 4 / 6 mm2).
  - Posición en celdas de 20 px: x = 2 + 2 por módulo usado, y = 2 + 10 por riel (mismo criterio que lee Vista 3D).
- `index.html`, `app.html`, `sw.js` (cache `purplevolt-disenador-v1`) y `static/css` salen del zip, con el texto de inicio y el precache adaptados.

## Cambios tras la prueba en navegador (v1.1)
- Corregido: el lienzo se buscaba en el panel y no en el host (los botones no dibujaban); ids propios `dz*` porque `#tb` choca con la barra de pestañas del CSS base y rompía la tabla.
- Los equipos nuevos entran al final del riel (antes entraban al principio).
- Dibujo rehecho: módulo de 58 px, número grande en cada térmica, nombre vertical debajo de la salida (hasta 22 caracteres), sin texto de ayuda encima del riel, desplazamiento horizontal en pantalla chica.
- Revisado a ojo con una captura del SVG en Chromium (Playwright); el resto de la interfaz sigue sin revisarse en navegador.

## Verificación
- `node test/disenador.test.js`: OK, incluye montaje con DOM falso: agregar equipos y plantilla dibujan el riel (orden y partido de rieles, ajuste de protecciones, verificación, no toca lo auto, dibujo determinista y con escape).
- `node --check` OK en `sw.js` y `disenador.js`.
- NO probado en navegador: dibujo del riel, toque para elegir equipo, scroll del lienzo en celu, claro/oscuro, PWA. Servir con `python3 -m http.server` desde la raíz.

## Decisiones
- Un solo módulo nuevo en vez de copiar los demás módulos del zip; el catálogo (`catalogo.json`) es el mismo.
- Cableado por buses comunes, no punto a punto. Cable de referencia sin validar con la AEA 90364.
- Cantidad de módulos por riel (12/18/24) vive en memoria, no en el proyecto.

## Pendiente
1. Probar en navegador y celu.
2. Validar secciones y criterio de armado con un matriculado.
3. Cableado punto a punto, reserva de módulos, guardar el tamaño del riel en el proyecto.
4. Licencia, dominio y nombre legal (igual que el proyecto de referencia).

## v1.2 - Caja realista + escritorio
- `dibujar` rehecho: caja plástica con tornillos y knockouts, canaleta ranurada arriba y abajo, riel DIN plateado con ranuras, peine de fase L y neutro N aislados, borneras N y PE con tornillos, térmicas altas (~90 mm a escala) con bornes a tornillo, curva C/corriente/poder de corte, palanca ON/OFF, diferencial con botón de test y badge de mA, carteles blancos de circuito debajo. Marcas de módulo libre sobre el riel.
- Escritorio: el dibujo se centra y se achica hasta 55% antes de hacer scroll; en celu mantiene tamaño y hace scroll. Revisado en Chromium: 390x844, 1440x900 y 1280x720 en claro y oscuro, sin errores de consola.
- Caché del SW: `purplevolt-disenador-v2`.
- Sigue sin probarse en celu físico ni la instalación PWA.

## v1.3 - Subtablero
- Modelo: la alimentadora es un circ del principal con `p.alim='S1'`; los equipos del subtablero llevan `p.tab='S1'` (entrada, diferencial opcional, circuitos). Un nivel de profundidad. Sobrevive a exportar/importar (V.importar solo admite strings/números en `p`).
- `ordenar` coloca cada tablero en rieles propios, uno debajo del otro, y sincroniza la carga de la alimentadora (suma W del sub x 0,7; el principal no vuelve a aplicar simultaneidad sobre ella).
- `ajustar`: dimensiona primero el subtablero (circuitos, entrada) y deja la alimentadora un escalón arriba de la entrada (selectividad); después el principal.
- `verificar`: por tablero; entrada <= alimentadora (error), igual (aviso sin selectividad), mayor (ok); avisa si el sub queda sin alimentadora o sin entrada.
- UI: botón "+ Subtablero", selector "Agregar en", columna Tab. en la tabla, eliminar alimentadora borra el subtablero (con confirmación). Dibujo: caja propia por tablero, cable naranja de la alimentadora a la entrada del sub.
- Tests: `node test/disenador.test.js` incluye subtablero. Caché SW `v3`.
- Pendiente: subtableros anidados, ruteo del cable si la alimentadora está en un riel que no es el último, validar criterio con matriculado.

## v1.4 - Cajas argentinas y escala real
- `static/data/cajas.json`: Genrod (4504, 4508, 12, IP65 161200G, 16, 4016 embutir, 24 de 2x12) y Roker (PR417, PR413, PR412), con medidas de publicaciones de venta de Easy (ancho x alto x prof en mm). Faltan las de 18 y 36 módulos porque no se confirmaron medidas: se agregan al JSON sin tocar código.
- Escala: 18 mm por módulo (52 px), térmica/diferencial de 90 mm de alto, riel DIN de 35 mm, borneras de ~54 mm. La caja se dibuja con sus mm reales; cada tablero tiene la suya.
- La caja elegida se guarda en `p.caja` de la térmica general del tablero (sobrevive a exportar/importar). Principal por defecto Genrod 12; subtablero Genrod 4508.
- Si los equipos no entran: la caja se estira, se tiñe de rojo y verificar() da error con los rieles que faltan.
- Se quitaron las canaletas (no las traen estas cajas); borneras N y PE arriba a la derecha del riel.
- Los nombres de circuito en el cartel van truncados; el nombre completo está en la tabla.
- Caché SW `v4`. Pendiente: confirmar medidas con fichas del fabricante, cajas de 18/36, cajas embutir con marco visible.

## v1.5
- Se quitó la plantilla vivienda (botón y lógica). Los equipos se agregan a mano. Caché SW v5.

## v1.6 - Nomenclatura de térmicas
- Las térmicas se nombran por nomenclatura: `ITM <polos>P <curva><In>` (ej. `ITM 1P C10`, `ITM 2P C25`) y, al final, el uso con el código AEA (`· IUG`, `· TUG`, `· ACU`, `· TUE`) o el subtablero que alimentan (`· S1`). Función `nom(c)` en `disenador.js`.
- Al agregar un circuito ya no se guarda `p.nombre` con el uso ("Iluminación", "Tomas"...): se guarda `p.uso`. El nombre se recalcula solo si cambian corriente, polos o curva. Si el usuario escribe un nombre propio (`p.nombre`), manda ese.
- Caché SW `v6`.

## v1.7 - Térmica con medidas estándar
- Dibujo de la térmica y el diferencial con el formato modular estándar (IEC 60898 / DIN 43880): 18 mm por polo, 90 mm de alto, frente de 45 mm centrado (el resto son los hombros con los bornes), ~70 mm de fondo. Constantes `K`, `H`, `FR`, `FY`, `TS` en `disenador.js`.
- El cartel del circuito muestra solo el código de uso (IUG, TUG...); la nomenclatura completa (`ITM 1P C10 · IUG`) está en la tabla y la marca de la térmica dice curva+corriente (C10, 1P).
- Caché SW `v7`.

## v1.8 - Módulo Diseñador pasa a Domiciliario
- El módulo `disenador` se muestra como "Domiciliario" (electricidad domiciliaria, libre). El id no cambia (iframes, tests y SW siguen igual). Solo cambian `name`/`description` en `registry.json`, el `name` en `disenador.js` y la caché del SW (`v8`).
- Pendiente de decisión: módulo premium `industrial` (alcance de v1 sin definir). Al agregarlo con `pago:true`, `index.html` y `sw.js` deben omitirlo (no hay `.js` público): igual que Purple3D, tarjeta "De pago" con mailto.

## v1.9 - Industrial (premium, solo tarjeta)
- `registry.json`: entrada `industrial` con `pago:true` (descripción provisoria, sin alcance definido). `index.html` la muestra como tarjeta y pestaña "De pago" con mailto, sin iframe ni atajo; `sw.js` la omite del precache (caché `v9`). Estilos `.pago`/`.pgt` copiados de Purple3D.
- No existe `industrial.js`: el código irá fuera del repo público, bajo token.

## v1.10 - Industrial más vendedor
- Pestaña con ícono del registry y tarjeta premium: ícono en recuadro, etiqueta "Módulo premium", frase y botón "Quiero comprarlo →" (mailto). Caché SW `v10`.

## v1.11 - Premium igual que Purple3D
- Industrial se trata como los premium de Purple3D: pestaña con ícono y pastilla "PRO", tarjeta con borde dorado, "★ Módulo premium" y "Solicitar acceso →" (mailto). Se quitó el recuadro de ícono y el botón de la v1.10. Caché SW `v11`.

## v1.12 - Industrial "En desarrollo"
- `registry.json`: `industrial` pasa de `pago:true` a `desarrollo:true`. Se muestra como tarjeta y pestaña "En desarrollo" (sin enlace, sin atajo, sin iframe); `sw.js` lo omite (caché `v12`). Se quitó el texto de premium/mail de la home y los estilos `.pago`.

## v1.13 - Industrial vuelve a premium
- Se descartó "En desarrollo" (v1.12). `industrial` queda con `pago:true`: pestaña con ícono y pastilla PRO, tarjeta "★ Módulo premium" y "Solicitar acceso →" (mailto). Caché SW `v13`. Sin `industrial.js` en el zip público.

## v1.14 - Descripción del módulo Industrial
- `registry.json`: descripción de `industrial` alineada con la página institucional (trifásico 380 V, motores, arranque directo y estrella-triángulo, PLC como componente, protecciones y cables de referencia). Es solo texto: el módulo no existe todavía. Caché SW `v14`.
