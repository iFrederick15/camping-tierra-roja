// PATCH /api/panel/reservas/:id
// Edición de una reserva ya creada por Staff o Admin (cambio de fechas,
// unidad, categoría, cantidades o datos del cliente). Revalida
// disponibilidad excluyendo la propia reserva y recalcula monto_total /
// detalle_precio con la misma lógica que la carga manual (manual.ts).
// NO toca monto_pagado, estado, origen ni fecha_limite_pago.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';
import {
  obtenerReserva,
  obtenerDisponibilidad,
  asignarParcelaMotorhome,
  calcularNoches,
  calcularPrecio,
  diaSiguiente,
  CAPACIDAD_MAXIMA_CABANA,
} from '../../../../lib/reservas';
import { validarDatosCliente } from '../../../../lib/validacion';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.usuario) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  const id = params.id!;
  const reserva = await obtenerReserva(id);
  if (!reserva) {
    return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });
  }
  if (reserva.estado === 'CANCELADA' || reserva.estado === 'CHECKOUT_HECHO') {
    return new Response(
      JSON.stringify({ error: 'Esta reserva ya no se puede editar' }),
      { status: 400 }
    );
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
    datosVehiculo,
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
  if (fechaSalida <= fechaIngreso) {
    return new Response(
      JSON.stringify({ error: 'La fecha de salida debe ser posterior a la de ingreso' }),
      { status: 400 }
    );
  }

  const errorDatos = validarDatosCliente(body);
  if (errorDatos) {
    return new Response(JSON.stringify({ error: errorDatos }), { status: 400 });
  }
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

  // Disponibilidad para las fechas nuevas, sin contar la propia reserva.
  const disp = await obtenerDisponibilidad(
    unidadTipo,
    fechaIngreso,
    fechaSalida,
    categoria ?? undefined,
    id
  );
  if ('error' in disp) {
    return new Response(JSON.stringify({ error: disp.error }), { status: disp.status });
  }

  // MOTORHOME: se mantiene la parcela actual si sigue libre, si no se asigna
  // otra. QUINCHOS: la parcela elegida por Staff debe estar entre las libres.
  // CAMPING/CABANA: sin parcela.
  let parcelaAsignada: string | null = null;
  if (unidadTipo === 'MOTORHOME') {
    const d = disp.disponibilidad;
    if (d.tipo !== 'cupo' || !d.disponible) {
      return new Response(
        JSON.stringify({ error: 'No hay parcelas de motorhome disponibles para esas fechas' }),
        { status: 409 }
      );
    }
    parcelaAsignada = await asignarParcelaMotorhome(
      unidad.id,
      fechaIngreso,
      fechaSalida,
      id,
      reserva.parcelaId
    );
    if (!parcelaAsignada) {
      return new Response(
        JSON.stringify({ error: 'No hay parcelas de motorhome disponibles para esas fechas' }),
        { status: 409 }
      );
    }
  } else if (unidadTipo === 'QUINCHOS') {
    const d = disp.disponibilidad;
    if (d.tipo !== 'lista' || !d.opciones.some((o) => o.id === parcelaId)) {
      return new Response(
        JSON.stringify({ error: 'El quincho elegido no está disponible para esa fecha' }),
        { status: 409 }
      );
    }
    parcelaAsignada = parcelaId;
  } else {
    const d = disp.disponibilidad;
    if ((d.tipo === 'cupo' || d.tipo === 'unica') && !d.disponible) {
      return new Response(
        JSON.stringify({ error: 'No hay disponibilidad para esas fechas' }),
        { status: 409 }
      );
    }
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

  const { error: errUpdate } = await supabaseAdmin
    .from('reservas')
    .update({
      unidad_id: unidad.id,
      parcela_id: parcelaAsignada,
      nombre_cliente: nombreCliente,
      dni,
      email: email || null,
      telefono: telefono || null,
      datos_vehiculo: datosVehiculo || null,
      cantidad_acompanantes: cantidadAcompanantes ?? 0,
      categoria_seleccionada: categoria ?? null,
      cantidad_menores: cantidadMenores ?? 0,
      cantidad_mayores: cantidadMayores ?? 0,
      detalle_precio: detalle,
      fecha_ingreso: fechaIngreso,
      fecha_salida: fechaSalida,
      monto_total: montoTotal,
    })
    .eq('id', id);

  if (errUpdate) {
    console.error('PATCH /api/panel/reservas/[id] — error actualizando:', errUpdate);
    return new Response(JSON.stringify({ error: 'No se pudo guardar la reserva' }), { status: 500 });
  }

  const actualizada = await obtenerReserva(id);
  return new Response(JSON.stringify({ ok: true, reserva: actualizada }), { status: 200 });
};
