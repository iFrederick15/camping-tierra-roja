// Reglas de negocio compartidas entre el Portal público, la App de Staff y
// el Panel Admin. Único lugar donde viven estos cálculos — nunca se
// duplican en una ruta /api ni en una página.
import { supabaseAdmin } from './supabase';

export type EstadoPago = 'NO_PAGADO' | 'PARCIAL' | 'PAGADO';

export function calcularEstadoPago(montoTotal: number, montoPagado: number): EstadoPago {
  if (montoPagado <= 0) return 'NO_PAGADO';
  if (montoPagado >= montoTotal) return 'PAGADO';
  return 'PARCIAL';
}

// Documento de Producto §4.3: check-in bloqueado solo si no hay ningún pago
// registrado; un pago parcial ya alcanza para dejar entrar al cliente.
export function puedeHacerCheckin(montoTotal: number, montoPagado: number): boolean {
  return calcularEstadoPago(montoTotal, montoPagado) !== 'NO_PAGADO';
}

// Documento de Producto §4.3: check-out bloqueado hasta que el pago esté
// completo.
export function puedeHacerCheckout(montoTotal: number, montoPagado: number): boolean {
  return calcularEstadoPago(montoTotal, montoPagado) === 'PAGADO';
}

// Colores de marca (Documento de Producto §7) en vez de semáforo genérico
// rojo/amarillo/verde — ver tokens --color-alerta/advertencia/confirmado en
// global.css.
export const ESTILO_ESTADO_PAGO: Record<EstadoPago, { label: string; className: string }> = {
  NO_PAGADO: {
    label: 'No pagado',
    className: 'bg-primario/10 text-primario border-primario/30',
  },
  PARCIAL: {
    label: 'Parcial',
    className: 'bg-advertencia/10 text-advertencia border-advertencia/30',
  },
  PAGADO: {
    label: 'Pagado',
    className: 'bg-confirmado/10 text-confirmado border-confirmado/30',
  },
};

export function calcularNoches(fechaIngreso: string | Date, fechaSalida: string | Date): number {
  const ingreso = new Date(fechaIngreso);
  const salida = new Date(fechaSalida);
  return Math.max(1, Math.round((salida.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24)));
}

interface ConfiguracionPagos {
  horas_plazo_largo: number;
  horas_plazo_corto: number;
  dias_umbral_anticipacion: number;
}

export async function obtenerConfiguracionPagos(): Promise<ConfiguracionPagos> {
  const { data } = await supabaseAdmin
    .from('configuracion_pagos')
    .select('horas_plazo_largo, horas_plazo_corto, dias_umbral_anticipacion')
    .single();

  // Fallback a los valores por defecto de 001/002 si la fila no existiera
  // todavía (por ejemplo, antes de correr la migración 002).
  return data ?? { horas_plazo_largo: 48, horas_plazo_corto: 6, dias_umbral_anticipacion: 3 };
}

export function calcularFechaLimitePago(fechaIngreso: string | Date, config: ConfiguracionPagos): Date {
  const ahora = new Date();
  const ingreso = new Date(fechaIngreso);
  const diasAnticipacion = (ingreso.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24);
  const horasPlazo =
    diasAnticipacion > config.dias_umbral_anticipacion
      ? config.horas_plazo_largo
      : config.horas_plazo_corto;
  return new Date(ahora.getTime() + horasPlazo * 60 * 60 * 1000);
}

export type TipoUnidad = 'CAMPING' | 'MOTORHOME' | 'CABANA' | 'QUINCHOS';

export type Disponibilidad =
  | { tipo: 'cupo'; disponible: boolean; cuposLibres: number }
  | { tipo: 'unica'; disponible: boolean }
  | { tipo: 'lista'; opciones: { id: string; nombre: string; atributos: string[] }[] };

// Extraído de disponibilidad.ts para que la reserva manual de Staff use
// exactamente la misma fuente de verdad que el Portal público.
export async function obtenerDisponibilidad(
  unidadTipo: string,
  desde: string,
  hasta: string
): Promise<{ error: string; status: number } | { unidad: { id: string; nombre: string; precio_por_noche: number }; disponibilidad: Disponibilidad }> {
  const { data: unidad, error: errUnidad } = await supabaseAdmin
    .from('unidades')
    .select('id, tipo, nombre, precio_por_noche, cupo_total, parcelas(id, nombre, atributos, activa)')
    .eq('tipo', unidadTipo)
    .single();

  if (errUnidad || !unidad) {
    return { error: 'Unidad no encontrada', status: 404 };
  }

  const { data: solapadas, error: errReservas } = await supabaseAdmin
    .from('reservas')
    .select('parcela_id')
    .eq('unidad_id', unidad.id)
    .in('estado', ['CONFIRMADA', 'CHECKIN_HECHO'])
    .lt('fecha_ingreso', hasta)
    .gt('fecha_salida', desde);

  if (errReservas) {
    return { error: errReservas.message, status: 500 };
  }

  const unidadInfo = { id: unidad.id, nombre: unidad.nombre, precio_por_noche: unidad.precio_por_noche };

  if (unidad.tipo === 'MOTORHOME' || unidad.tipo === 'QUINCHOS') {
    const parcelasOcupadasIds = new Set((solapadas ?? []).map((r) => r.parcela_id));
    const disponibles = (unidad.parcelas ?? [])
      .filter((p: any) => p.activa && !parcelasOcupadasIds.has(p.id))
      .map((p: any) => ({ id: p.id, nombre: p.nombre, atributos: p.atributos }));

    return { unidad: unidadInfo, disponibilidad: { tipo: 'lista', opciones: disponibles } };
  }

  if (unidad.tipo === 'CAMPING') {
    const ocupadas = solapadas?.length ?? 0;
    const libres = (unidad.cupo_total ?? 0) - ocupadas;
    return {
      unidad: unidadInfo,
      disponibilidad: { tipo: 'cupo', disponible: libres > 0, cuposLibres: Math.max(libres, 0) },
    };
  }

  // CABANA: unidad única
  const disponible = (solapadas?.length ?? 0) === 0;
  return { unidad: unidadInfo, disponibilidad: { tipo: 'unica', disponible } };
}

// Fecha de "hoy" en huso horario de Puerto Iguazú — evita el off-by-one que
// daría usar la fecha UTC del server (Vercel corre en UTC) cerca de
// medianoche, algo crítico para decidir qué reserva es "de hoy".
export function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
}

export type EstadoReserva = 'CONFIRMADA' | 'CHECKIN_HECHO' | 'CHECKOUT_HECHO' | 'CANCELADA';

export interface ReservaResumen {
  id: string;
  nombreCliente: string;
  dni: string;
  telefono: string | null;
  email: string | null;
  unidadNombre: string;
  unidadTipo: TipoUnidad;
  parcelaNombre: string | null;
  fechaIngreso: string;
  fechaSalida: string;
  montoTotal: number;
  montoPagado: number;
  fechaLimitePago: string | null;
  estado: EstadoReserva;
  origen: 'WEB' | 'MANUAL';
  cantidadAcompanantes: number;
}

type FiltroReservas =
  | { modo: 'llegadas-hoy' }
  | { modo: 'salidas-hoy' }
  | { modo: 'buscar'; q: string }
  | { modo: 'pendientes-pago' };

const SELECT_RESUMEN =
  'id, nombre_cliente, dni, telefono, email, fecha_ingreso, fecha_salida, monto_total, monto_pagado, fecha_limite_pago, estado, origen, cantidad_acompanantes, unidades(nombre, tipo), parcelas(nombre)';

function mapearResumen(r: any): ReservaResumen {
  return {
    id: r.id,
    nombreCliente: r.nombre_cliente,
    dni: r.dni,
    telefono: r.telefono,
    email: r.email,
    unidadNombre: r.unidades?.nombre ?? '',
    unidadTipo: r.unidades?.tipo ?? 'CAMPING',
    parcelaNombre: r.parcelas?.nombre ?? null,
    fechaIngreso: r.fecha_ingreso,
    fechaSalida: r.fecha_salida,
    montoTotal: Number(r.monto_total),
    montoPagado: Number(r.monto_pagado),
    fechaLimitePago: r.fecha_limite_pago,
    estado: r.estado,
    origen: r.origen,
    cantidadAcompanantes: r.cantidad_acompanantes,
  };
}

// Listado usado por Inicio "Hoy", Buscar reserva y Pendientes de pago —
// llamado directo desde el frontmatter de cada página .astro (sin ida y
// vuelta HTTP: las páginas ya corren server-side).
export async function listarReservas(filtro: FiltroReservas): Promise<ReservaResumen[]> {
  const hoy = hoyISO();
  let query = supabaseAdmin.from('reservas').select(SELECT_RESUMEN);

  if (filtro.modo === 'llegadas-hoy') {
    query = query.eq('fecha_ingreso', hoy).eq('estado', 'CONFIRMADA');
  } else if (filtro.modo === 'salidas-hoy') {
    query = query.eq('fecha_salida', hoy).eq('estado', 'CHECKIN_HECHO');
  } else if (filtro.modo === 'buscar') {
    const termino = filtro.q.replace(/[,%]/g, '').trim();
    if (!termino) return [];
    query = query
      .or(`nombre_cliente.ilike.%${termino}%,dni.ilike.%${termino}%`)
      .order('fecha_ingreso', { ascending: false })
      .limit(30);
  } else {
    query = query
      .eq('estado', 'CONFIRMADA')
      .not('fecha_limite_pago', 'is', null)
      .order('fecha_limite_pago', { ascending: true });
  }

  const { data, error } = await query;
  if (error || !data) return [];

  let filas = data.map(mapearResumen);
  if (filtro.modo === 'pendientes-pago') {
    filas = filas.filter((r) => calcularEstadoPago(r.montoTotal, r.montoPagado) !== 'PAGADO');
  }
  return filas;
}

// Detalle de una reserva puntual — Detalle/Check-in/Check-out.
export async function obtenerReserva(id: string): Promise<ReservaResumen | null> {
  const { data, error } = await supabaseAdmin
    .from('reservas')
    .select(SELECT_RESUMEN)
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapearResumen(data);
}
