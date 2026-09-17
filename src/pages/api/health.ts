// GET /api/health — chequeo de salud público y, sobre todo, KEEP-ALIVE.
//
// El plan gratuito de Supabase pausa el proyecto tras ~7 días sin actividad en
// la base, y esta web no la toca sola: las páginas públicas son
// `prerender = true` (HTML estático en Vercel), así que mil visitas generan
// cero consultas a Postgres. Sin reservas durante una semana, el proyecto se
// pausa y /reservar deja de funcionar.
//
// Este endpoint existe para que un monitor externo (UptimeRobot, cron-job.org)
// le pegue cada pocos minutos: cada request hace una consulta real a Postgres
// —y de paso avisa por mail cuando la base no responde—. A diferencia del cron
// de /api/cron/cancelar-vencidas, no necesita secreto ni tiene efectos de
// lado, así que no puede fallar en silencio por una variable mal sincronizada.
//
// Se usa el cliente anónimo a propósito: `unidades` tiene lectura pública en
// RLS (sql/001_schema.sql), no hace falta la service_role para un ping.

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

/** Si la base no contesta en este tiempo, se la da por caída. */
const TIMEOUT_MS = 5000;

async function revisarBase(): Promise<{ ok: boolean; detalle: string }> {
  try {
    const { error } = await supabase
      .from('unidades')
      .select('id')
      .limit(1)
      .abortSignal(AbortSignal.timeout(TIMEOUT_MS));

    if (error) return { ok: false, detalle: error.message };
    return { ok: true, detalle: 'ok' };
  } catch (e) {
    // AbortError por timeout, DNS caído, proyecto pausado, etc.
    return { ok: false, detalle: e instanceof Error ? e.message : 'error desconocido' };
  }
}

// `no-store` es imprescindible: si Vercel o un CDN cachearan la respuesta, el
// monitor seguiría viendo 200 sin que la consulta llegue nunca a Postgres y el
// keep-alive dejaría de servir para lo único que existe.
const CABECERAS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, max-age=0',
};

export const GET: APIRoute = async () => {
  const { ok, detalle } = await revisarBase();

  if (!ok) console.error('Health check — la base no responde:', detalle);

  return new Response(JSON.stringify({ ok, base: ok ? 'ok' : 'error', fecha: new Date().toISOString() }), {
    status: ok ? 200 : 503,
    headers: CABECERAS,
  });
};

// Varios monitores (UptimeRobot entre ellos) mandan HEAD antes que GET. Sin
// este export la ruta respondería 404 al HEAD: el monitor marcaría el sitio
// caído y, peor, la consulta a Postgres nunca correría.
export const HEAD: APIRoute = async () => {
  const { ok } = await revisarBase();
  return new Response(null, { status: ok ? 200 : 503, headers: CABECERAS });
};
