// Datos del negocio (NAP: Name-Address-Phone) en un único lugar.
// El SEO local exige que la dirección, el teléfono y el nombre sean idénticos
// en todas sus apariciones (Contacto, Footer, JSON-LD, páginas legales, perfil
// de Google Business). Importar desde acá en vez de re-escribir el texto.

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
} as const;

// Dirección completa en una línea, para mostrar en el sitio.
export const DIRECCION_COMPLETA = `${NEGOCIO.direccion.calle}, ${NEGOCIO.direccion.localidad}, ${NEGOCIO.direccion.region}, Argentina`;
