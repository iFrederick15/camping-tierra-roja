// Punto de entrada de las traducciones.
//
// Uso típico en un componente Astro:
//
//   ---
//   import { traducciones, idiomaActual } from '../i18n';
//   const idioma = idiomaActual(Astro);
//   const t = traducciones(idioma);
//   ---
//   <h2>{t.piscinas.titulo}</h2>

import { es, type Traducciones } from './es';
import { pt } from './pt';
import { en } from './en';
import { IDIOMA_POR_DEFECTO, idiomaDeRuta, type Idioma } from './config';

export * from './config';
export type { Traducciones };

const DICCIONARIOS: Record<Idioma, Traducciones> = { es, pt, en };

export function traducciones(idioma: Idioma | string | undefined): Traducciones {
  return DICCIONARIOS[(idioma as Idioma) ?? IDIOMA_POR_DEFECTO] ?? es;
}

/**
 * Idioma de la página actual. Prefiere `Astro.currentLocale` (que Astro
 * calcula con la config de i18n) y cae al prefijo de la URL, que es la
 * fuente real y funciona también en componentes anidados.
 */
export function idiomaActual(astro: { currentLocale?: string; url: URL }): Idioma {
  const desdeAstro = astro.currentLocale;
  if (desdeAstro === 'es' || desdeAstro === 'pt' || desdeAstro === 'en') return desdeAstro;
  return idiomaDeRuta(astro.url.pathname);
}

/**
 * Interpola `{clave}` dentro de un texto traducido.
 *   interpolar(t.hero.pruebaSocial, { promedio: '4,8', cantidad: 5 })
 */
export function interpolar(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (coincidencia, clave) =>
    clave in valores ? String(valores[clave]) : coincidencia
  );
}
