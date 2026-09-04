// ── Recorte de los logos del descriptivo de Atractivos Iguazú ─────────────
//
// Genera `public/images/atractivos/NN.webp` (uno por ficha, NN = número del
// mapa) a partir del PDF oficial de la ACATI. Correrlo cuando salga una
// edición nueva del folleto:
//
//   node scripts/logos-atractivos.mjs "~/Downloads/Descriptivo … .pdf"
//
// Cómo funciona, porque no es obvio:
//
//   1. La mayoría de los logos del folleto son vectoriales, así que no se
//      pueden extraer como imagen embebida. Se rasteriza la página 1 con
//      `qlmanage` (Quick Look de macOS, sin dependencias) a 4000 px de ancho.
//   2. Lo que SÍ está embebido como imagen es la foto de cada ficha (63x45
//      pt). Esas fotos se localizan interpretando el content stream del PDF
//      y sirven de ancla: el logo siempre va en la banda de abajo, en la
//      columna izquierda de la ficha.
//   3. De cada banda se blanquea el número del mapa (esquina superior
//      izquierda) y la línea divisoria de las últimas filas, se recorta el
//      margen blanco y se convierte a WebP con sharp (viene con Astro).
//
// AJUSTES tiene las excepciones por ficha: dos fotos están corridas dentro
// de su ficha y tres logos se salen de la caja estándar. Si la edición nueva
// mueve la grilla, revisar la hoja de contacto que deja en /tmp antes de
// pisar las imágenes.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import zlib from 'node:zlib';
import sharp from 'sharp';

const CAJA = { izq: -4, der: 62, arriba: -48, abajo: -6 }; // pt, relativos a la foto
const AJUSTES = {
  6: { der: 54 },
  24: { izq: -12, tapaTop: 5 },
  26: { tapaTop: 5 },
  27: { tapaTop: 5 },
  28: { tapaTop: 5 },
  29: { izq: -12, abajo: -3, tapaTop: 6 },
  30: { tapaTop: 5 },
  32: { tapaTop: 5 },
  33: { tapaTop: 5 },
  34: { tapaTop: 5 },
  35: { tapaTop: 5 },
};
// Números del mapa en el orden de las fichas (la edición 29/06/2026 no tiene 31).
const NUMEROS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  28, 29, 30, 32, 33, 34, 35,
];
const SALIDA = 'public/images/atractivos';
const BLANCO = 246; // umbral de "fondo blanco" al recortar márgenes

// ── PDF: content stream y posiciones de las imágenes ──────────────────────

function objetoStream(pdf, num) {
  const re = new RegExp('(?:^|[^0-9])' + num + ' 0 obj([\\s\\S]{0,4000}?)stream\\r?\\n', 'g');
  const m = re.exec(pdf.s);
  if (!m) throw new Error('no encontré el objeto ' + num);
  const inicio = m.index + m[0].length;
  const len = +(m[1].match(/\/Length\s+(\d+)/) || [])[1];
  const datos = pdf.buf.subarray(inicio, inicio + len);
  return /\/FlateDecode/.test(m[1]) ? zlib.inflateSync(datos) : datos;
}

function fotosDeLasFichas(rutaPdf) {
  const buf = readFileSync(rutaPdf);
  const txt = objetoStream({ buf, s: buf.toString('latin1') }, 5).toString('latin1');
  const mul = (a, b) => [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5],
  ];
  let ctm = [1, 0, 0, 1, 0, 0];
  const pila = [],
    puestas = [];
  const re =
    /(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+cm|(\bq\b)|(\bQ\b)|\/(Im\d+)\s+Do/g;
  let m;
  while ((m = re.exec(txt))) {
    if (m[7]) pila.push(ctm.slice());
    else if (m[8]) ctm = pila.pop() || [1, 0, 0, 1, 0, 0];
    else if (m[9]) puestas.push({ x: ctm[4], y: ctm[5], w: Math.abs(ctm[0]), h: Math.abs(ctm[3]) });
    else ctm = mul(m.slice(1, 7).map(Number), ctm);
  }
  // La foto de cada ficha mide ~63x45 pt.
  const fotos = puestas.filter((p) => p.w > 60 && p.w < 67 && p.h > 38 && p.h < 50);
  const filas = [];
  for (const f of fotos.sort((a, b) => b.y - a.y)) {
    const fila = filas.find((r) => Math.abs(r[0].y - f.y) < 12);
    if (fila) fila.push(f);
    else filas.push([f]);
  }
  filas.forEach((r) => r.sort((a, b) => a.x - b.x));
  // Dos fichas tienen la foto corrida: el ancla es el borde de la columna.
  const columnas = [];
  filas.forEach((r) => r.forEach((f, c) => (columnas[c] = Math.min(columnas[c] ?? Infinity, f.x))));
  return filas.flat().map((f, i) => ({ ...f, anclaX: Math.min(f.x, columnas[i % 5]) }));
}

// ── PNG mínimo (leer / escribir / recortar) ───────────────────────────────

const tablaCrc = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc = (b) => {
  let c = -1;
  for (const x of b) c = tablaCrc[(c ^ x) & 255] ^ (c >>> 8);
  return c ^ -1;
};

function leerPng(ruta) {
  const b = readFileSync(ruta);
  let p = 8,
    ancho = 0,
    alto = 0,
    tipo = 0;
  const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p);
    const tag = b.toString('latin1', p + 4, p + 8);
    const datos = b.subarray(p + 8, p + 8 + len);
    if (tag === 'IHDR') {
      ancho = datos.readUInt32BE(0);
      alto = datos.readUInt32BE(4);
      if (datos[8] !== 8) throw new Error('profundidad no soportada');
      tipo = datos[9];
    } else if (tag === 'IDAT') idat.push(datos);
    else if (tag === 'IEND') break;
    p += 12 + len;
  }
  const canales = { 0: 1, 2: 3, 4: 2, 6: 4 }[tipo];
  const crudo = zlib.inflateSync(Buffer.concat(idat));
  const linea = ancho * canales;
  const px = Buffer.alloc(alto * linea);
  let off = 0;
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[off++];
    const fila = crudo.subarray(off, off + linea);
    off += linea;
    const dest = px.subarray(y * linea, (y + 1) * linea);
    const arriba = y ? px.subarray((y - 1) * linea, y * linea) : null;
    for (let i = 0; i < linea; i++) {
      const a = i >= canales ? dest[i - canales] : 0;
      const b2 = arriba ? arriba[i] : 0;
      const c = arriba && i >= canales ? arriba[i - canales] : 0;
      let v = fila[i];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b2;
      else if (filtro === 3) v += (a + b2) >> 1;
      else if (filtro === 4) {
        const pa = Math.abs(b2 - c),
          pb = Math.abs(a - c),
          pc = Math.abs(a + b2 - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b2 : c;
      }
      dest[i] = v & 255;
    }
  }
  return { ancho, alto, canales, px };
}

function escribirPng(ruta, { ancho, alto, px }) {
  const linea = ancho * 3;
  const crudo = Buffer.alloc(alto * (linea + 1));
  for (let y = 0; y < alto; y++) {
    crudo[y * (linea + 1)] = 0;
    px.copy(crudo, y * (linea + 1) + 1, y * linea, (y + 1) * linea);
  }
  const trozo = (tag, datos) => {
    const b = Buffer.alloc(12 + datos.length);
    b.writeUInt32BE(datos.length, 0);
    b.write(tag, 4, 'latin1');
    datos.copy(b, 8);
    b.writeUInt32BE(crc(b.subarray(4, 8 + datos.length)) >>> 0, 8 + datos.length);
    return b;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  writeFileSync(
    ruta,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      trozo('IHDR', ihdr),
      trozo('IDAT', zlib.deflateSync(crudo, { level: 9 })),
      trozo('IEND', Buffer.alloc(0)),
    ])
  );
}

function recortar(img, x0, y0, w, h) {
  const px = Buffer.alloc(w * h * 3, 255);
  for (let y = 0; y < h; y++) {
    const sy = y0 + y;
    if (sy < 0 || sy >= img.alto) continue;
    for (let x = 0; x < w; x++) {
      const sx = x0 + x;
      if (sx < 0 || sx >= img.ancho) continue;
      const o = (sy * img.ancho + sx) * img.canales,
        d = (y * w + x) * 3;
      if (img.canales >= 3) {
        px[d] = img.px[o];
        px[d + 1] = img.px[o + 1];
        px[d + 2] = img.px[o + 2];
      } else px[d] = px[d + 1] = px[d + 2] = img.px[o];
    }
  }
  return { ancho: w, alto: h, canales: 3, px };
}

function recortarBlanco(im, margen = 3) {
  let x0 = im.ancho,
    y0 = im.alto,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < im.alto; y++)
    for (let x = 0; x < im.ancho; x++) {
      const o = (y * im.ancho + x) * 3;
      if (im.px[o] < BLANCO || im.px[o + 1] < BLANCO || im.px[o + 2] < BLANCO) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  if (x1 < 0) return im;
  x0 = Math.max(0, x0 - margen);
  y0 = Math.max(0, y0 - margen);
  x1 = Math.min(im.ancho - 1, x1 + margen);
  y1 = Math.min(im.alto - 1, y1 + margen);
  return recortar(im, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
}

// ── Programa ──────────────────────────────────────────────────────────────

const rutaPdf = (process.argv[2] || '').replace(/^~/, homedir());
if (!rutaPdf) {
  console.error('uso: node scripts/logos-atractivos.mjs <descriptivo.pdf>');
  process.exit(1);
}

const trabajo = join(tmpdir(), 'logos-atractivos');
rmSync(trabajo, { recursive: true, force: true });
mkdirSync(trabajo, { recursive: true });

console.log('1/3 rasterizando la página 1 …');
execFileSync('qlmanage', ['-t', '-s', '4000', '-o', trabajo, rutaPdf], { stdio: 'ignore' });
const rutaPagina = join(
  trabajo,
  readdirSync(trabajo).find((n) => n.endsWith('.png'))
);
const pagina = leerPng(rutaPagina);
const escala = pagina.ancho / 1010.126; // MediaBox del folleto, en pt
const px = (x) => Math.round((x + 9) * escala);
const py = (y) => Math.round((887.7402 - y) * escala);

console.log('2/3 recortando los logos …');
const fichas = fotosDeLasFichas(rutaPdf);
if (fichas.length !== NUMEROS.length)
  throw new Error(
    `esperaba ${NUMEROS.length} fichas y encontré ${fichas.length}: revisá la grilla`
  );

mkdirSync(SALIDA, { recursive: true });
const recortes = fichas.map((foto, i) => {
  const num = NUMEROS[i];
  const a = AJUSTES[num] || {};
  const izq = foto.anclaX + (a.izq ?? CAJA.izq);
  const der = foto.anclaX + (a.der ?? CAJA.der);
  const arriba = foto.y + (a.arriba ?? CAJA.arriba);
  const abajo = foto.y + (a.abajo ?? CAJA.abajo);
  let im = recortar(pagina, px(izq), py(abajo), px(der) - px(izq), py(arriba) - py(abajo));
  const tapaTop = Math.round((a.tapaTop ?? 0) * escala);
  if (tapaTop) im.px.fill(255, 0, Math.min(tapaTop, im.alto) * im.ancho * 3);
  const bw = Math.round(17 * escala),
    bh = Math.round(11 * escala); // número del mapa
  for (let y = 0; y < Math.min(bh, im.alto); y++)
    im.px.fill(255, y * im.ancho * 3, (y * im.ancho + Math.min(bw, im.ancho)) * 3);
  im = recortarBlanco(im);
  const ruta = join(trabajo, `${String(num).padStart(2, '0')}.png`);
  escribirPng(ruta, im);
  return { num, ruta };
});

console.log('3/3 convirtiendo a WebP …');
let total = 0;
for (const { num, ruta } of recortes) {
  const info = await sharp(ruta)
    .resize({ width: 320, height: 200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(`${SALIDA}/${String(num).padStart(2, '0')}.webp`);
  total += info.size;
}
console.log(`listo: ${recortes.length} logos en ${SALIDA} (${(total / 1024).toFixed(0)} KB)`);
console.log(`recortes intermedios en ${trabajo} — revisalos antes de commitear`);
