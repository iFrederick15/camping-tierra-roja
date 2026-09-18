import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { obtenerReserva } from '../../../../../lib/reservas';
import { enviarEmailCancelacion } from '../../../../../lib/email';

export const POST: APIRoute = async ({ params, locals }) => {
  if (!locals.usuario) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  const id = params.id!;
  const reserva = await obtenerReserva(id);
  if (!reserva) {
    return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });
  }
  if (reserva.estado === 'CANCELADA' || reserva.estado === 'CHECKOUT_HECHO') {
    return new Response(JSON.stringify({ error: 'Esta reserva ya no se puede cancelar' }), {
      status: 400,
    });
  }

  const { error } = await supabaseAdmin
    .from('reservas')
    .update({ estado: 'CANCELADA' })
    .eq('id', id);

  if (error) {
    console.error('POST /api/panel/reservas/[id]/cancelar:', error);
    return new Response(JSON.stringify({ error: 'No se pudo cancelar la reserva' }), {
      status: 500,
    });
  }

  // El email es opcional en las reservas manuales: sin casilla no hay a quién avisar.
  if (reserva.email) {
    await enviarEmailCancelacion({
      reservaId: id,
      email: reserva.email,
      nombreCliente: reserva.nombreCliente,
      unidadNombre: reserva.unidadNombre,
      parcelaNombre: reserva.parcelaNombre,
      fechaIngreso: reserva.fechaIngreso,
      fechaSalida: reserva.fechaSalida,
      montoPagado: reserva.montoPagado,
      motivo: 'PANEL',
    });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
