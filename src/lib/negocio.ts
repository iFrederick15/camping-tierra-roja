// Datos del negocio (NAP: Name-Address-Phone) en un único lugar.
// El SEO local exige que la dirección, el teléfono y el nombre sean idénticos
// en todas sus apariciones (Contacto, Footer, JSON-LD, páginas legales, perfil
// de Google Business). Importar desde acá en vez de re-escribir el texto.
//
// Para cambiar un dato del sitio (correo, teléfono, dirección, redes) editá
// SOLO este objeto: se refleja en todas las páginas y componentes.

export const NEGOCIO = {
  nombre: 'Tierra Roja - Camping y Parque Acuático',
  // Teléfono para mostrar (formato local legible)
  telefono: '+54 3757 31-7593',
  // Teléfono en formato E.164 (para JSON-LD, tel: y wa.me)
  telefonoE164: '+543757317593',
  whatsapp: '5493757317593',
  email: 'tierrarojaiguazu@gmail.com',
  direccion: {
    calle: 'Barrio Los Yerbales 2000 Ha',
    localidad: 'Puerto Iguazú',
    region: 'Misiones',
    pais: 'AR',
    codigoPostal: '3370',
  },
  geo: {
    lat: -25.6381084,
    lng: -54.5744466,
  },
  mapaUrl:
    'https://www.google.com/maps?q=Camping+Tierra+Roja+y+Parque+Acu%C3%A1tico,-25.6381084,-54.5744466',
  redes: {
    instagram: 'https://www.instagram.com/tierraroja_iguazu',
    facebook: 'https://www.facebook.com/tierrarojaiguazu',
    tiktok: 'https://www.tiktok.com/@tierraroja_iguazu',
  },
} as const;

// Dirección completa en una línea, para mostrar en el sitio.
export const DIRECCION_COMPLETA = `${NEGOCIO.direccion.calle}, ${NEGOCIO.direccion.localidad}, ${NEGOCIO.direccion.region}, Argentina`;

// Dirección corta en dos líneas (calle / localidad, región).
export const DIRECCION_CORTA = {
  linea1: NEGOCIO.direccion.calle,
  linea2: `${NEGOCIO.direccion.localidad}, ${NEGOCIO.direccion.region}`,
};

// Enlaces listos para usar en href.
export const CONTACTO_HREF = {
  tel: `tel:${NEGOCIO.telefonoE164}`,
  mailto: `mailto:${NEGOCIO.email}`,
  whatsapp: `https://wa.me/${NEGOCIO.whatsapp}`,
};

// URLs de redes sociales, en el orden en que se muestran / se listan en sameAs.
export const REDES = [NEGOCIO.redes.instagram, NEGOCIO.redes.facebook, NEGOCIO.redes.tiktok];

// ── Enlaces de WhatsApp con mensaje pre-cargado ───────────────────────────
// Un WhatsApp que llega con contexto ("Hola, quiero consultar por el
// camping") se responde más rápido y se pierden menos consultas. El texto
// va en el idioma en que el visitante está navegando.

const MENSAJES_WHATSAPP: Record<string, string> = {
  es: 'Hola Tierra Roja 👋 Quiero consultar disponibilidad para alojarme.',
  pt: 'Olá Tierra Roja 👋 Gostaria de consultar a disponibilidade para me hospedar.',
  en: 'Hi Tierra Roja 👋 I would like to check availability for a stay.',
};

/**
 * Enlace a WhatsApp con un mensaje inicial en el idioma del visitante.
 * `extra` permite agregar contexto (ej. el tipo de alojamiento consultado).
 */
export function whatsappHref(idioma: string = 'es', extra?: string): string {
  const base = MENSAJES_WHATSAPP[idioma] ?? MENSAJES_WHATSAPP.es;
  const texto = extra ? `${base} (${extra})` : base;
  return `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(texto)}`;
}
