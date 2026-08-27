// POST /api/reservar
// Crea la reserva, calcula el plazo de pago y dispara el email de
// confirmación. Sin pasarela de pago: el cliente transfiere y Staff
// verifica y registra el pago manualmente después (decisión de producto).

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { enviarEmailConfirmacion } from '../../lib/email';
import { validarDatosCliente } from '../../lib/validacion';
import { consumir, ipDe } from '../../lib/rate-limit';
import {
  calcularNoches,
  calcularFechaLimitePago,
  obtenerConfiguracionPagos,
  calcularPrecio,
  asignarParcelaMotorhome,
  hoyISO,
  diaSiguiente,
  CAPACIDAD_MAXIMA_CABANA,
} from '../../lib/reservas';

export const POST: APIRoute = async ({ request }) => {
  const limite = consumir(`reservar:${ipDe(request)}`, 8, 60 * 60 * 1000);
  if (!limite.permitido) {
    return new Response(
      JSON.stringify({ error: 'Demasiados intentos de reserva. Prueba de nuevo en un rato.' }),
      { status: 429, headers: { 'Retry-After': String(limite.reintentarEnSegundos) } }
    );
  }

  const body = await request.json();
  const {
    unidadTipo,
    parcelaId, // solo QUINCHOS — MOTORHOME se asigna automático (ver más abajo)
    fechaIngreso,
    fechaSalida,
    nombreCliente,
    dni,
    email,
    telefono,
    cantidadAcompanantes, // MOTORHOME
    categoria, // MOTORHOME / QUINCHOS / CABANA
    cantidadMenores, // CAMPING (cobra) / CABANA (informativo)
    cantidadMayores, // CAMPING (cobra) / CABANA (informativo)
  } = body;

  if (!email || !telefono) {
    return new Response(
      JSON.stringify({ error: 'Email y teléfono son obligatorios para reservar online' }),
      { status: 400 }
    );
  }

  const errorDatos = validarDatosCliente(body, {
    emailObligatorio: true,
    telefonoObligatorio: true,
  });
  if (errorDatos) {
    return new Response(JSON.stringify({ error: errorDatos }), { status: 400 });
  }

  // El portal público no permite reservar fechas pasadas ni con la salida
  // antes o igual a la entrada; esto ya se filtra en el date picker pero se
  // repite acá porque el picker se puede saltear pegándole directo a la API.
  if (!fechaIngreso || !fechaSalida || fechaIngreso < hoyISO() || fechaSalida <= fechaIngreso) {
    return new Response(JSON.stringify({ error: 'Las fechas de la reserva no son válidas' }), {
      status: 400,
    });
  }

  // Los quinchos se reservan por un solo día (esto ya se filtra en el date
  // picker, que solo pide una fecha, pero se repite acá porque el picker se
  // puede saltear pegándole directo a la API).
  if (unidadTipo === 'QUINCHOS' && fechaSalida !== diaSiguiente(fechaIngreso)) {
    return new Response(
      JSON.stringify({ error: 'Los quinchos se reservan por un solo día' }),
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

  if (
    unidadTipo === 'CABANA' &&
    (cantidadMayores ?? 0) + (cantidadMenores ?? 0) > CAPACIDAD_MAXIMA_CABANA
  ) {
    return new Response(
      JSON.stringify({
        error: `La cabaña tiene capacidad máxima para ${CAPACIDAD_MAXIMA_CABANA} personas`,
      }),
      { status: 400 }
    );
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

  // MOTORHOME: el cliente no elige parcela, se asigna automáticamente una
  // libre del stock. QUINCHOS sigue con la parcela que eligió el cliente.
  let parcelaAsignada: string | null = null;
  if (unidadTipo === 'MOTORHOME') {
    parcelaAsignada = await asignarParcelaMotorhome(unidad.id, fechaIngreso, fechaSalida);
    if (!parcelaAsignada) {
      return new Response(
        JSON.stringify({ error: 'Ya no hay parcelas de motorhome disponibles para esas fechas' }),
        { status: 409 }
      );
    }
  } else if (unidadTipo === 'QUINCHOS') {
    parcelaAsignada = parcelaId;
  }

  // Plazo de pago según antelación (ver Documento de Producto §4.2),
  // configurable desde el Panel Admin (tabla configuracion_pagos).
  const configPagos = await obtenerConfiguracionPagos();
  const fechaLimitePago = calcularFechaLimitePago(fechaIngreso, configPagos);

  // NOTA (Semana 2 del plan): esto todavía no está protegido contra dos
  // clientes reservando la misma parcela/cupo en el mismo instante.
  // Falta envolverlo en una función de Postgres con lock antes de producción.
  const { data: reserva, error: errInsert } = await supabaseAdmin
    .from('reservas')
    .insert({
      unidad_id: unidad.id,
      parcela_id: parcelaAsignada,
      nombre_cliente: nombreCliente,
      dni,
      email,
      telefono,
      cantidad_acompanantes: cantidadAcompanantes ?? 0,
      categoria_seleccionada: categoria ?? null,
      cantidad_menores: cantidadMenores ?? 0,
      cantidad_mayores: cantidadMayores ?? 0,
      detalle_precio: detalle,
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
    console.error('POST /api/reservar — error insertando reserva:', errInsert);
    return new Response(JSON.stringify({ error: 'No se pudo crear la reserva' }), {
      status: 500,
    });
  }

  await enviarEmailConfirmacion({
    email,
    nombreCliente,
    unidadNombre: unidad.nombre,
    fechaIngreso: new Date(fechaIngreso),
    fechaSalida: new Date(fechaSalida),
    montoTotal,
    fechaLimitePago,
  });

  return new Response(JSON.stringify({ ok: true, reservaId: reserva.id }), { status: 201 });
};
