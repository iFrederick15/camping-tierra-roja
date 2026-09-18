// Emails transaccionales. Decisión de producto: el email de confirmación NO
// lleva link de "gestionar mi reserva" (Opción A, acordada) — el cliente
// recibe el resumen y modificar/cancelar es contacto directo con Tierra Roja.

import { Resend } from 'resend';
import { NEGOCIO } from './negocio';
import { escaparHtml } from './html';
import type { ItemPrecio } from './reservas';
import { codigoReserva } from './codigo-reserva';
import {
  C,
  FUENTE_CUERPO,
  FUENTE_TITULO,
  bloque,
  boton,
  filaDato,
  fmtFecha,
  fmtFechaCorta,
  fmtFechaHora,
  fmtMoneda,
  plantillaEmail,
  tituloSeccion,
} from './email-plantilla';

interface DatosConfirmacion {
  /** UUID de la reserva: de ahí sale el código corto que el cliente cita. */
  reservaId: string;
  email: string;
  nombreCliente: string;
  unidadNombre: string;
  /** "Parcela 12" / nombre del quincho. `null` en camping y cabaña. */
  parcelaNombre?: string | null;
  /** Fechas de estadía en ISO corto (`'2026-09-20'`), no `Date`: son días sin
   *  hora y convertirlas a `Date` las corre un día según el huso del server. */
  fechaIngreso: string;
  fechaSalida: string;
  noches: number;
  /** Itemizado tal como quedó guardado en `reservas.detalle_precio`. Sirve de
   *  desglose y, de paso, deja asentado cuántas personas se cobraron. */
  detalle: ItemPrecio[];
  montoTotal: number;
  // Reservas web: plazo para transferir (vencido sin pago, la reserva se
  // cancela sola). `null` en las reservas manuales que carga Staff desde el
  // Panel: no vencen y el pago se coordina en el mostrador o por teléfono, así
  // que el email sale sin plazo (ver PRODUCT.md § Operating Context).
  fechaLimitePago: Date | null;
}

/**
 * Datos bancarios para la transferencia, desde variables de entorno.
 *
 * Están en env y no en el código porque son datos sensibles del negocio que
 * cambian sin necesidad de un deploy. Si no están cargadas devuelve `null` y
 * el email pide los datos por WhatsApp en vez de mostrar un hueco: la regla
 * del proyecto es no inventar datos ni mostrar marcadores de posición al
 * cliente (ver PRODUCT.md § Reglas de contenido).
 *
 * Alcanza con el titular y UNA forma de transferir (CBU o alias): con el alias
 * solo ya se transfiere desde cualquier banco o billetera. Antes se exigían
 * las tres variables y un CBU sin cargar borraba todo el bloque del email,
 * que es exactamente el hueco que se quería evitar.
 */
function datosBancarios(): { titular: string; cbu: string; alias: string; banco: string } | null {
  const titular = import.meta.env.PAGO_TITULAR;
  const cbu = import.meta.env.PAGO_CBU;
  const alias = import.meta.env.PAGO_ALIAS;
  if (!titular || (!cbu && !alias)) return null;
  return {
    titular,
    cbu: cbu || '',
    alias: alias || '',
    banco: import.meta.env.PAGO_BANCO || '',
  };
}

/**
 * Las filas de la cuenta a mostrar, en orden y sin las que no tengan dato.
 * Una sola fuente para el HTML y para el texto plano: así no puede pasar que
 * una versión del email muestre el alias y la otra no.
 */
function datosCuenta(
  banco: NonNullable<ReturnType<typeof datosBancarios>>
): Array<{ etiqueta: string; valor: string }> {
  return [
    { etiqueta: 'Titular', valor: banco.titular },
    { etiqueta: 'Banco', valor: banco.banco },
    { etiqueta: 'CBU', valor: banco.cbu },
    { etiqueta: 'Alias', valor: banco.alias },
  ].filter((fila) => fila.valor);
}

/**
 * Remitente de los emails transaccionales.
 *
 * Sale de env porque Resend solo entrega si el dominio del remitente está
 * verificado en su panel: mientras `tierrarojaiguazu.com` no lo esté, poniendo
 * `EMAIL_FROM="Tierra Roja <onboarding@resend.dev>"` se puede probar el flujo
 * completo en producción (ese remitente presta Resend y solo entrega a la
 * casilla dueña de la cuenta). Verificado el dominio, se borra la variable y
 * vuelve a usarse el remitente propio sin tocar el código.
 */
function remitente(porDefecto: string): string {
  return import.meta.env.EMAIL_FROM || porDefecto;
}

/** Porcentaje del total que se pide como seña si no se configuró otro. */
const PORCENTAJE_SENA_DEFECTO = 50;

/**
 * Cuánto hay que transferir como mínimo para dejar la reserva firme.
 *
 * El porcentaje sale de `PAGO_SENA_PORCENTAJE` para que se pueda cambiar por
 * temporada sin un deploy. Un valor ausente o fuera de rango cae al 50%: es
 * preferible a mostrarle al cliente una seña de $0 o mayor que el total.
 */
function calcularSena(montoTotal: number): { monto: number; porcentaje: number; saldo: number } {
  const configurado = Number(import.meta.env.PAGO_SENA_PORCENTAJE);
  const porcentaje =
    Number.isFinite(configurado) && configurado > 0 && configurado <= 100
      ? configurado
      : PORCENTAJE_SENA_DEFECTO;
  const monto = Math.round((montoTotal * porcentaje) / 100);
  return { monto, porcentaje, saldo: montoTotal - monto };
}

/**
 * Arma el email de confirmación (asunto, HTML y texto plano) sin enviarlo.
 *
 * Está separado del envío para poder previsualizarlo y testearlo sin gastar
 * envíos de Resend — ver `src/lib/email.test.ts` y `scripts/preview-email.mjs`.
 */
export function construirEmailConfirmacion(datos: DatosConfirmacion): {
  subject: string;
  html: string;
  text: string;
} {
  const codigo = codigoReserva(datos.reservaId);
  const nombre = escaparHtml(datos.nombreCliente);
  const unidad = escaparHtml(datos.unidadNombre);
  const ingreso = fmtFecha(datos.fechaIngreso);
  const salida = fmtFecha(datos.fechaSalida);
  const total = fmtMoneda(datos.montoTotal);

  const waComprobante = `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(
    `Hola Camping Tierra Roja, envío el comprobante de la reserva ${codigo} a nombre de ${datos.nombreCliente}.`
  )}`;
  const waConsulta = `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(
    `Hola Camping Tierra Roja, consulto por la reserva ${codigo} a nombre de ${datos.nombreCliente}.`
  )}`;

  // ── Encabezado ────────────────────────────────────────────────────────
  const encabezado = bloque(`
      <p style="margin:0 0 10px;font-family:${FUENTE_CUERPO};font-size:16px;color:${C.texto};">Hola ${nombre},</p>
      <h1 style="margin:0 0 12px;font-family:${FUENTE_TITULO};font-size:27px;line-height:1.2;font-weight:700;color:${C.texto};">Tu reserva se realizó con éxito.</h1>
      <p style="margin:0;font-family:${FUENTE_CUERPO};font-size:15px;line-height:23px;color:${C.textoSuave};">
        Te esperamos en Puerto Iguazú. Guarda este correo: el código de reserva es lo único que necesitas al llegar.
      </p>`);

  // Código de reserva, en una caja aparte para que se encuentre de un
  // vistazo cuando el cliente vuelva a abrir el email en la entrada.
  const cajaCodigo = bloque(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.fondoCrema};border:1px solid ${C.borde};border-radius:10px;">
        <tr>
          <td align="center" style="padding:16px 20px;">
            <p style="margin:0 0 4px;font-family:${FUENTE_CUERPO};font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:${C.textoSuave};">Código de reserva</p>
            <p style="margin:0;font-family:${FUENTE_TITULO};font-size:24px;font-weight:700;letter-spacing:.12em;color:${C.primario};">${codigo}</p>
          </td>
        </tr>
      </table>`);

  // ── Estadía ───────────────────────────────────────────────────────────
  const filasEstadia = [
    filaDato('Alojamiento', unidad),
    datos.parcelaNombre ? filaDato('Ubicación asignada', escaparHtml(datos.parcelaNombre)) : '',
    filaDato('Ingreso', ingreso),
    filaDato('Salida', `${salida}, hasta las 10:00 hs`),
    filaDato('Noches', String(datos.noches), true),
  ].join('');

  const estadia = bloque(`
      ${tituloSeccion('Tu estadía')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${filasEstadia}</table>`);

  // ── Detalle de precio ─────────────────────────────────────────────────
  // El itemizado viene de `opciones_precio` (lo edita la dueña desde el
  // Panel), así que se escapa igual que cualquier dato de entrada.
  const filasDetalle = datos.detalle
    .map((i) =>
      filaDato(
        `${escaparHtml(i.etiqueta)}${i.cantidad > 1 ? ` × ${i.cantidad}` : ''}`,
        fmtMoneda(i.subtotal)
      )
    )
    .join('');

  const precio = bloque(`
      ${tituloSeccion('Detalle')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${filasDetalle}
        <tr>
          <td style="padding:14px 0 0;font-family:${FUENTE_TITULO};font-size:17px;font-weight:700;color:${C.texto};">Total</td>
          <td align="right" style="padding:14px 0 0;font-family:${FUENTE_TITULO};font-size:20px;font-weight:700;color:${C.primario};">${total}</td>
        </tr>
      </table>
      ${
        datos.noches > 1
          ? `<p style="margin:10px 0 0;font-family:${FUENTE_CUERPO};font-size:12px;color:${C.textoSuave};">Los importes del detalle corresponden a las ${datos.noches} noches.</p>`
          : ''
      }`);

  // ── Pago ──────────────────────────────────────────────────────────────
  const sena = calcularSena(datos.montoTotal);
  // Con la seña al 100% no hay saldo que dejar para el ingreso: el desglose y
  // la recomendación de pagar el total sobran y quedarían diciendo "Saldo $0".
  const haySaldo = sena.saldo > 0;

  const filasSena = haySaldo
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${filaDato(`Seña (${sena.porcentaje}% del total)`, fmtMoneda(sena.monto))}
          ${filaDato('Saldo al ingresar', fmtMoneda(sena.saldo), true)}
        </table>
        <!-- Sugerencia de pagar el total: le ahorra a Staff cobrar en el
             ingreso y al cliente llegar con efectivo. Va en una línea aparte,
             no como texto corrido, porque es la acción que queremos que elija. -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;background-color:${C.superficie};border:1px solid ${C.borde};border-radius:8px;">
          <tr>
            <td style="padding:12px 16px;font-family:${FUENTE_CUERPO};font-size:14px;line-height:21px;color:${C.texto};">
              Te recomendamos transferir el total de <strong style="color:${C.primario};">${total}</strong>: llegas con todo pago y no tienes que hacer trámites al ingresar.
            </td>
          </tr>
        </table>`
    : '';

  const banco = datosBancarios();
  // Solo las filas que tienen dato cargado: el banco es opcional y el CBU y el
  // alias son alternativas entre sí. El borde inferior se le saca a la última
  // fila que quedó, sea cual sea (si falta el alias, la última es el CBU).
  const filasCuenta = banco
    ? datosCuenta(banco).map((fila, i, todas) =>
        filaDato(fila.etiqueta, escaparHtml(fila.valor), i === todas.length - 1)
      )
    : [];
  const filasBanco = filasCuenta.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
          ${filasCuenta.join('')}
        </table>`
    : `<p style="margin:14px 0 0;font-family:${FUENTE_CUERPO};font-size:14px;line-height:22px;color:${C.texto};">
          Escríbenos por WhatsApp y te pasamos los datos para transferir.
        </p>`;

  const pago = datos.fechaLimitePago
    ? bloque(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.fondoCrema};border:1px solid ${C.borde};border-left:4px solid ${C.primario};border-radius:10px;">
          <tr>
            <td class="pad" style="padding:22px 24px;">
              ${tituloSeccion('Para confirmar tu reserva')}
              <p style="margin:0 0 4px;font-family:${FUENTE_CUERPO};font-size:15px;line-height:23px;color:${C.texto};">
                ${haySaldo ? 'Transfiere al menos la seña antes del' : `Transfiere el total de <strong>${total}</strong> antes del`}
                <strong style="color:${C.primario};">${fmtFechaHora(datos.fechaLimitePago)}</strong>
                y envíanos el comprobante por WhatsApp.
              </p>
              ${filasSena}
              ${filasBanco}
              <p style="margin:14px 0 0;font-family:${FUENTE_CUERPO};font-size:13px;line-height:20px;color:${C.textoSuave};">
                Si al vencer el plazo no registramos ningún pago, la reserva se cancela automáticamente y las fechas se liberan.
              </p>
              <div style="margin-top:20px;">${boton(waComprobante, 'Enviar comprobante', C.whatsapp)}</div>
            </td>
          </tr>
        </table>`)
    : bloque(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.fondoCrema};border:1px solid ${C.borde};border-left:4px solid ${C.primario};border-radius:10px;">
          <tr>
            <td class="pad" style="padding:22px 24px;">
              ${tituloSeccion('Pago')}
              <p style="margin:0;font-family:${FUENTE_CUERPO};font-size:15px;line-height:23px;color:${C.texto};">
                El pago de esta reserva se coordina directamente con nosotros. Si tienes dudas, escríbenos por WhatsApp al ${NEGOCIO.telefono}.
              </p>
            </td>
          </tr>
        </table>`);

  // ── Cómo llegar ───────────────────────────────────────────────────────
  const llegar = bloque(`
      ${tituloSeccion('Cómo llegar')}
      <p style="margin:0 0 16px;font-family:${FUENTE_CUERPO};font-size:15px;line-height:23px;color:${C.texto};">
        <a href="${NEGOCIO.mapaUrl}" style="color:${C.texto};text-decoration:underline;">${NEGOCIO.direccion.calle}, ${NEGOCIO.direccion.localidad}, ${NEGOCIO.direccion.region}</a>.<br>
        <span style="color:${C.textoSuave};">Trae tu DNI: lo pedimos al ingresar.</span>
      </p>
      ${boton(NEGOCIO.mapaUrl, 'Ver en el mapa')}`);

  // ── Cambios ───────────────────────────────────────────────────────────
  const cambios = bloque(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.borde};">
        <tr>
          <td style="padding:22px 0 0;">
            <p style="margin:0;font-family:${FUENTE_CUERPO};font-size:14px;line-height:22px;color:${C.textoSuave};">
              ¿Necesitas cambiar o cancelar la reserva? Escríbenos por
              <a href="${waConsulta}" style="color:${C.primario};font-weight:600;text-decoration:none;">WhatsApp</a>
              o llámanos al <a href="tel:${NEGOCIO.telefonoE164}" style="color:${C.primario};font-weight:600;text-decoration:none;">${NEGOCIO.telefono}</a>, citando el código ${codigo}.
            </p>
          </td>
        </tr>
      </table>`,
    '30px'
  );

  const html = plantillaEmail({
    preheader: `Código ${codigo} · ${datos.unidadNombre}, del ${fmtFechaCorta(datos.fechaIngreso)} al ${fmtFechaCorta(datos.fechaSalida)} · Total ${total}`,
    contenido: encabezado + cajaCodigo + estadia + precio + pago + llegar + cambios,
  });

  return {
    // El asunto lleva alojamiento y fecha para que se distinga en la bandeja
    // sin abrirlo (y para que se encuentre buscando "Camping" meses después).
    subject: `Reserva realizada — ${datos.unidadNombre}, ${fmtFechaCorta(datos.fechaIngreso)}`,
    html,
    // Alternativa en texto plano. No es un detalle estético: un email solo
    // en HTML puntúa peor en los filtros de spam y se lee mal en relojes y
    // clientes con imágenes bloqueadas.
    text: textoConfirmacion(datos, codigo, banco),
  };
}

// La reserva ya quedó guardada en la base antes de llamar a esta función —
// el email de confirmación es un "mejor esfuerzo": si falla (key de Resend
// vacía/inválida, corte de red, etc.) no debe tirar abajo la confirmación
// de la reserva. `new Resend(...)` valida la key al construirse, así que se
// crea acá adentro (no a nivel de módulo) para que ese error no rompa el
// import de este archivo entero.
export async function enviarEmailConfirmacion(datos: DatosConfirmacion) {
  try {
    // Sin clave no hay nada que intentar, y conviene que el log lo diga con
    // todas las letras: el síntoma ("no me llegó el mail") es idéntico al de
    // un rebote de Resend, pero la causa y el arreglo son muy distintos.
    if (!import.meta.env.RESEND_API_KEY) {
      console.error(
        `RESEND_API_KEY no está configurada — la reserva ${datos.reservaId} se creó, ` +
          `pero el cliente NO recibió el email de confirmación.`
      );
      return;
    }

    const resend = new Resend(import.meta.env.RESEND_API_KEY);
    const { subject, html, text } = construirEmailConfirmacion(datos);

    const { error } = await resend.emails.send({
      from: remitente('Tierra Roja <reservas@tierrarojaiguazu.com>'),
      to: datos.email,
      replyTo: NEGOCIO.email,
      subject,
      html,
      text,
    });

    // Resend no lanza excepción cuando rechaza el envío (dominio sin
    // verificar, destinatario inválido): devuelve `error` y el catch de abajo
    // nunca se entera. Sin esto, un rechazo se veía exactamente igual que un
    // envío exitoso.
    if (error) {
      console.error(
        `Resend rechazó el email de confirmación de la reserva ${datos.reservaId}:`,
        error
      );
    }
  } catch (e) {
    console.error('No se pudo enviar el email de confirmación de reserva:', e);
  }
}

/** Versión en texto plano del email de confirmación. */
function textoConfirmacion(
  datos: DatosConfirmacion,
  codigo: string,
  banco: ReturnType<typeof datosBancarios>
): string {
  const lineas = [
    `Hola ${datos.nombreCliente},`,
    '',
    'Tu reserva en Tierra Roja está confirmada.',
    '',
    `Código de reserva: ${codigo}`,
    '',
    'TU ESTADÍA',
    `Alojamiento: ${datos.unidadNombre}`,
  ];
  if (datos.parcelaNombre) lineas.push(`Ubicación asignada: ${datos.parcelaNombre}`);
  lineas.push(
    `Ingreso: ${fmtFecha(datos.fechaIngreso)}`,
    `Salida: ${fmtFecha(datos.fechaSalida)}, hasta las 10:00 hs`,
    `Noches: ${datos.noches}`,
    '',
    'DETALLE',
    ...datos.detalle.map(
      (i) => `- ${i.etiqueta}${i.cantidad > 1 ? ` x ${i.cantidad}` : ''}: ${fmtMoneda(i.subtotal)}`
    ),
    `Total: ${fmtMoneda(datos.montoTotal)}`,
    ''
  );

  if (datos.fechaLimitePago) {
    const sena = calcularSena(datos.montoTotal);
    lineas.push('PARA DEJARLA FIRME');
    if (sena.saldo > 0) {
      lineas.push(
        `Transfiere al menos la seña antes del ${fmtFechaHora(datos.fechaLimitePago)} y envíanos el comprobante por WhatsApp.`,
        `Seña (${sena.porcentaje}% del total): ${fmtMoneda(sena.monto)}`,
        `Saldo al ingresar: ${fmtMoneda(sena.saldo)}`,
        `Te recomendamos transferir el total de ${fmtMoneda(datos.montoTotal)}: llegas con todo pago y no tienes que hacer trámites al ingresar.`
      );
    } else {
      lineas.push(
        `Transfiere el total de ${fmtMoneda(datos.montoTotal)} antes del ${fmtFechaHora(datos.fechaLimitePago)} y envíanos el comprobante por WhatsApp.`
      );
    }
    if (banco) {
      lineas.push(...datosCuenta(banco).map((fila) => `${fila.etiqueta}: ${fila.valor}`));
    } else {
      lineas.push('Escríbenos por WhatsApp y te pasamos los datos para transferir.');
    }
    lineas.push(
      'Si al vencer el plazo no registramos ningún pago, la reserva se cancela automáticamente y las fechas se liberan.'
    );
  } else {
    lineas.push('PAGO', 'El pago de esta reserva se coordina directamente con nosotros.');
  }

  lineas.push(
    '',
    'CÓMO LLEGAR',
    `${NEGOCIO.direccion.calle}, ${NEGOCIO.direccion.localidad}, ${NEGOCIO.direccion.region}.`,
    'Trae tu DNI: lo pedimos al ingresar.',
    NEGOCIO.mapaUrl,
    '',
    `¿Necesitas cambiar o cancelar la reserva? Escríbenos al ${NEGOCIO.telefono} citando el código ${codigo}.`,
    '',
    NEGOCIO.nombre,
    `${NEGOCIO.telefono} · ${NEGOCIO.email}`
  );

  return lineas.join('\n');
}

interface DatosPago {
  reservaId: string;
  email: string;
  nombreCliente: string;
  unidadNombre: string;
  fechaIngreso: string;
  fechaSalida: string;
  /** Lo que se acaba de registrar, no el acumulado. */
  monto: number;
  metodo: string;
  montoTotal: number;
  /** Acumulado de la reserva, ya incluido este pago. */
  montoPagado: number;
}

/**
 * Arma el email de pago recibido sin enviarlo (mismo motivo que
 * `construirEmailConfirmacion`: previsualizar y testear sin Resend).
 *
 * Es el comprobante del cliente: cuánto entró, cuánto lleva pagado y cuánto
 * le queda para el ingreso. Con el primer pago la reserva pasa de REALIZADA a
 * CONFIRMADA (ver sql/012), así que también le avisa que ya no se cancela sola.
 */
export function construirEmailPago(datos: DatosPago): {
  subject: string;
  html: string;
  text: string;
} {
  const codigo = codigoReserva(datos.reservaId);
  const nombre = escaparHtml(datos.nombreCliente);
  const unidad = escaparHtml(datos.unidadNombre);
  const saldo = Math.max(datos.montoTotal - datos.montoPagado, 0);
  const pagada = saldo === 0;

  const encabezado = bloque(`
      <p style="margin:0 0 10px;font-family:${FUENTE_CUERPO};font-size:16px;color:${C.texto};">Hola ${nombre},</p>
      <h1 style="margin:0 0 12px;font-family:${FUENTE_TITULO};font-size:27px;line-height:1.2;font-weight:700;color:${C.texto};">Recibimos tu pago de ${fmtMoneda(datos.monto)}.</h1>
      <p style="margin:0;font-family:${FUENTE_CUERPO};font-size:15px;line-height:23px;color:${C.textoSuave};">
        ${
          pagada
            ? 'Tu reserva está confirmada y totalmente paga: al llegar no tienes nada más que abonar.'
            : `Tu reserva está confirmada. Te queda un saldo de <strong style="color:${C.texto};">${fmtMoneda(saldo)}</strong>, que puedes abonar al ingresar.`
        }
      </p>`);

  const filasPago = [
    filaDato('Código de reserva', codigo),
    filaDato('Alojamiento', unidad),
    filaDato(
      'Estadía',
      `${fmtFechaCorta(datos.fechaIngreso)} al ${fmtFechaCorta(datos.fechaSalida)}`
    ),
    filaDato('Pago recibido', `${fmtMoneda(datos.monto)} (${escaparHtml(datos.metodo)})`),
    filaDato('Total de la reserva', fmtMoneda(datos.montoTotal)),
    filaDato('Pagado hasta hoy', fmtMoneda(datos.montoPagado), pagada),
    pagada ? '' : filaDato('Saldo al ingresar', fmtMoneda(saldo), true),
  ].join('');

  const detalle = bloque(`
      ${tituloSeccion('Detalle del pago')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${filasPago}</table>`);

  const cierre = bloque(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.borde};">
        <tr>
          <td style="padding:22px 0 0;">
            <p style="margin:0;font-family:${FUENTE_CUERPO};font-size:14px;line-height:22px;color:${C.textoSuave};">
              ¿Algo no coincide? Escríbenos por WhatsApp o llámanos al
              <a href="tel:${NEGOCIO.telefonoE164}" style="color:${C.primario};font-weight:600;text-decoration:none;">${NEGOCIO.telefono}</a>, citando el código ${codigo}.
            </p>
          </td>
        </tr>
      </table>`,
    '30px'
  );

  const html = plantillaEmail({
    preheader: `Reserva ${codigo} · Pagado ${fmtMoneda(datos.montoPagado)} de ${fmtMoneda(datos.montoTotal)}`,
    contenido: encabezado + detalle + cierre,
  });

  const text = [
    `Hola ${datos.nombreCliente},`,
    '',
    `Recibimos tu pago de ${fmtMoneda(datos.monto)}.`,
    pagada
      ? 'Tu reserva está confirmada y totalmente paga: al llegar no tienes nada más que abonar.'
      : `Tu reserva está confirmada. Te queda un saldo de ${fmtMoneda(saldo)}, que puedes abonar al ingresar.`,
    '',
    'DETALLE DEL PAGO',
    `Código de reserva: ${codigo}`,
    `Alojamiento: ${datos.unidadNombre}`,
    `Estadía: ${fmtFechaCorta(datos.fechaIngreso)} al ${fmtFechaCorta(datos.fechaSalida)}`,
    `Pago recibido: ${fmtMoneda(datos.monto)} (${datos.metodo})`,
    `Total de la reserva: ${fmtMoneda(datos.montoTotal)}`,
    `Pagado hasta hoy: ${fmtMoneda(datos.montoPagado)}`,
    ...(pagada ? [] : [`Saldo al ingresar: ${fmtMoneda(saldo)}`]),
    '',
    `¿Algo no coincide? Escríbenos al ${NEGOCIO.telefono} citando el código ${codigo}.`,
    '',
    NEGOCIO.nombre,
    `${NEGOCIO.telefono} · ${NEGOCIO.email}`,
  ].join('\n');

  return {
    subject: pagada
      ? `Pago recibido — reserva ${codigo} totalmente paga`
      : `Pago recibido — reserva ${codigo}`,
    html,
    text,
  };
}

// Mejor esfuerzo, igual que la confirmación: el pago ya quedó registrado y un
// fallo de Resend no puede hacer que Staff crea que no se guardó y lo cargue
// dos veces.
export async function enviarEmailPago(datos: DatosPago) {
  try {
    if (!import.meta.env.RESEND_API_KEY) {
      console.error(
        `RESEND_API_KEY no está configurada — el pago de la reserva ${datos.reservaId} se registró, ` +
          `pero el cliente NO recibió el email.`
      );
      return;
    }

    const resend = new Resend(import.meta.env.RESEND_API_KEY);
    const { subject, html, text } = construirEmailPago(datos);

    const { error } = await resend.emails.send({
      from: remitente('Tierra Roja <reservas@tierrarojaiguazu.com>'),
      to: datos.email,
      replyTo: NEGOCIO.email,
      subject,
      html,
      text,
    });

    if (error) {
      console.error(`Resend rechazó el email de pago de la reserva ${datos.reservaId}:`, error);
    }
  } catch (e) {
    console.error('No se pudo enviar el email de pago:', e);
  }
}

interface DatosContacto {
  nombre: string;
  email: string;
  tipoConsulta: string;
  mensaje: string;
}

// Reenvía a la casilla del negocio el mensaje del formulario de /contacto.
// A diferencia del email de confirmación, acá el resultado sí importa: se
// propaga el error para que la API responda 502 y el front muestre "no se
// pudo enviar" (así el usuario recurre a WhatsApp en vez de creer que llegó).
// Va sin plantilla de marca a propósito: es un aviso interno, y el HTML
// mínimo se lee mejor en la bandeja de Staff.
export async function enviarEmailContacto(datos: DatosContacto) {
  // Se lanza en vez de registrar y seguir: acá el silencio es peor que el
  // error. Si no hay clave, el visitante vería "mensaje enviado" y se quedaría
  // esperando una respuesta que nadie va a leer.
  if (!import.meta.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no está configurada: no se puede enviar el email de contacto');
  }

  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  const destino = import.meta.env.CONTACTO_EMAIL_DESTINO || NEGOCIO.email;

  const { error } = await resend.emails.send({
    from: remitente('Web Tierra Roja <web@tierrarojaiguazu.com>'),
    to: destino,
    replyTo: datos.email,
    subject: `Consulta web (${datos.tipoConsulta}) — ${datos.nombre}`,
    html: `
      <h2>Nuevo mensaje desde el formulario de contacto</h2>
      <p><b>Nombre:</b> ${escaparHtml(datos.nombre)}</p>
      <p><b>Email:</b> ${escaparHtml(datos.email)}</p>
      <p><b>Tipo de consulta:</b> ${escaparHtml(datos.tipoConsulta)}</p>
      <p><b>Mensaje:</b></p>
      <p>${escaparHtml(datos.mensaje).replace(/\n/g, '<br/>')}</p>
    `,
  });

  // Resend devuelve `error` en vez de lanzar. Sin este chequeo, /api/contacto
  // respondía 200 y el visitante leía "mensaje enviado" aunque Resend lo
  // hubiera rechazado (dominio sin verificar, casilla inválida).
  if (error) {
    throw new Error(`Resend rechazó el email de contacto: ${error.message}`);
  }
}
