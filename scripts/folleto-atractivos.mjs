// ── Folleto de Atractivos Iguazú: páginas del PDF oficial a la web ────────
//
// Genera lo que muestra `/atractivos` a partir del PDF de la ACATI:
//
//   public/images/atractivos/folleto-descriptivo.webp        (página 1, 1600 px)
//   public/images/atractivos/folleto-descriptivo-grande.webp (página 1, 3000 px)
//   public/images/atractivos/folleto-mapa.webp               (página 2, 1600 px)
//   public/images/atractivos/folleto-mapa-grande.webp        (página 2, 3000 px)
//   public/documentos/atractivos-iguazu.pdf                  (las dos páginas, ~1 MB)
//
// Correrlo cuando salga una edición nueva del folleto:
//
//   node scripts/folleto-atractivos.mjs "~/Downloads/Descriptivo … .pdf"
//
// Cómo funciona, porque no es obvio:
//
//   1. Las páginas se rasterizan con `qlmanage` (Quick Look de macOS, sin
//      dependencias), igual que en `logos-atractivos.mjs`. Quick Look solo
//      renderiza la primera página, así que para la segunda se escribe una
//      copia del PDF en /tmp con el /Kids del nodo /Pages apuntando solo a
//      la página 2. El reemplazo se rellena con espacios hasta ocupar los
//      mismos bytes que el original: así el xref del archivo sigue siendo
//      válido y no hay que reconstruirlo.
//   2. El PDF original pesa 18 MB (lleva las fotos a resolución de imprenta)
//      y no se puede publicar tal cual. El que se ofrece para descargar se
//      arma acá con las dos páginas rasterizadas en JPEG, que es lo que un
//      huésped necesita para mirarlo en el teléfono o imprimirlo.
//
// El descriptivo es material de la ACATI: se republica como guía para el
// huésped, sin modificarlo. Si cambia la edición, se corre el script de nuevo
// y se actualiza la fecha en `EDICION_FOLLETO` (src/lib/atractivos.ts).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const SALIDA_IMAGENES = 'public/images/atractivos';
const SALIDA_PDF = 'public/documentos/atractivos-iguazu.pdf';
const ANCHO_GRANDE = 3000; // el que se abre en "ver en tamaño completo"
const ANCHO_NORMAL = 1600; // el que se muestra dentro de la página
const ANCHO_PDF = 2400; // suficiente para leer las fichas impresas

const PAGINAS = [
  { nombre: 'folleto-descriptivo', numero: 1 },
  { nombre: 'folleto-mapa', numero: 2 },
];

// ── PDF de entrada ────────────────────────────────────────────────────────

/** Copia del PDF en la que el nodo /Pages solo lista la página pedida. */
function pdfDeUnaPagina(bytes, indice) {
  const texto = bytes.toString('latin1');
  const nodo = /\/Kids\s*\[([^\]]*)\]\s*\/Count\s+(\d+)/.exec(texto);
  if (!nodo) throw new Error('no encontré el /Kids del nodo /Pages');

  const hijos = nodo[1].trim().match(/\d+ \d+ R/g) ?? [];
  if (hijos.length !== Number(nodo[2])) throw new Error('el /Kids no coincide con el /Count');
  if (indice >= hijos.length) throw new Error(`el PDF no tiene página ${indice + 1}`);

  let reemplazo = `/Kids[${hijos[indice]}]/Count 1`;
  if (reemplazo.length > nodo[0].length) throw new Error('el /Kids nuevo no entra en el original');
  // Relleno con espacios: el archivo tiene que conservar el largo exacto para
  // que las posiciones del xref sigan apuntando a donde corresponde.
  reemplazo += ' '.repeat(nodo[0].length - reemplazo.length);

  const copia = Buffer.from(bytes);
  copia.write(reemplazo, nodo.index, 'latin1');
  return copia;
}

/** Rasteriza la primera página de un PDF y devuelve la ruta del PNG. */
function rasterizar(rutaPdf, carpeta) {
  rmSync(carpeta, { recursive: true, force: true });
  mkdirSync(carpeta, { recursive: true });
  execFileSync('qlmanage', ['-t', '-s', String(ANCHO_GRANDE), '-o', carpeta, rutaPdf], {
    stdio: 'ignore',
  });
  const png = readdirSync(carpeta).find((n) => n.endsWith('.png'));
  if (!png) throw new Error(`qlmanage no generó nada para ${rutaPdf}`);
  return join(carpeta, png);
}

// ── PDF de salida ─────────────────────────────────────────────────────────

/**
 * Arma un PDF de una página por imagen. Cada JPEG entra tal cual como
 * XObject con /DCTDecode (el formato del stream es el del archivo JPEG), así
 * que no hay que recomprimir nada ni depender de una librería.
 */
function pdfDeImagenes(paginas) {
  const objetos = []; // objetos[n] = cuerpo del objeto n+1
  const agregar = (cuerpo) => objetos.push(cuerpo) && objetos.length;

  const idCatalogo = agregar(''); // 1: se completa al final
  const idPaginas = agregar(''); // 2: idem
  const idsPagina = [];

  for (const { jpeg, ancho, alto } of paginas) {
    const idImagen = agregar(
      Buffer.concat([
        Buffer.from(
          `<< /Type /XObject /Subtype /Image /Width ${ancho} /Height ${alto} ` +
            `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
            `/Length ${jpeg.length} >>\nstream\n`,
          'latin1'
        ),
        jpeg,
        Buffer.from('\nendstream', 'latin1'),
      ])
    );
    const dibujo = `q ${ancho} 0 0 ${alto} 0 0 cm /Im0 Do Q`;
    const idContenido = agregar(`<< /Length ${dibujo.length} >>\nstream\n${dibujo}\nendstream`);
    idsPagina.push(
      agregar(
        `<< /Type /Page /Parent ${idPaginas} 0 R /MediaBox [0 0 ${ancho} ${alto}] ` +
          `/Resources << /XObject << /Im0 ${idImagen} 0 R >> >> /Contents ${idContenido} 0 R >>`
      )
    );
  }

  objetos[idCatalogo - 1] = `<< /Type /Catalog /Pages ${idPaginas} 0 R >>`;
  objetos[idPaginas - 1] =
    `<< /Type /Pages /Kids [${idsPagina.map((n) => `${n} 0 R`).join(' ')}] ` +
    `/Count ${idsPagina.length} >>`;

  const partes = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  const posiciones = [];
  let offset = partes[0].length;
  objetos.forEach((cuerpo, i) => {
    const bloque = Buffer.concat([
      Buffer.from(`${i + 1} 0 obj\n`, 'latin1'),
      Buffer.isBuffer(cuerpo) ? cuerpo : Buffer.from(cuerpo, 'latin1'),
      Buffer.from('\nendobj\n', 'latin1'),
    ]);
    posiciones.push(offset);
    partes.push(bloque);
    offset += bloque.length;
  });

  const xref = [
    `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`,
    ...posiciones.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`),
    `trailer\n<< /Size ${objetos.length + 1} /Root ${idCatalogo} 0 R >>\n`,
    `startxref\n${offset}\n%%EOF\n`,
  ].join('');
  partes.push(Buffer.from(xref, 'latin1'));
  return Buffer.concat(partes);
}

// ── Programa ──────────────────────────────────────────────────────────────

const rutaPdf = (process.argv[2] ?? '').replace(/^~/, homedir());
if (!rutaPdf) {
  console.error('Uso: node scripts/folleto-atractivos.mjs "<descriptivo oficial>.pdf"');
  process.exit(1);
}

const original = readFileSync(rutaPdf);
const trabajo = join(tmpdir(), 'folleto-atractivos');
rmSync(trabajo, { recursive: true, force: true });
mkdirSync(trabajo, { recursive: true });
mkdirSync(SALIDA_IMAGENES, { recursive: true });
mkdirSync('public/documentos', { recursive: true });

const paraElPdf = [];

for (const { nombre, numero } of PAGINAS) {
  console.log(`rasterizando la página ${numero} …`);
  let entrada = rutaPdf;
  if (numero !== 1) {
    entrada = join(trabajo, `pagina-${numero}.pdf`);
    writeFileSync(entrada, pdfDeUnaPagina(original, numero - 1));
  }
  const png = rasterizar(entrada, join(trabajo, `render-${numero}`));

  await sharp(png)
    .resize({ width: ANCHO_GRANDE, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(join(SALIDA_IMAGENES, `${nombre}-grande.webp`));
  await sharp(png)
    .resize({ width: ANCHO_NORMAL })
    .webp({ quality: 82 })
    .toFile(join(SALIDA_IMAGENES, `${nombre}.webp`));

  const jpeg = await sharp(png)
    .resize({ width: ANCHO_PDF })
    .jpeg({ quality: 72, chromaSubsampling: '4:4:4' })
    .toBuffer();
  const meta = await sharp(jpeg).metadata();
  paraElPdf.push({ jpeg, ancho: meta.width, alto: meta.height });
}

console.log('armando el PDF liviano …');
writeFileSync(SALIDA_PDF, pdfDeImagenes(paraElPdf));

rmSync(trabajo, { recursive: true, force: true });
console.log(`listo: ${SALIDA_IMAGENES}/folleto-*.webp y ${SALIDA_PDF}`);
