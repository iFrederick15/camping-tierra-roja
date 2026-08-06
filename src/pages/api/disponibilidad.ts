// GET /api/disponibilidad?unidad=MOTORHOME&desde=2026-08-15&hasta=2026-08-17
//
// Fuente de verdad de disponibilidad. Usa supabaseAdmin (service_role) porque
// la tabla "reservas" tiene RLS sin policies públicas — nadie más que el
// backend puede leerla directo.

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const unidadTipo = url.searchParams.get('unidad');
  const desde = url.searchParams.get('desde');
  const hasta = url.searchParams.get('hasta');

  if (!unidadTipo || !desde || !hasta) {
    return new Response(
      JSON.stringify({ error: 'Faltan parámetros: unidad, desde, hasta' }),
      { status: 400 }
    );
  }

  const { data: unidad, error: errUnidad } = await supabaseAdmin
    .from('unidades')
    .select('id, tipo, cupo_total, parcelas(id, nombre, atributos, activa)')
    .eq('tipo', unidadTipo)
    .single();

  if (errUnidad || !unidad) {
    return new Response(JSON.stringify({ error: 'Unidad no encontrada' }), { status: 404 });
  }

  // Reservas activas que se superponen con el rango pedido.
  // Solo CONFIRMADA y CHECKIN_HECHO ocupan lugar (una cancelada lo libera).
  const { data: solapadas, error: errReservas } = await supabaseAdmin
    .from('reservas')
    .select('parcela_id')
    .eq('unidad_id', unidad.id)
    .in('estado', ['CONFIRMADA', 'CHECKIN_HECHO'])
    .lt('fecha_ingreso', hasta)
    .gt('fecha_salida', desde);

  if (errReservas) {
    return new Response(JSON.stringify({ error: errReservas.message }), { status: 500 });
  }

  if (unidad.tipo === 'MOTORHOME' || unidad.tipo === 'QUINCHOS') {
    const parcelasOcupadasIds = new Set((solapadas ?? []).map((r) => r.parcela_id));
    const disponibles = (unidad.parcelas ?? [])
      .filter((p: any) => p.activa && !parcelasOcupadasIds.has(p.id))
      .map((p: any) => ({ id: p.id, nombre: p.nombre, atributos: p.atributos }));

    return new Response(JSON.stringify({ tipo: 'lista', opciones: disponibles }), { status: 200 });
  }

  if (unidad.tipo === 'CAMPING') {
    const ocupadas = solapadas?.length ?? 0;
    const libres = (unidad.cupo_total ?? 0) - ocupadas;
    return new Response(
      JSON.stringify({ tipo: 'cupo', disponible: libres > 0, cuposLibres: Math.max(libres, 0) }),
      { status: 200 }
    );
  }

  // CABANA: unidad única
  const disponible = (solapadas?.length ?? 0) === 0;
  return new Response(JSON.stringify({ tipo: 'unica', disponible }), { status: 200 });
};
