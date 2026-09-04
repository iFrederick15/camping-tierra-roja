// ── Configuración de idiomas ──────────────────────────────────────────────
//
// El español es el idioma principal y vive en la raíz (`/`, `/galeria`, …).
// Portugués e inglés viven bajo prefijo (`/pt/…`, `/en/…`) con slugs
// traducidos, porque el público brasileño y el internacional buscan en su
// propio idioma y la URL es una señal de relevancia.
//
// Para agregar un idioma nuevo:
//   1. sumarlo a IDIOMAS y a RUTAS,
//   2. crear `src/i18n/<codigo>.ts` copiando la forma de `es.ts`,
//   3. registrarlo en `src/i18n/index.ts`,
//   4. crear las páginas en `src/pages/<codigo>/`,
//   5. sumarlo a `i18n.locales` en `astro.config.mjs`.

export const IDIOMA_POR_DEFECTO = 'es' as const;

export type Idioma = 'es' | 'pt' | 'en';

export const IDIOMAS: {
  codigo: Idioma;
  /** Etiqueta que ve el usuario, siempre en su propio idioma. */
  nombre: string;
  /** Código BCP-47 para `lang`, `hreflang` y `og:locale`. */
  hreflang: string;
  ogLocale: string;
  /** Bandera como emoji: no requiere descargar iconos ni sprites. */
  bandera: string;
}[] = [
  { codigo: 'es', nombre: 'Español', hreflang: 'es-AR', ogLocale: 'es_AR', bandera: '🇦🇷' },
  { codigo: 'pt', nombre: 'Português', hreflang: 'pt-BR', ogLocale: 'pt_BR', bandera: '🇧🇷' },
  { codigo: 'en', nombre: 'English', hreflang: 'en', ogLocale: 'en_US', bandera: '🇺🇸' },
];

/** Claves de página que existen traducidas en los tres idiomas. */
export type ClaveRuta = 'home' | 'galeria' | 'contacto' | 'reservar';

// Mapa único de rutas: el selector de idioma, el footer, el navbar y los
// `hreflang` del <head> leen todos de acá, así no pueden desincronizarse.
export const RUTAS: Record<Idioma, Record<ClaveRuta, string>> = {
  es: { home: '/', galeria: '/galeria', contacto: '/contacto', reservar: '/reservar' },
  pt: { home: '/pt', galeria: '/pt/galeria', contacto: '/pt/contato', reservar: '/pt/reservar' },
  en: { home: '/en', galeria: '/en/gallery', contacto: '/en/contact', reservar: '/en/book' },
};

// Páginas legales y reglamento: por ahora solo existen en español (son textos
// con valor contractual, traducirlos sin revisión legal sería un riesgo).
// El selector de idioma manda al inicio del idioma destino cuando el usuario
// está parado en una de estas.
export const RUTAS_SOLO_ES = [
  '/normas-del-parque',
  '/terminos-y-condiciones',
  '/politica-de-privacidad',
];

/**
 * Forma canónica de una ruta: SIEMPRE con barra final.
 *
 * Es la forma que emite Astro en `<link rel="canonical">` y la que usa el
 * sitemap. Los `hreflang` tienen que apuntar exactamente a esa misma URL: si
 * apuntan a `/pt` mientras el canonical dice `/pt/`, Google las trata como
 * dos URLs distintas y descarta la relación entre idiomas.
 */
export function rutaCanonica(ruta: string): string {
  return ruta.endsWith('/') ? ruta : `${ruta}/`;
}

/** Normaliza un pathname: sin barra final (salvo la raíz). */
export function normalizarRuta(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

/** Deduce el idioma a partir del pathname (`/pt/...` → 'pt'). */
export function idiomaDeRuta(pathname: string): Idioma {
  const segmento = normalizarRuta(pathname).split('/')[1];
  if (segmento === 'pt' || segmento === 'en') return segmento;
  return IDIOMA_POR_DEFECTO;
}

/** Busca a qué página traducible corresponde un pathname, si es que a alguna. */
export function claveDeRuta(pathname: string): ClaveRuta | null {
  const ruta = normalizarRuta(pathname);
  for (const idioma of Object.keys(RUTAS) as Idioma[]) {
    for (const [clave, valor] of Object.entries(RUTAS[idioma]) as [ClaveRuta, string][]) {
      if (normalizarRuta(valor) === ruta) return clave;
    }
  }
  return null;
}

/**
 * Equivalente de `pathname` en otro idioma. Si la página no está traducida
 * (legales, panel, 404) devuelve el inicio de ese idioma en vez de un 404.
 */
export function rutaEnIdioma(pathname: string, destino: Idioma): string {
  const clave = claveDeRuta(pathname);
  return clave ? RUTAS[destino][clave] : RUTAS[destino].home;
}

/**
 * Idiomas alternativos de la página actual, para los `<link rel="alternate">`.
 * Devuelve null cuando la página no tiene traducciones (así no se emiten
 * hreflang apuntando al inicio, que Google interpretaría como duplicado).
 */
export function alternativasDeRuta(
  pathname: string
): { idioma: Idioma; hreflang: string; ruta: string }[] | null {
  const clave = claveDeRuta(pathname);
  if (!clave) return null;
  return IDIOMAS.map(({ codigo, hreflang }) => ({
    idioma: codigo,
    hreflang,
    ruta: RUTAS[codigo][clave],
  }));
}
