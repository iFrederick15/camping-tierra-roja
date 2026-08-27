import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { obtenerReserva, puedeHacerCheckout } from '../../../../../lib/reservas';

export const POST: APIRoute = async ({ params, locals }) => {
  if (!locals.usuario) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  const id = params.id!;
  const reserva = await obtenerReserva(id);
  if (!reserva) {
    return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });
  }
  if (reserva.estado !== 'CHECKIN_HECHO') {
    return new Response(JSON.stringify({ error: 'Esta reserva no tiene el check-in hecho' }), {
      status: 400,
    });
  }
  if (!puedeHacerCheckout(reserva.montoTotal, reserva.montoPagado)) {
    return new Response(JSON.stringify({ error: 'El pago debe estar completo para hacer check-out' }), {
      status: 400,
    });
  }

  const { error } = await supabaseAdmin
    .from('reservas')
    .update({ estado: 'CHECKOUT_HECHO' })
    .eq('id', id);

  if (error) {
    console.error('POST /api/panel/reservas/[id]/checkout:', error);
    return new Response(JSON.stringify({ error: 'No se pudo hacer el check-out' }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
