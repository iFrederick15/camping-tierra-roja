// PATCH /api/panel/admin/opciones-precio — precio de un ítem de precio
// (ver sql/003_precios_itemizados.sql). Solo-admin: el middleware ya
// bloquea /api/panel/admin/** a rol staff.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';

export const PATCH: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { id, precioPorNoche } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Falta el id de la opción de precio' }), {
      status: 400,
    });
  }

  const { error } = await supabaseAdmin
    .from('opciones_precio')
    .update({ precio_por_noche: Number(precioPorNoche) })
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
