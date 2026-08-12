// GET /api/disponibilidad?unidad=MOTORHOME&desde=2026-08-15&hasta=2026-08-17
//
// Fuente de verdad de disponibilidad. La consulta real vive en
// obtenerDisponibilidad (src/lib/reservas.ts) para que la reserva manual de
// Staff (/api/panel/reservas/manual) use exactamente la misma lógica.

import type { APIRoute } from 'astro';
import { obtenerDisponibilidad } from '../../lib/reservas';

export const GET: APIRoute = async ({ url }) => {
  const unidadTipo = url.searchParams.get('unidad');
  const desde = url.searchParams.get('desde');
  const hasta = url.searchParams.get('hasta');
  const categoria = url.searchParams.get('categoria') ?? undefined;

  if (!unidadTipo || !desde || !hasta) {
    return new Response(
      JSON.stringify({ error: 'Faltan parámetros: unidad, desde, hasta' }),
      { status: 400 }
    );
  }

  const resultado = await obtenerDisponibilidad(unidadTipo, desde, hasta, categoria);

  if ('error' in resultado) {
    return new Response(JSON.stringify({ error: resultado.error }), { status: resultado.status });
  }

  return new Response(
    JSON.stringify({ unidad: resultado.unidad, disponibilidad: resultado.disponibilidad }),
    { status: 200 }
  );
};
