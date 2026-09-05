// ── Capa de analítica ─────────────────────────────────────────────────────
//
// El sitio NO tiene todavía Google Analytics ni GTM instalado. Este módulo
// deja la estructura lista para enchufar cualquier herramienta sin volver a
// tocar los componentes:
//
//   • Cada elemento medible lleva `data-evento="..."` (y opcionalmente
//     `data-evento-detalle="..."`). Ver EVENTOS más abajo.
//   • Un único listener delegado en <body> (ver Analytics.astro) captura los
//     clics y hace push a `window.dataLayer`.
//   • Cuando se instale GA4/GTM, ese dataLayer ya tendrá los eventos: solo
//     hay que agregar el snippet y mapear los nombres en la herramienta.
//
// ⚠️ PARA COMPLETAR: cargar `GTM_ID` (formato GTM-XXXXXXX) en las variables
// de entorno de Vercel. Sin prefijo PUBLIC_: solo lo lee el frontmatter de
// Analytics.astro (servidor). Sin eso el sitio no carga ningún script de
// terceros (mejor performance y nada de cookies innecesarias).
//
// ⚠️ Al activar GTM/GA hay que sumar sus dominios al Content-Security-Policy
// de `vercel.json` (`script-src` y `connect-src`), o el navegador los
// bloqueará silenciosamente.

/** Nombres de evento. Usar SIEMPRE estas constantes, no strings sueltos. */
export const EVENTOS = {
  /** Clic en cualquier CTA que lleva a /reservar. */
  RESERVAR: 'reservar_click',
  /** Clic en el botón flotante o cualquier enlace de WhatsApp. */
  WHATSAPP: 'whatsapp_click',
  /** Clic en un `tel:`. */
  TELEFONO: 'telefono_click',
  /** Clic en un `mailto:`. */
  EMAIL: 'email_click',
  /** Cambio de idioma. El detalle es el código destino ('pt', 'en', …). */
  IDIOMA: 'idioma_click',
  /** Clic en una tarjeta/atajo de tipo de alojamiento. El detalle es el tipo. */
  ALOJAMIENTO: 'alojamiento_click',
  /** Envío del formulario de contacto (éxito). */
  CONTACTO_ENVIADO: 'contacto_enviado',
  /** Apertura de una pregunta del FAQ. El detalle es la pregunta. */
  FAQ_ABIERTA: 'faq_abierta',
  /** Clic en "cómo llegar" / mapa. */
  MAPA: 'mapa_click',
  /** Clic en el enlace al sitio propio de un atractivo. El detalle es el atractivo. */
  ATRACTIVO: 'atractivo_click',
} as const;

export type Evento = (typeof EVENTOS)[keyof typeof EVENTOS];
