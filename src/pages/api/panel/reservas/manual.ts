// POST /api/panel/reservas/manual
// Reserva cargada por Staff (walk-in o teléfono). A diferencia de
// /api/reservar: origen MANUAL y confirmada directo sin plazo automático
// (ya hay una persona de Tierra Roja gestionando en vivo con el cliente).
// Email y teléfono sí son obligatorios, igual que en el portal público: el
// cliente recibe el mismo email de confirmación y el teléfono es la vía para
// avisarle cualquier cambio.
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';
import {
  calcularNoches,
  calcularPrecio,
  asignarParcelaMotorhome,
  diaSiguiente,
  CAPACIDAD_MAXIMA_CABANA,
} from '../../../../lib/reservas';
import { enviarEmailConfirmacion } from '../../../../lib/email';
import { validarDatosCliente } from '../../../../lib/validacion';

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

  const errorDatos = validarDatosCliente(body, {
    emailObligatorio: true,
    telefonoObligatorio: true,
  });
  if (errorDatos) {
    return new Response(JSON.stringify({ error: errorDatos }), { status: 400 });
  }

  // Los quinchos se reservan por un solo día.
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
  // libre del stock. QUINCHOS sigue con la parcela que eligió Staff.
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
      fecha_limite_pago: null,
      estado: 'CONFIRMADA',
      origen: 'MANUAL',
    })
    .select('id')
    .single();

  if (errInsert || !reserva) {
    console.error('POST /api/panel/reservas/manual — error insertando reserva:', errInsert);
    return new Response(
      JSON.stringify({ error: 'No se pudo crear la reserva' }),
      { status: 500 }
    );
  }

  // Mismo email que recibe quien reserva desde la web, pero sin plazo de
  // seña (las reservas manuales no vencen). Es "mejor esfuerzo": si Resend
  // falla, la reserva ya quedó cargada y Staff sigue con el mostrador.
  await enviarEmailConfirmacion({
    email,
    nombreCliente,
    unidadNombre: unidad.nombre,
    fechaIngreso: new Date(fechaIngreso),
    fechaSalida: new Date(fechaSalida),
    montoTotal,
    fechaLimitePago: null,
  });

  return new Response(JSON.stringify({ ok: true, reservaId: reserva.id }), { status: 201 });
};
