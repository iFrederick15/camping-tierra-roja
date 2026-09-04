// ── Fotos de la galería ───────────────────────────────────────────────────
//
// Solo fotos reales del predio, alojadas en /public/images. (Antes hubo
// imágenes de stock presentadas como propias: contenido engañoso y
// dependencia de URLs de terceros.)
//
// El texto descriptivo de cada foto vive en los diccionarios de i18n
// (`galeria.fotos`), en el MISMO ORDEN que este array, para que el `alt` esté
// en el idioma del visitante. Si agregas una foto acá, agrega su descripción
// en `es.ts`, `pt.ts` y `en.ts`.
//
// ⚠️ PENDIENTE: faltan fotos propias de interiores de la cabaña, de los
// sanitarios y del sector de proveeduría (ver auditoría SEO, punto A-2).

export type CategoriaFoto =
  | 'general'
  | 'piscinas'
  | 'camping'
  | 'motorhome'
  | 'cabanas'
  | 'quinchos'
  | 'actividades';

export interface Foto {
  categoria: CategoriaFoto;
  imagen: string;
  ancho: number;
  alto: number;
  /** Retrato (3:4) en el mosaico; el resto va cuadrado. */
  alta?: boolean;
}

export const CATEGORIAS: { id: 'todas' | CategoriaFoto }[] = [
  { id: 'todas' },
  { id: 'general' },
  { id: 'piscinas' },
  { id: 'camping' },
  { id: 'motorhome' },
  { id: 'cabanas' },
  { id: 'quinchos' },
  { id: 'actividades' },
];

export const FOTOS: Foto[] = [
  {
    categoria: 'general',
    imagen: '/images/general/tierra-roja-drone.webp',
    ancho: 1440,
    alto: 812,
    alta: true,
  },
  {
    categoria: 'camping',
    imagen: '/images/camping/camping.webp',
    ancho: 1600,
    alto: 739,
    alta: true,
  },
  {
    categoria: 'piscinas',
    imagen: '/images/piscinas/piscina-diversion.webp',
    ancho: 800,
    alto: 500,
  },
  {
    categoria: 'cabanas',
    imagen: '/images/cabanhas/cabanha.webp',
    ancho: 1600,
    alto: 721,
    alta: true,
  },
  { categoria: 'motorhome', imagen: '/images/motorhome/motorhome.webp', ancho: 1600, alto: 1200 },
  {
    categoria: 'piscinas',
    imagen: '/images/piscinas/piscina-familiar.webp',
    ancho: 800,
    alto: 500,
    alta: true,
  },
  { categoria: 'piscinas', imagen: '/images/piscinas/piscina-relax.webp', ancho: 800, alto: 500 },
  {
    categoria: 'motorhome',
    imagen: '/images/motorhome/parcelas_motorhome.webp',
    ancho: 1600,
    alto: 1200,
  },
  {
    categoria: 'motorhome',
    imagen: '/images/motorhome/parrillas_motorhome.webp',
    ancho: 1600,
    alto: 1200,
    alta: true,
  },
  {
    categoria: 'quinchos',
    imagen: '/images/quinchos/quincho.webp',
    ancho: 1600,
    alto: 1200,
    alta: true,
  },
  { categoria: 'actividades', imagen: '/images/canchas/canchas.webp', ancho: 1600, alto: 1200 },
  {
    categoria: 'actividades',
    imagen: '/images/canchas/cancha_futbol.webp',
    ancho: 1600,
    alto: 1200,
    alta: true,
  },
  {
    categoria: 'actividades',
    imagen: '/images/canchas/cancha_voley.webp',
    ancho: 1600,
    alto: 1200,
  },
];
