// ── Reseñas de huéspedes ──────────────────────────────────────────────────
//
// Fuente real: Google Business Profile de Tierra Roja. Se leen en vivo desde
// la Places API (New) cuando el servidor tiene las credenciales configuradas
// (`GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID`); si faltan, o la llamada
// falla, se usa `RESENAS_RESPALDO` de abajo — así el sitio nunca se rompe ni
// muestra un testimonio inventado.
//
// `RESENAS_RESPALDO` son textos reales copiados tal cual del perfil (NO se
// editan ni se traducen): quedan como red de seguridad, no hace falta
// mantenerlos sincronizados a mano una vez que la API está conectada.
//
// Para conectar la API:
//   1. Proyecto en Google Cloud Console con la "Places API (New)" habilitada
//      y facturación activa (hay franja gratuita mensual).
//   2. Una API key restringida a esa API.
//   3. El Place ID del negocio (buscar "Tierra Roja" en
//      https://developers.google.com/maps/documentation/places/web-service/place-id).
//   4. Cargar GOOGLE_PLACES_API_KEY y GOOGLE_PLACE_ID como variables de
//      entorno (local: `.env`; producción: Vercel → Project Settings →
//      Environment Variables).
// Límite conocido de la API: como máximo devuelve 5 reseñas, elegidas por
// Google (no siempre las más nuevas).

export interface Resena {
  nombre: string;
  texto: string;
  estrellas: number;
  /** Idioma en que la persona escribió, para el atributo `lang` del <p>. */
  idioma: string;
}

export interface FuenteResenas {
  plataforma: 'Google';
  /** URL pública del perfil, para el enlace "Ver todas". */
  perfilUrl: string | null;
  placeId: string | null;
}

export interface ResenasData {
  resenas: Resena[];
  /** Promedio de estrellas, redondeado a un decimal. */
  promedio: number;
  cantidad: number;
  fuente: FuenteResenas;
}

const RESENAS_RESPALDO: Resena[] = [
  {
    nombre: 'Mirian Alvarez',
    texto:
      'Un camping espectacular, las instalaciones son como se ven en las imágenes, a las 19hs cortan la música para poder descansar, y la gente que va a pasar el dia debe retirarse en ese horario.es super armonioso y lleno de espacios diferentes para pasar el dia. Tiene sector de carpas y otro para motorhome, hay proveduria. La limpieza Es un 10! Tanto en baños como en todo el camping.  Volveré.',
    estrellas: 5,
    idioma: 'es',
  },
  {
    nombre: 'Eduardo Eberle',
    texto:
      'Excelente lugar para pasar unos días como lo hicimos nosotros,  3 piletas hermosas , lugar para motorhome,  cabaña para 8/10 personas muy cómoda,  limpieza del lugar excelente,  los baños para la gente que acampa son un lujo , re contra recomendable,  y muchas cosas mas , para que lo visiten y descubran.',
    estrellas: 5,
    idioma: 'es',
  },
  {
    nombre: 'Doscanariosdeviaje',
    texto:
      'Maravilloso camping y ambiente. Estuvimos 3 noches y nos hubiéramos quedado un mes. Varias piscinas, baños impolutos con duchas de agua caliente. Espacios grandes para motorhome, agua, luz todo incluido en el precio.',
    estrellas: 5,
    idioma: 'es',
  },
  {
    nombre: 'Lililana Landriel',
    texto:
      'Excelente lugar. Con áreas específicas para cada edad. 3 piscinas enormes. Y cada una perfectamente cuidadas y limpias por sus empleados. La zona de camping perfecto. Se puede ir con carpa o motor home y tiene su sector de piscina para disfrutar de ella solo mayores de 15 años, y no tengo objeciones con ello, porque hay una para cada rango etario. Baños impecables. Quinchos innumerables,aceptan mascotas. MUY RECOMENDABLE',
    estrellas: 5,
    idioma: 'es',
  },
  {
    nombre: 'Valeria Alvert',
    texto:
      'l camping es muy precioso, todo cuidado, baños y duchas impecables con agua caliente, la atención es amable. El sistema de organización de parcelas para motorhome está muy bueno',
    estrellas: 4,
    idioma: 'es',
  },
];

function promedioDe(resenas: Resena[]): number {
  if (resenas.length === 0) return 0;
  return Math.round((resenas.reduce((t, r) => t + r.estrellas, 0) / resenas.length) * 10) / 10;
}

const DATOS_RESPALDO: ResenasData = {
  resenas: RESENAS_RESPALDO,
  promedio: promedioDe(RESENAS_RESPALDO),
  cantidad: RESENAS_RESPALDO.length,
  fuente: { plataforma: 'Google', perfilUrl: 'https://maps.app.goo.gl/UWRDNWwMnwRtUSqw9', placeId: null },
};

// Google Places API (New) — Place Details.
// https://developers.google.com/maps/documentation/places/web-service/place-details
interface RespuestaPlaceDetails {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: Array<{
    rating?: number;
    text?: { text?: string; languageCode?: string };
    authorAttribution?: { displayName?: string };
  }>;
}

async function obtenerDeGoogle(): Promise<ResenasData | null> {
  const apiKey = import.meta.env.GOOGLE_PLACES_API_KEY;
  const placeId = import.meta.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  const respuesta = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews',
    },
  });
  if (!respuesta.ok) return null;

  const datos: RespuestaPlaceDetails = await respuesta.json();
  const resenas: Resena[] = (datos.reviews ?? [])
    .filter((r) => r.text?.text)
    .map((r) => ({
      nombre: r.authorAttribution?.displayName ?? 'Google',
      texto: r.text!.text!,
      estrellas: r.rating ?? 5,
      idioma: r.text?.languageCode ?? 'es',
    }));
  if (resenas.length === 0) return null;

  return {
    resenas,
    promedio: datos.rating ?? promedioDe(resenas),
    cantidad: datos.userRatingCount ?? resenas.length,
    fuente: { plataforma: 'Google', perfilUrl: datos.googleMapsUri ?? null, placeId },
  };
}

// Caché en memoria del proceso: evita golpear la API en cada request server-
// side (ej. /reservar, que no es prerenderizada) y deduplica los 3 lugares
// que piden estos datos (Layout, Hero, Resenas) en una misma página.
const TTL_MS = 12 * 60 * 60 * 1000; // 12h
let cache: { datos: ResenasData; expira: number } | null = null;
let solicitudEnCurso: Promise<ResenasData> | null = null;

async function cargar(): Promise<ResenasData> {
  const datos = (await obtenerDeGoogle().catch(() => null)) ?? DATOS_RESPALDO;
  cache = { datos, expira: Date.now() + TTL_MS };
  return datos;
}

export async function obtenerResenas(): Promise<ResenasData> {
  if (cache && cache.expira > Date.now()) return cache.datos;
  if (!solicitudEnCurso) solicitudEnCurso = cargar().finally(() => (solicitudEnCurso = null));
  return solicitudEnCurso;
}
