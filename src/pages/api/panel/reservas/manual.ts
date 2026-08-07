// POST /api/panel/reservas/manual
// Reserva cargada por Staff (walk-in o teléfono). A diferencia de
// /api/reservar: origen MANUAL, confirmada directo sin plazo automático
// (ya hay una persona de Tierra Roja gestionando en vivo con el cliente),
// y no exige email/teléfono.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';
import { calcularNoches } from '../../../../lib/reservas';

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
  } = body;

  if (!nombreCliente || !dni || !fechaIngreso || !fechaSalida) {
    return new Response(
      JSON.stringify({ error: 'Nombre, DNI y fechas son obligatorios' }),
      { status: 400 }
    );
  }

  const { data: unidad, error: errUnidad } = await supabaseAdmin
    .from('unidades')
    .select('id, nombre, precio_por_noche')
    .eq('tipo', unidadTipo)
    .single();

  if (errUnidad || !unidad) {
    return new Response(JSON.stringify({ error: 'Unidad no válida' }), { status: 400 });
  }

  const noches = calcularNoches(fechaIngreso, fechaSalida);
  const montoTotal = Number(unidad.precio_por_noche) * noches;

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
