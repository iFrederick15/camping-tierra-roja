import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { obtenerReserva } from '../../../../../lib/reservas';

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.usuario) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  const id = params.id!;
  const reserva = await obtenerReserva(id);
  if (!reserva) {
    return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });
  }
  if (reserva.estado === 'CANCELADA') {
    return new Response(JSON.stringify({ error: 'No se puede registrar un pago en una reserva cancelada' }), {
      status: 400,
    });
  }

  const body = await request.json();
  const monto = Number(body.monto);
  const metodo = String(body.metodo ?? '').trim();

  if (!monto || monto <= 0) {
    return new Response(JSON.stringify({ error: 'El monto debe ser mayor a cero' }), { status: 400 });
  }
  if (!metodo) {
    return new Response(JSON.stringify({ error: 'Indica el método de pago' }), { status: 400 });
  }

  const { error } = await supabaseAdmin.rpc('registrar_pago', {
    p_reserva_id: id,
    p_monto: monto,
    p_metodo: metodo,
    p_nota: body.nota ?? null,
    p_registrado_por: locals.usuario.nombre,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const actualizada = await obtenerReserva(id);
  return new Response(JSON.stringify({ ok: true, reserva: actualizada }), { status: 200 });
};
