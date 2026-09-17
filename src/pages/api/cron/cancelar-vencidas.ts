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
  // `process.env` primero, igual que GTM_ID en Analytics.astro: Vite hornea
  // `import.meta.env.CRON_SECRET` como literal en el build, mientras que el
  // header `Authorization` lo arma Vercel con el valor ACTUAL de la variable.
  // Si el secreto se rota (o se carga) sin redeployar, los dos dejan de
  // coincidir, el cron devuelve 401 todos los días sin tocar la base y nada
  // avisa. Leerlo en runtime elimina esa desincronización.
  const secret = process.env.CRON_SECRET ?? import.meta.env.CRON_SECRET;

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
    .select('id, monto_pagado')
    .eq('estado', 'CONFIRMADA')
    .eq('origen', 'WEB')
    .not('fecha_limite_pago', 'is', null)
    .lt('fecha_limite_pago', ahora);

  if (errBusqueda) {
    console.error('Cron cancelar-vencidas — error buscando reservas:', errBusqueda);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }

  // Se cancela solo la reserva que no registra NINGÚN pago. Quien transfirió
  // la seña (o cualquier importe a cuenta) la conserva y abona el saldo al
  // ingresar, que es lo que prometen los Términos y el email de confirmación.
  // Antes se cancelaba todo lo que no estuviera pagado al 100%, y eso daba de
  // baja justamente a los clientes que habían hecho lo que se les pidió.
  const idsACancelar = (vencidas ?? []).filter((r) => Number(r.monto_pagado) <= 0).map((r) => r.id);

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

  return new Response(JSON.stringify({ ok: true, canceladas: idsACancelar.length }), {
    status: 200,
  });
};
