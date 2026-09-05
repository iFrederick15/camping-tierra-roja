// GET /api/precios?unidad=MOTORHOME
//
// Devuelve los ítems de precio activos de una unidad (ver
// sql/003_precios_itemizados.sql). BookingWidget los pide apenas el
// cliente elige la unidad, antes de fechas — QUINCHOS necesita la
// categoría elegida para poder consultar /api/disponibilidad.

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { urlsPublicasImagenes } from '../../lib/imagenes-unidad';

export const GET: APIRoute = async ({ url }) => {
  const unidadTipo = url.searchParams.get('unidad');

  if (!unidadTipo) {
    return new Response(JSON.stringify({ error: 'Falta el parámetro: unidad' }), { status: 400 });
  }

  const { data: unidad, error } = await supabaseAdmin
    .from('unidades')
    .select(
      'imagenes, opciones_precio(clave, etiqueta, tipo_cargo, precio_por_noche, orden, activo)'
    )
    .eq('tipo', unidadTipo)
    .single();

  if (error || !unidad) {
    return new Response(JSON.stringify({ error: 'Unidad no válida' }), { status: 400 });
  }

  const opciones = ((unidad as any).opciones_precio ?? [])
    .filter((o: any) => o.activo)
    .sort((a: any, b: any) => a.orden - b.orden)
    .map((o: any) => ({
      clave: o.clave,
      etiqueta: o.etiqueta,
      tipoCargo: o.tipo_cargo,
      precioPorNoche: Number(o.precio_por_noche),
    }));

  const imagenes = urlsPublicasImagenes((unidad as any).imagenes);

  return new Response(JSON.stringify({ opciones, imagenes }), { status: 200 });
};
