// POST /api/panel/reservas/manual
// Reserva cargada por Staff (walk-in o teléfono). A diferencia de
// /api/reservar: origen MANUAL, confirmada directo sin plazo automático
// (ya hay una persona de Tierra Roja gestionando en vivo con el cliente),
// y no exige email/teléfono.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';
import { calcularNoches, calcularPrecio } from '../../../../lib/reservas';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.usuario) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  const body = await request.json();
  const {
    unidadTipo,
    parcelaId,
    fechaIngreso,
    fechaSalida,
    nombreCliente,
    dni,
    email,
    telefono,
    cantidadAcompanantes,
    categoria,
    cantidadMenores,
    cantidadMayores,
  } = body;

  if (!nombreCliente || !dni || !fechaIngreso || !fechaSalida) {
    return new Response(
      JSON.stringify({ error: 'Nombre, DNI y fechas son obligatorios' }),
      { status: 400 }
    );
  }

  const { data: unidad, error: errUnidad } = await supabaseAdmin
    .from('unidades')
    .select('id, nombre')
    .eq('tipo', unidadTipo)
    .single();

  if (errUnidad || !unidad) {
    return new Response(JSON.stringify({ error: 'Unidad no válida' }), { status: 400 });
  }

  const noches = calcularNoches(fechaIngreso, fechaSalida);
  const precio = await calcularPrecio(unidadTipo, noches, {
    categoria,
    acompanantes: cantidadAcompanantes,
    menores: cantidadMenores,
    mayores: cantidadMayores,
  });
  if ('error' in precio) {
    return new Response(JSON.stringify({ error: precio.error }), { status: precio.status });
  }
  const { montoTotal, detalle } = precio;

  const { data: reserva, error: errInsert } = await supabaseAdmin
    .from('reservas')
    .insert({
      unidad_id: unidad.id,
      parcela_id: unidadTipo === 'MOTORHOME' || unidadTipo === 'QUINCHOS' ? parcelaId : null,
      nombre_cliente: nombreCliente,
      dni,
      email: email || null,
      telefono: telefono || null,
      cantidad_acompanantes: cantidadAcompanantes ?? 0,
      categoria_seleccionada: categoria ?? null,
      cantidad_menores: cantidadMenores ?? 0,
      cantidad_mayores: cantidadMayores ?? 0,
      detalle_precio: detalle,
      fecha_ingreso: fechaIngreso,
      fecha_salida: fechaSalida,
      monto_total: montoTotal,
      fecha_limite_pago: null,
      estado: 'CONFIRMADA',
      origen: 'MANUAL',
    })
    .select('id')
    .single();

  if (errInsert || !reserva) {
    return new Response(
      JSON.stringify({ error: errInsert?.message ?? 'No se pudo crear la reserva' }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ ok: true, reservaId: reserva.id }), { status: 201 });
};
