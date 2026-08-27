import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { obtenerReserva, puedeHacerCheckin } from '../../../../../lib/reservas';

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.usuario) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  const id = params.id!;
  const reserva = await obtenerReserva(id);
  if (!reserva) {
    return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });
  }
  if (reserva.estado !== 'CONFIRMADA') {
    return new Response(JSON.stringify({ error: 'Esta reserva no está en estado Confirmada' }), {
      status: 400,
    });
  }
  if (!puedeHacerCheckin(reserva.montoTotal, reserva.montoPagado)) {
    return new Response(
      JSON.stringify({ error: 'No se puede hacer check-in sin al menos un pago registrado' }),
      { status: 400 }
    );
  }

  const body = await request.json();
  const cantidadAcompanantes = Number(body.cantidadAcompanantes ?? reserva.cantidadAcompanantes);
  const datosVehiculo = body.datosVehiculo ?? null;

  const { error } = await supabaseAdmin
    .from('reservas')
    .update({
      estado: 'CHECKIN_HECHO',
      cantidad_acompanantes: cantidadAcompanantes,
      datos_vehiculo: datosVehiculo,
    })
    .eq('id', id);

  if (error) {
    console.error('POST /api/panel/reservas/[id]/checkin:', error);
    return new Response(JSON.stringify({ error: 'No se pudo hacer el check-in' }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
