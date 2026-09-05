// ── Subconjunto de Material Symbols que usa el sitio ──────────────────────
//
// La hoja de estilos de Material Symbols sin filtrar sirve la fuente variable
// COMPLETA (~3.500 iconos). El parámetro `icon_names` de la API de Google
// Fonts devuelve una fuente recortada a estos iconos: pasa de cientos de KB
// a unos pocos, en el camino crítico del render.
//
// ⚠️ Si agregas un `<span class="material-symbols-outlined">nuevo_icono</span>`
// en cualquier componente, AGREGALO TAMBIÉN A ESTA LISTA. Si no, el navegador
// no lo encuentra en la fuente recortada y muestra el nombre del icono como
// texto plano.
//
// Para regenerar la lista (contempla los tags partidos en varias líneas por
// Prettier y los iconos elegidos con un ternario):
//   node --input-type=module -e "
//     import {readdirSync,readFileSync,statSync} from 'node:fs';
//     const f=[],w=d=>readdirSync(d).forEach(n=>{const p=d+'/'+n;
//       statSync(p).isDirectory()?w(p):/\.(astro|tsx|ts)\$/.test(n)&&f.push(p)});w('src');
//     const s=new Set();
//     for(const p of f){const t=readFileSync(p,'utf8').replace(/\s+/g,' ');
//       for(const m of t.matchAll(/material-symbols-outlined(.{0,400}?)<\/span\s*>/g))
//         for(const x of [...m[1].matchAll(/>\s*([a-z][a-z_0-9]{2,})\s*(?:<|\$)/g),
//                         ...m[1].matchAll(/'([a-z][a-z_0-9]{2,})'/g)]) s.add(x[1]);
//       for(const m of t.matchAll(/icono: ?'([a-z][a-z_0-9]{2,})'/g)) s.add(m[1]);}
//     console.log([...s].sort().join(','))"
//
// Después de regenerarla, revisar visualmente que no aparezca el NOMBRE de un
// icono como texto en la web (es el síntoma de un icono faltante).

export const ICONOS_MATERIAL = [
  'ac_unit',
  'add',
  'airport_shuttle',
  'arrow_back',
  'arrow_forward',
  'bed',
  'call',
  'cancel',
  'chat',
  'check',
  'check_circle',
  'chevron_left',
  'chevron_right',
  'child_care',
  'close',
  'cottage',
  'download',
  'expand_more',
  'family_restroom',
  'flag',
  'flight',
  'forest',
  'group',
  'info',
  'kayaking',
  'live_tv',
  'local_activity',
  'location_on',
  'logout',
  'mail',
  'map',
  'menu',
  'museum',
  'near_me',
  'open_in_new',
  'outdoor_grill',
  'pets',
  'pool',
  'progress_activity',
  'public',
  'remove',
  'schedule',
  'search',
  'shopping_bag',
  'shower',
  'spa',
  'star',
  'storefront',
  'swap_horiz',
  'verified',
  'warning',
  'water_drop',
  'wifi',
  'zoom_in',
] as const;
