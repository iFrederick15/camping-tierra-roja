// POST /api/reservar
// Crea la reserva, calcula el plazo de pago y dispara el email de
// confirmación. Sin pasarela de pago: el cliente transfiere y Staff
// verifica y registra el pago manualmente después (decisión de producto).

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { enviarEmailConfirmacion } from '../../lib/email';

const HORAS_PLAZO_LARGO = 48;
const HORAS_PLAZO_CORTO = 6; // reservas de último momento (< 3 días de anticipación)
const DIAS_UMBRAL_ANTICIPACION = 3;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const {
    unidadTipo,
    parcelaId, // solo si unidadTipo === 'MOTORHOME' | 'QUINCHOS'
    fechaIngreso,
    fechaSalida,
    nombreCliente,
    dni,
    email,
    telefono,
    cantidadAcompanantes,
  } = body;

  if (!email || !telefono) {
    return new Response(
      JSON.stringify({ error: 'Email y teléfono son obligatorios para reservar online' }),
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

  const ingreso = new Date(fechaIngreso);
  const salida = new Date(fechaSalida);
  const noches = Math.max(
    1,
    Math.round((salida.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24))
  );
  const montoTotal = Number(unidad.precio_por_noche) * noches;

  // Plazo de pago según antelación (ver Documento de Producto §4.2)
  const ahora = new Date();
  const diasAnticipacion = (ingreso.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24);
  const horasPlazo =
    diasAnticipacion > DIAS_UMBRAL_ANTICIPACION ? HORAS_PLAZO_LARGO : HORAS_PLAZO_CORTO;
  const fechaLimitePago = new Date(ahora.getTime() + horasPlazo * 60 * 60 * 1000);

  // NOTA (Semana 2 del plan): esto todavía no está protegido contra dos
  // clientes reservando la misma parcela/cupo en el mismo instante.
  // Falta envolverlo en una función de Postgres con lock antes de producción.
  const { data: reserva, error: errInsert } = await supabaseAdmin
    .from('reservas')
    .insert({
      unidad_id: unidad.id,
      parcela_id: unidadTipo === 'MOTORHOME' || unidadTipo === 'QUINCHOS' ? parcelaId : null,
      nombre_cliente: nombreCliente,
      dni,
      email,
      telefono,
      cantidad_acompanantes: cantidadAcompanantes ?? 0,
      fecha_ingreso: fechaIngreso,
      fecha_salida: fechaSalida,
      monto_total: montoTotal,
      fecha_limite_pago: fechaLimitePago.toISOString(),
      estado: 'CONFIRMADA',
      origen: 'WEB',
    })
    .select('id')
    .single();

  if (errInsert || !reserva) {
    return new Response(JSON.stringify({ error: errInsert?.message ?? 'No se pudo crear la reserva' }), {
      status: 500,
    });
  }

  await enviarEmailConfirmacion({
    email,
    nombreCliente,
    unidadNombre: unidad.nombre,
    fechaIngreso: ingreso,
    fechaSalida: salida,
    montoTotal,
    fechaLimitePago,
  });

  return new Response(JSON.stringify({ ok: true, reservaId: reserva.id }), { status: 201 });
};
