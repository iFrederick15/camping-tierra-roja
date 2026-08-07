// PATCH /api/panel/admin/parcelas — atributos y disponibilidad de una parcela
// (motorhome o quincho). Solo-admin (gateado por middleware).
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';

export const PATCH: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { id, atributos, activa } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Falta el id de la parcela' }), { status: 400 });
  }

  const cambios: Record<string, unknown> = {};
  if (atributos !== undefined) cambios.atributos = atributos;
  if (activa !== undefined) cambios.activa = activa;

  const { error } = await supabaseAdmin.from('parcelas').update(cambios).eq('id', id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
