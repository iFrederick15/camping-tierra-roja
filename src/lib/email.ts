// Email de confirmación tras reservar. Decisión de producto: SIN link de
// "gestionar mi reserva" (Opción A, acordada) — el cliente solo recibe el
// resumen. Modificar/cancelar = contacto directo con Tierra Roja.

import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface DatosConfirmacion {
  email: string;
  nombreCliente: string;
  unidadNombre: string;
  fechaIngreso: Date;
  fechaSalida: Date;
  montoTotal: number;
  fechaLimitePago: Date;
}

export async function enviarEmailConfirmacion(datos: DatosConfirmacion) {
  const fmt = (d: Date) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

  await resend.emails.send({
    from: 'Tierra Roja <reservas@tierraroja.com.ar>',
    to: datos.email,
    subject: `Reserva confirmada — ${datos.unidadNombre}`,
    html: `
      <h2>¡Tu reserva está confirmada!</h2>
      <p>Hola ${datos.nombreCliente},</p>
      <p><b>${datos.unidadNombre}</b><br/>
      Del ${fmt(datos.fechaIngreso)} al ${fmt(datos.fechaSalida)}</p>
      <p><b>Total: $${datos.montoTotal.toLocaleString('es-AR')}</b></p>
      <p>Tenés hasta el ${datos.fechaLimitePago.toLocaleString('es-AR')} para transferir la seña.
      Datos bancarios: [COMPLETAR].</p>
      <p>Si necesitás modificar o cancelar tu reserva, escribinos por WhatsApp al [COMPLETAR].</p>
    `,
  });
}
