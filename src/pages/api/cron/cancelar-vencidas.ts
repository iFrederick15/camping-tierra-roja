// GET /api/cron/cancelar-vencidas — invocado por Vercel Cron (ver
// vercel.json). Documento de Producto §4.2: "Vencido el plazo sin pago, la
// reserva se cancela automáticamente y libera la disponibilidad."
//
// Vercel agrega automáticamente `Authorization: Bearer $CRON_SECRET` en las
// invocaciones de cron cuando existe esa env var — así distinguimos una
// llamada real de cron de una request pública a esta ruta.
import { timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';

// Comparación en tiempo constante para no filtrar el secreto por timing.
function tokenValido(recibido: string | null, esperado: string): boolean {
  if (!recibido) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(`Bearer ${esperado}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const GET: APIRoute = async ({ request }) => {
  const secret = import.meta.env.CRON_SECRET;

  // Falla en CERRADO: si el secreto no está configurado, este endpoint —que
  // ejecuta un UPDATE masivo sobre reservas— nunca debe correr por una
  // request pública. Setear CRON_SECRET en Vercel → Environment Variables.
  if (!secret) {
    console.error('CRON_SECRET no está configurado; se rechaza la invocación del cron.');
    return new Response(JSON.stringify({ error: 'Cron no configurado' }), { status: 503 });
  }

  if (!tokenValido(request.headers.get('authorization'), secret)) {
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
    console.error('Cron cancelar-vencidas — error buscando reservas:', errBusqueda);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
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
    console.error('Cron cancelar-vencidas — error actualizando reservas:', errUpdate);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, canceladas: idsACancelar.length }), { status: 200 });
};
