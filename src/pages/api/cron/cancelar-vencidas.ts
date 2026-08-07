// GET /api/cron/cancelar-vencidas — invocado por Vercel Cron (ver
// vercel.json). Documento de Producto §4.2: "Vencido el plazo sin pago, la
// reserva se cancela automáticamente y libera la disponibilidad."
//
// Vercel agrega automáticamente `Authorization: Bearer $CRON_SECRET` en las
// invocaciones de cron cuando existe esa env var — así distinguimos una
// llamada real de cron de una request pública a esta ruta.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  const secret = import.meta.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const ahora = new Date().toISOString();

  const { data: vencidas, error: errBusqueda } = await supabaseAdmin
    .from('reservas')
    .select('id, monto_total, monto_pagado')
    .eq('estado', 'CONFIRMADA')
    .eq('origen', 'WEB')
    .not('fecha_limite_pago', 'is', null)
    .lt('fecha_limite_pago', ahora);

  if (errBusqueda) {
    return new Response(JSON.stringify({ error: errBusqueda.message }), { status: 500 });
  }

  const idsACancelar = (vencidas ?? [])
    .filter((r) => Number(r.monto_pagado) < Number(r.monto_total))
    .map((r) => r.id);

  if (idsACancelar.length === 0) {
    return new Response(JSON.stringify({ ok: true, canceladas: 0 }), { status: 200 });
  }

  const { error: errUpdate } = await supabaseAdmin
    .from('reservas')
    .update({ estado: 'CANCELADA' })
    .in('id', idsACancelar);

  if (errUpdate) {
    return new Response(JSON.stringify({ error: errUpdate.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, canceladas: idsACancelar.length }), { status: 200 });
};
