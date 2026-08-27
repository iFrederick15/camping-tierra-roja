// Generador de archivos .xlsx (Excel) sin dependencias — se usa para los
// reportes descargables del Panel Admin. Escribe el contenedor ZIP y las
// partes mínimas de Office Open XML a mano; alcanza para hojas con celdas de
// texto y número, que es todo lo que necesitan los reportes.
import { deflateRawSync } from 'node:zlib';

export type Celda = string | number | null | undefined;
export interface Hoja {
  nombre: string;
  filas: Celda[][];
}

// --- ZIP mínimo (una entrada por parte del .xlsx) -------------------------

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(entradas: { nombre: string; datos: Buffer }[]): Buffer {
  const locales: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const e of entradas) {
    const nombreBuf = Buffer.from(e.nombre, 'utf8');
    const crc = crc32(e.datos);
    const comprimido = deflateRawSync(e.datos);
    const guardar = comprimido.length >= e.datos.length;
    const metodo = guardar ? 0 : 8;
    const cuerpo = guardar ? e.datos : comprimido;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // versión necesaria
    local.writeUInt16LE(0x0800, 6); // flag: nombres UTF-8
    local.writeUInt16LE(metodo, 8);
    local.writeUInt16LE(0, 10); // hora
    local.writeUInt16LE(0x21, 12); // fecha (1980-01-01, válida y fija)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(cuerpo.length, 18);
    local.writeUInt32LE(e.datos.length, 22);
    local.writeUInt16LE(nombreBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locales.push(local, nombreBuf, cuerpo);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); // versión creador
    cd.writeUInt16LE(20, 6); // versión necesaria
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(metodo, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0x21, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(cuerpo.length, 20);
    cd.writeUInt32LE(e.datos.length, 24);
    cd.writeUInt16LE(nombreBuf.length, 28);
    cd.writeUInt32LE(0, 30); // extra + comentario
    cd.writeUInt16LE(0, 34); // disco
    cd.writeUInt16LE(0, 36); // attrs internos
    cd.writeUInt32LE(0, 38); // attrs externos
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nombreBuf);

    offset += local.length + nombreBuf.length + cuerpo.length;
  }

  const centralBuf = Buffer.concat(central);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(entradas.length, 8);
  fin.writeUInt16LE(entradas.length, 10);
  fin.writeUInt32LE(centralBuf.length, 12);
  fin.writeUInt32LE(offset, 16);

  return Buffer.concat([...locales, centralBuf, fin]);
}

// --- Office Open XML ------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Neutraliza la inyección de fórmulas (CSV/Excel injection): un valor de
// texto que empieza con = + - @ o un control (tab/CR) puede ser
// interpretado como fórmula al abrir el archivo. Se le antepone un apóstrofo
// para forzar que Excel/Sheets lo trate como texto literal. Solo aplica a
// celdas de texto — los números se escriben aparte.
function neutralizarFormula(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

function refColumna(i: number): string {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Excel no admite [ ] : * ? / \ en el nombre de la hoja, y lo corta a 31.
function nombreHoja(nombre: string): string {
  return esc(
    nombre
      .replace(/[[\]:*?/\\]/g, ' ')
      .trim()
      .slice(0, 31) || 'Hoja'
  );
}

function xmlHoja(hoja: Hoja): string {
  const filas = hoja.filas
    .map((fila, f) => {
      const celdas = fila
        .map((valor, c) => {
          if (valor === null || valor === undefined || valor === '') return '';
          const ref = `${refColumna(c)}${f + 1}`;
          if (typeof valor === 'number' && Number.isFinite(valor)) {
            return `<c r="${ref}"><v>${valor}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(neutralizarFormula(String(valor)))}</t></is></c>`;
        })
        .join('');
      return `<row r="${f + 1}">${celdas}</row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${filas}</sheetData></worksheet>`;
}

export function construirXlsx(hojas: Hoja[]): Buffer {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${hojas
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('')}</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${hojas
    .map((h, i) => `<sheet name="${nombreHoja(h.nombre)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('')}</sheets></workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${hojas
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join('')}</Relationships>`;

  return zip([
    { nombre: '[Content_Types].xml', datos: Buffer.from(contentTypes, 'utf8') },
    { nombre: '_rels/.rels', datos: Buffer.from(rels, 'utf8') },
    { nombre: 'xl/workbook.xml', datos: Buffer.from(workbook, 'utf8') },
    { nombre: 'xl/_rels/workbook.xml.rels', datos: Buffer.from(workbookRels, 'utf8') },
    ...hojas.map((h, i) => ({
      nombre: `xl/worksheets/sheet${i + 1}.xml`,
      datos: Buffer.from(xmlHoja(h), 'utf8'),
    })),
  ]);
}
