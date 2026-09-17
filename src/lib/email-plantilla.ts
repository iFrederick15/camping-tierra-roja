// Armazón HTML de los emails que salen al cliente (confirmación de reserva).
//
// Un email no es una página web: Gmail borra el <style> del <head> en la
// versión web, Outlook de escritorio renderiza con el motor de Word (sin
// flexbox, sin grid, sin float) y varios clientes ignoran los estilos que no
// están inline. Por eso todo acá está hecho con <table> anidadas y atributos
// `style` inline, aunque el resto del proyecto use Tailwind.
//
// La única regla del <style> que importa es la media query de mobile, y
// justamente los clientes que la borran (Gmail webmail) son los que ya
// muestran el contenedor a 600px sin problema.

import { NEGOCIO, DIRECCION_COMPLETA } from './negocio';

// El logo tiene que viajar como URL absoluta y pública: los clientes de email
// no resuelven rutas relativas. Se usa un PNG y no el .webp del sitio porque
// Outlook de escritorio y varias versiones de Yahoo no saben decodificar webp
// (mostrarían el alt text en vez de la marca).
//
// `import.meta.env.SITE` es el `site` de astro.config.mjs. `EMAIL_BASE_URL`
// existe para apuntar a otro host mientras el dominio definitivo no esté
// conectado en Vercel (ver DATOS-PENDIENTES.md): si el logo apunta a un
// dominio que todavía no resuelve, el email llega con un cuadro roto.
const BASE_URL = (
  import.meta.env.EMAIL_BASE_URL ||
  import.meta.env.SITE ||
  'https://tierraroja.com.ar'
).replace(/\/$/, '');

export const LOGO_URL = `${BASE_URL}/images/marca/logo-email.png`;

// Paleta de marca — los mismos valores que `@theme` en src/styles/global.css.
// Acá van hardcodeados porque en un email no hay custom properties de CSS
// (Outlook no las resuelve y devolvería `color: inherit`).
export const C = {
  primario: '#b01c2e',
  texto: '#2d2321',
  textoSuave: '#6b5b55',
  superficie: '#ffffff',
  fondo: '#f5efec',
  fondoCrema: '#fdf8f6',
  borde: '#e3d5ce',
  confirmado: '#137a38',
  advertencia: '#8f6519',
  whatsapp: '#0d6d61',
} as const;

// Ubuntu (títulos) y Barlow (cuerpo) son las fuentes del manual de marca.
// Apple Mail y iOS Mail las cargan por el @import; Gmail y Outlook lo ignoran
// y caen a Arial, por eso la pila termina siempre en una fuente del sistema.
export const FUENTE_TITULO = "'Ubuntu', 'Barlow', Arial, Helvetica, sans-serif";
export const FUENTE_CUERPO = "'Barlow', Arial, Helvetica, sans-serif";

const TZ = 'America/Argentina/Buenos_Aires';

/**
 * Fecha de estadía (`'2026-09-20'`) en texto legible.
 *
 * Se formatea en UTC a propósito: son fechas sin hora, y `new Date('2026-09-20')`
 * las ubica a medianoche UTC. Formatearlas en huso de Argentina (UTC-3) las
 * correría a las 21:00 del día anterior y el cliente leería un día menos.
 */
export function fmtFecha(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-AR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Igual que `fmtFecha` pero sin el día de la semana, para el asunto y la
 *  línea de vista previa, donde el ancho está contado. */
export function fmtFechaCorta(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-AR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Vencimiento del pago, con hora.
 *
 * Al revés que `fmtFecha`, acá sí hay que forzar el huso de Argentina: es un
 * instante real y el servidor de Vercel corre en UTC, así que sin `timeZone`
 * el cliente vería el plazo 3 horas adelantado.
 */
export function fmtFechaHora(d: Date): string {
  const fecha = d.toLocaleDateString('es-AR', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  // `hour12: false` explícito: es-AR devuelve "06:00 p. m." por defecto en
  // Node, y con el "hs" del final quedaría "06:00 p. m. hs".
  const hora = d.toLocaleTimeString('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${fecha} a las ${hora} hs`;
}

/** Importe en pesos. Muestra decimales solo si el precio los tiene. */
export function fmtMoneda(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Botón "a prueba de balas": una tabla con fondo, no un <a> con padding.
 * Outlook ignora el padding de un enlace y dejaría el botón del alto del
 * texto; con la celda de por medio el área clickeable queda completa.
 * El `border-radius` lo aplican los clientes que pueden y Outlook lo muestra
 * recto, que es una degradación aceptable.
 */
export function boton(href: string, texto: string, color: string = C.primario): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" bgcolor="${color}" style="border-radius:999px;">
          <a href="${href}" style="display:inline-block;padding:13px 30px;font-family:${FUENTE_CUERPO};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${texto}</a>
        </td>
      </tr>
    </table>`;
}

/** Fila etiqueta / valor de las tablas de datos. */
export function filaDato(etiqueta: string, valor: string, ultima = false): string {
  const borde = ultima ? '' : `border-bottom:1px solid ${C.borde};`;
  return `
    <tr>
      <td style="padding:11px 0;${borde}font-family:${FUENTE_CUERPO};font-size:14px;color:${C.textoSuave};vertical-align:top;">${etiqueta}</td>
      <td align="right" style="padding:11px 0;${borde}font-family:${FUENTE_CUERPO};font-size:14px;font-weight:600;color:${C.texto};vertical-align:top;">${valor}</td>
    </tr>`;
}

/** Título de sección: versalitas finas, sin iconos ni emojis. */
export function tituloSeccion(texto: string): string {
  return `<p style="margin:0 0 12px;font-family:${FUENTE_CUERPO};font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:${C.primario};">${texto}</p>`;
}

/** Celda de contenido del cuerpo, con el padding lateral estándar. */
export function bloque(html: string, paddingExtra = ''): string {
  return `<tr><td style="padding:0 32px ${paddingExtra || '28px'};">${html}</td></tr>`;
}

interface OpcionesPlantilla {
  /** Línea de vista previa que muestran Gmail y Apple Mail junto al asunto. */
  preheader: string;
  /** HTML del cuerpo: una secuencia de `<tr>` (usar `bloque()`). */
  contenido: string;
}

/**
 * Envuelve el contenido en la cabecera con el logo y el pie con los datos de
 * contacto. El logo va sobre fondo blanco porque el archivo de marca tiene
 * fondo blanco opaco: sobre la banda roja se vería un recuadro.
 */
export function plantillaEmail({ preheader, contenido }: OpcionesPlantilla): string {
  return `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${NEGOCIO.nombre}</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<style>
  /* Outlook de escritorio no carga fuentes web y, si la primera de la pila no
     está instalada, cae a Times New Roman. Se le fija Arial explícitamente. */
  * { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Ubuntu:wght@700&display=swap');
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  /* Evita que iOS convierta fechas y montos en enlaces azules. */
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
  @media only screen and (max-width:620px) {
    .contenedor { width:100% !important; border-radius:0 !important; border-left:0 !important; border-right:0 !important; }
    .pad { padding-left:20px !important; padding-right:20px !important; }
    .apilar { display:block !important; width:100% !important; padding-right:0 !important; }
    .apilar-sep { padding-top:16px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.fondo};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.fondo};">${preheader}</div>
  <!-- Espacios invisibles: evitan que Gmail siga la vista previa con el texto
       del pie si el preheader es más corto que el ancho que muestra. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.fondo};">
    <tr>
      <td align="center" style="padding:28px 10px 36px;">

        <table role="presentation" class="contenedor" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:${C.superficie};border:1px solid ${C.borde};border-radius:14px;overflow:hidden;">

          <!-- Cabecera: logo sobre blanco + filete rojo de marca -->
          <tr>
            <td align="center" style="padding:30px 24px 22px;background-color:${C.superficie};">
              <img src="${LOGO_URL}" width="200" alt="${NEGOCIO.nombre}" style="display:block;width:200px;max-width:62%;height:auto;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background-color:${C.primario};">&nbsp;</td>
          </tr>

          <tr><td style="height:30px;line-height:30px;font-size:0;">&nbsp;</td></tr>
${contenido}

          <!-- Pie -->
          <tr>
            <td class="pad" style="padding:26px 32px 30px;background-color:${C.fondoCrema};border-top:1px solid ${C.borde};">
              <p style="margin:0 0 6px;font-family:${FUENTE_TITULO};font-size:15px;font-weight:700;color:${C.texto};">${NEGOCIO.nombre}</p>
              <p style="margin:0 0 14px;font-family:${FUENTE_CUERPO};font-size:13px;line-height:20px;color:${C.textoSuave};">
                ${DIRECCION_COMPLETA}<br>
                <a href="tel:${NEGOCIO.telefonoE164}" style="color:${C.textoSuave};text-decoration:none;">${NEGOCIO.telefono}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${NEGOCIO.email}" style="color:${C.textoSuave};text-decoration:none;">${NEGOCIO.email}</a>
              </p>
              <p style="margin:0 0 14px;font-family:${FUENTE_CUERPO};font-size:13px;color:${C.textoSuave};">
                <a href="${NEGOCIO.redes.instagram}" style="color:${C.primario};text-decoration:none;font-weight:600;">Instagram</a>
                &nbsp;·&nbsp;
                <a href="${NEGOCIO.redes.facebook}" style="color:${C.primario};text-decoration:none;font-weight:600;">Facebook</a>
                &nbsp;·&nbsp;
                <a href="${BASE_URL}" style="color:${C.primario};text-decoration:none;font-weight:600;">tierraroja.com.ar</a>
              </p>
              <p style="margin:0;font-family:${FUENTE_CUERPO};font-size:11px;line-height:17px;color:${C.textoSuave};">
                Recibes este correo porque hiciste una reserva en Tierra Roja. No es un correo publicitario y no hace falta darse de baja.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
