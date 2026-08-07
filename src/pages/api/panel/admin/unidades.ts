// PATCH /api/panel/admin/unidades — precio y cupo por unidad.
// Solo-admin: el middleware ya bloquea /api/panel/admin/** a rol staff.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';

export const PATCH: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { id, precioPorNoche, cupoTotal } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Falta el id de la unidad' }), { status: 400 });
  }

  const cambios: Record<string, unknown> = {};
  if (precioPorNoche !== undefined) cambios.precio_por_noche = Number(precioPorNoche);
  if (cupoTotal !== undefined && cupoTotal !== null) cambios.cupo_total = Number(cupoTotal);

  const { error } = await supabaseAdmin.from('unidades').update(cambios).eq('id', id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
