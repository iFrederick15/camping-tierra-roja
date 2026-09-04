// Utilidades para la sección de preguntas frecuentes.

const MARCA_PLACEHOLDER = '[COMPLETAR';

/** ¿La respuesta todavía tiene un dato sin confirmar? */
export function tienePlaceholder(respuesta: string): boolean {
  return respuesta.includes(MARCA_PLACEHOLDER);
}

/**
 * Quita el bloque `[COMPLETAR: …]` de una respuesta.
 *
 * En pantalla la nota SÍ se muestra (marcada visualmente) para que el
 * administrador la vea y la complete. En el JSON-LD, en cambio, se emite la
 * respuesta sin ese fragmento: publicar una nota interna en un resultado
 * enriquecido de Google sería peor que no publicar la pregunta.
 */
export function limpiarPlaceholder(respuesta: string): string {
  return respuesta.replace(/\s*\[COMPLETAR:[^\]]*\]/g, '').trim();
}

/**
 * Construye el JSON-LD de FAQPage.
 *
 * Solo incluye preguntas cuya respuesta sigue siendo completa y útil después
 * de quitarle el placeholder. Google exige que la respuesta del schema sea la
 * misma que ve el usuario, y una respuesta a medias en un resultado
 * enriquecido es peor que no aparecer: promete una información que no está.
 *
 * El corte es doble para que funcione igual en los tres idiomas:
 *   • la respuesta limpia tiene que superar las 120 letras (una respuesta
 *     real, no media frase), y
 *   • el placeholder no puede haberse llevado más de la mitad del texto.
 */
const LARGO_MINIMO_RESPUESTA = 120;

export function schemaFaq(items: { q: string; a: string }[], idioma: string) {
  const publicables = items
    .map((item) => ({ q: item.q, a: limpiarPlaceholder(item.a), original: item.a.length }))
    .filter(
      (item) => item.a.length >= LARGO_MINIMO_RESPUESTA && item.a.length / item.original >= 0.5
    );

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: idioma,
    mainEntity: publicables.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
