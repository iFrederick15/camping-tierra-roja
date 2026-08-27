// PATCH /api/panel/admin/unidades — cupo por unidad (el precio vive en
// opciones_precio, ver /api/panel/admin/opciones-precio).
// Solo-admin: el middleware ya bloquea /api/panel/admin/** a rol staff.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';
import { exigirAdmin } from '../../../../lib/auth-guard';

export const PATCH: APIRoute = async ({ request, locals }) => {
  const noAutorizado = exigirAdmin(locals);
  if (noAutorizado) return noAutorizado;

  const body = await request.json();
  const { id, cupoTotal } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Falta el id de la unidad' }), { status: 400 });
  }

  const cambios: Record<string, unknown> = {};
  if (cupoTotal !== undefined && cupoTotal !== null) {
    const cupo = Number(cupoTotal);
    if (!Number.isInteger(cupo) || cupo < 0 || cupo > 100_000) {
      return new Response(JSON.stringify({ error: 'Cupo inválido' }), { status: 400 });
    }
    cambios.cupo_total = cupo;
  }

  const { error } = await supabaseAdmin.from('unidades').update(cambios).eq('id', id);
  if (error) {
    console.error('PATCH /api/panel/admin/unidades:', error);
    return new Response(JSON.stringify({ error: 'No se pudo guardar el cambio' }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
