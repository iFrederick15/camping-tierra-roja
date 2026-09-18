// DELETE /api/panel/reservas/:id/pagos/:pagoId
// Solo Admin: elimina un pago cargado por error, resta el monto de lo pagado
// y deja una nota interna con el detalle — ver sql/017_eliminar_pago.sql.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { obtenerReserva } from '../../../../../../lib/reservas';
import { exigirAdmin } from '../../../../../../lib/auth-guard';

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const denegado = exigirAdmin(locals);
  if (denegado) return denegado;

  const id = params.id!;
  const pagoId = params.pagoId!;

  const body = await request.json().catch(() => ({}));
  const motivo = String(body.motivo ?? '').trim();
  if (!motivo) {
    return new Response(JSON.stringify({ error: 'Indica el motivo para eliminar el pago' }), {
      status: 400,
    });
  }

  const { error } = await supabaseAdmin.rpc('eliminar_pago', {
    p_reserva_id: id,
    p_pago_id: pagoId,
    p_motivo: motivo,
    p_por: locals.usuario!.nombre,
  });

  if (error) {
    // También cubre una reserva inexistente o un pago de otra reserva.
    if (error.message?.includes('PAGO_NO_ENCONTRADO')) {
      return new Response(JSON.stringify({ error: 'Pago no encontrado' }), { status: 404 });
    }
    console.error('DELETE /api/panel/reservas/[id]/pagos/[pagoId]:', error);
    return new Response(JSON.stringify({ error: 'No se pudo eliminar el pago' }), {
      status: 500,
    });
  }

  const actualizada = await obtenerReserva(id);
  return new Response(JSON.stringify({ ok: true, reserva: actualizada }), { status: 200 });
};
