// PATCH /api/panel/admin/opciones-precio — precio de un ítem de precio
// (ver sql/003_precios_itemizados.sql). Solo-admin: el middleware ya
// bloquea /api/panel/admin/** a rol staff.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';
import { exigirAdmin } from '../../../../lib/auth-guard';

export const PATCH: APIRoute = async ({ request, locals }) => {
  const noAutorizado = exigirAdmin(locals);
  if (noAutorizado) return noAutorizado;

  const body = await request.json();
  const { id } = body;
  const precioPorNoche = Number(body.precioPorNoche);

  if (!id) {
    return new Response(JSON.stringify({ error: 'Falta el id de la opción de precio' }), {
      status: 400,
    });
  }
  if (!Number.isFinite(precioPorNoche) || precioPorNoche < 0 || precioPorNoche > 100_000_000) {
    return new Response(JSON.stringify({ error: 'Precio inválido' }), { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('opciones_precio')
    .update({ precio_por_noche: precioPorNoche })
    .eq('id', id);

  if (error) {
    console.error('PATCH /api/panel/admin/opciones-precio:', error);
    return new Response(JSON.stringify({ error: 'No se pudo guardar el cambio' }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
