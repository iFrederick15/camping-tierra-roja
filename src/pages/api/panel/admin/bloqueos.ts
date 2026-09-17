// POST/DELETE /api/panel/admin/bloqueos — "deshabilitar" fechas desde el
// Calendario de ocupación (mantenimiento, uso propio, evento privado).
// Solo-admin: el middleware ya bloquea /api/panel/admin/** a rol staff, y
// exigirAdmin lo repite como defensa en profundidad.
//
// Las reglas (qué se puede bloquear y qué no) viven en lib/reservas.ts, que
// es la misma fuente de verdad que usa la disponibilidad del Portal público.
import type { APIRoute } from 'astro';
import { crearBloqueo, eliminarBloqueo } from '../../../../lib/reservas';
import { exigirAdmin } from '../../../../lib/auth-guard';

const json = (cuerpo: unknown, status: number) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request, locals }) => {
  const noAutorizado = exigirAdmin(locals);
  if (noAutorizado) return noAutorizado;

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Cuerpo inválido' }, 400);

  const resultado = await crearBloqueo({
    unidadTipo: body.unidadTipo,
    parcelaId: body.parcelaId ?? null,
    todaLaUnidad: body.todaLaUnidad === true,
    fechaInicio: body.fechaInicio,
    fechaFin: body.fechaFin,
    nota: body.nota,
    // Queda registrado quién lo puso: el Calendario lo muestra al pasar el
    // mouse por encima del bloqueo.
    creadoPor: locals.usuario?.nombre ?? null,
  });

  if ('error' in resultado) return json({ error: resultado.error }, resultado.status);
  return json({ ok: true, bloqueo: resultado.bloqueo }, 201);
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const noAutorizado = exigirAdmin(locals);
  if (noAutorizado) return noAutorizado;

  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: 'Falta el id del bloqueo' }, 400);

  const error = await eliminarBloqueo(body.id);
  if (error) return json({ error: error.error }, error.status);
  return json({ ok: true }, 200);
};
