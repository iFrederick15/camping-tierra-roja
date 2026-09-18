// POST /api/panel/reservas/:id/descuento
// Fija el descuento de la reserva en pesos (reemplaza el anterior; 0 lo
// quita) y recalcula monto_total — ver sql/016_descuento_reserva.sql.
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
  if (reserva.estado === 'CANCELADA' || reserva.estado === 'CHECKOUT_HECHO') {
    return new Response(JSON.stringify({ error: 'Esta reserva ya no admite descuentos' }), {
      status: 400,
    });
  }

  const body = await request.json();
  // Redondeo a centavos, igual que el saldo en pago.ts.
  const descuento = Math.round(Number(body.descuento) * 100) / 100;
  const motivo = String(body.motivo ?? '').trim();

  if (!Number.isFinite(descuento) || descuento < 0) {
    return new Response(JSON.stringify({ error: 'El descuento no es válido' }), { status: 400 });
  }
  if (descuento > 0 && !motivo) {
    return new Response(JSON.stringify({ error: 'Indica el motivo del descuento' }), {
      status: 400,
    });
  }

  const subtotal = reserva.montoTotal + reserva.descuento;
  // Hasta el 100%: una reserva puede ir por la casa.
  if (descuento > subtotal) {
    return new Response(
      JSON.stringify({ error: 'El descuento no puede superar el total de la reserva' }),
      { status: 400 }
    );
  }
  if (subtotal - descuento < reserva.montoPagado) {
    return new Response(
      JSON.stringify({ error: 'Con ese descuento el total quedaría por debajo de lo ya pagado' }),
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.rpc('aplicar_descuento', {
    p_reserva_id: id,
    p_descuento: descuento,
    p_motivo: motivo || null,
    p_por: locals.usuario.nombre,
  });

  if (error) {
    // La RPC revalida con la fila bloqueada: cubre un pago registrado a la vez.
    if (error.message?.includes('DESCUENTO_BAJO_PAGADO')) {
      return new Response(
        JSON.stringify({ error: 'Con ese descuento el total quedaría por debajo de lo ya pagado' }),
        { status: 400 }
      );
    }
    if (error.message?.includes('DESCUENTO_INVALIDO')) {
      return new Response(
        JSON.stringify({ error: 'El descuento no puede superar el total de la reserva' }),
        { status: 400 }
      );
    }
    console.error('POST /api/panel/reservas/[id]/descuento:', error);
    return new Response(JSON.stringify({ error: 'No se pudo aplicar el descuento' }), {
      status: 500,
    });
  }

  const actualizada = await obtenerReserva(id);
  return new Response(JSON.stringify({ ok: true, reserva: actualizada }), { status: 200 });
};
