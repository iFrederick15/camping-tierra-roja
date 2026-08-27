import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { obtenerReserva } from '../../../../../lib/reservas';

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

  const { error } = await supabaseAdmin.from('reservas').update({ estado: 'CANCELADA' }).eq('id', id);

  if (error) {
    console.error('POST /api/panel/reservas/[id]/cancelar:', error);
    return new Response(JSON.stringify({ error: 'No se pudo cancelar la reserva' }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
