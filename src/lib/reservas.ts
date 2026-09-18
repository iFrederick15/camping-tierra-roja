// Reglas de negocio compartidas entre el Portal público, la App de Staff y
// el Panel Admin. Único lugar donde viven estos cálculos — nunca se
// duplican en una ruta /api ni en una página.
import { supabaseAdmin } from './supabase';

// Re-exportado para que este siga siendo el único punto de entrada de las
// reglas de negocio. Vive en su propio módulo porque lib/email.ts lo necesita
// sin arrastrar el cliente de Supabase — ver el comentario de ese archivo.
export { codigoReserva } from './codigo-reserva';

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

export function calcularFechaLimitePago(
  fechaIngreso: string | Date,
  config: ConfiguracionPagos
): Date {
  const ahora = new Date();
  const ingreso = new Date(fechaIngreso);
  const diasAnticipacion = (ingreso.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24);
  const horasPlazo =
    diasAnticipacion > config.dias_umbral_anticipacion
      ? config.horas_plazo_largo
      : config.horas_plazo_corto;
  return new Date(ahora.getTime() + horasPlazo * 60 * 60 * 1000);
}

export type TipoUnidad = 'CAMPING' | 'MOTORHOME' | 'CABANA' | 'QUINCHOS' | 'SALON';

// Lo que se ofrece al público y se puede reservar con cliente y precio. El
// salón de eventos (sql/010_salon_eventos.sql) queda afuera: solo existe en
// el Calendario del Panel, donde la dueña marca con bloqueos cuándo está
// ocupado. Las rutas públicas rechazan cualquier tipo fuera de esta lista.
export const TIPOS_PUBLICOS = ['CAMPING', 'MOTORHOME', 'CABANA', 'QUINCHOS'] as const;

export function esTipoPublico(tipo: unknown): boolean {
  return (TIPOS_PUBLICOS as readonly unknown[]).includes(tipo);
}

export type Disponibilidad =
  | { tipo: 'cupo'; disponible: boolean; cuposLibres: number }
  | { tipo: 'unica'; disponible: boolean }
  | { tipo: 'lista'; opciones: { id: string; nombre: string; atributos: string[] }[] };

// ------------------------------------------------------------
// Bloqueos de disponibilidad — la dueña "deshabilita" fechas desde el
// Calendario (mantenimiento, uso propio, evento privado). Ocupan lugar
// igual que una reserva, pero sin cliente ni precio.
// Ver sql/009_bloqueos.sql para el significado de parcelaId/plazas.
// ------------------------------------------------------------
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export interface Bloqueo {
  id: string;
  unidadId: string;
  parcelaId: string | null;
  plazas: number | null; // null + parcelaId null = la unidad entera
  fechaInicio: string;
  fechaFin: string; // exclusiva, igual que reservas.fecha_salida
  nota: string | null;
  creadoPor: string | null;
}

const SELECT_BLOQUEO =
  'id, unidad_id, parcela_id, plazas, fecha_inicio, fecha_fin, nota, creado_por';

function mapearBloqueo(b: any): Bloqueo {
  return {
    id: b.id,
    unidadId: b.unidad_id,
    parcelaId: b.parcela_id,
    plazas: b.plazas,
    fechaInicio: b.fecha_inicio,
    fechaFin: b.fecha_fin,
    nota: b.nota,
    creadoPor: b.creado_por,
  };
}

// Bloqueos de una unidad que pisan el rango [desde, hasta) — mismo criterio
// de solapamiento que las reservas.
export async function listarBloqueos(
  unidadId: string,
  desde: string,
  hasta: string
): Promise<Bloqueo[]> {
  const { data, error } = await supabaseAdmin
    .from('bloqueos')
    .select(SELECT_BLOQUEO)
    .eq('unidad_id', unidadId)
    .lt('fecha_inicio', hasta)
    .gt('fecha_fin', desde)
    .order('fecha_inicio');

  if (error) {
    // Si todavía no se corrió la migración 009 la tabla no existe: el sitio
    // sigue funcionando como antes (sin bloqueos) en vez de caerse entero.
    if (error.code === '42P01' || error.code === 'PGRST205') {
      console.warn('listarBloqueos: falta correr sql/009_bloqueos.sql');
      return [];
    }
    // Cualquier otro error sí corta: devolver una lista vacía "abriría"
    // fechas que la dueña cerró y las dejaría reservables desde la web.
    console.error('listarBloqueos:', error);
    throw new Error('No se pudieron leer los bloqueos');
  }
  return (data ?? []).map(mapearBloqueo);
}

// Un bloqueo sin parcela y sin plazas deshabilita la unidad completa.
function bloqueaUnidadEntera(bloqueos: Bloqueo[]): boolean {
  return bloqueos.some((b) => b.parcelaId === null && b.plazas === null);
}

// Cuántos lugares del cupo genérico (CAMPING) tapan los bloqueos ese día.
function plazasBloqueadasEnDia(bloqueos: Bloqueo[], dia: string, cupoTotal: number): number {
  return bloqueos
    .filter((b) => b.fechaInicio <= dia && b.fechaFin > dia)
    .reduce((acc, b) => acc + (b.plazas ?? cupoTotal), 0);
}

// Días sueltos de un rango [desde, hasta). El cupo del camping se mide por
// día: dos bloqueos que caen dentro del mismo rango pero no comparten ningún
// día no se pisan entre sí, y sumarlos de a rango rechazaría fechas que en
// realidad tienen lugar.
function diasDelRango(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  if (!FORMATO_FECHA.test(desde) || !FORMATO_FECHA.test(hasta)) return dias;
  // Tope defensivo: un rango absurdo no puede colgar el server.
  for (let dia = desde; dia < hasta && dias.length < 400; dia = diaSiguiente(dia)) dias.push(dia);
  return dias;
}

// Lugares del camping que los bloqueos tapan en el peor día del rango — es
// el día que define si queda o no lugar para toda la estadía.
function plazasBloqueadasEnRango(
  bloqueos: Bloqueo[],
  desde: string,
  hasta: string,
  cupoTotal: number
): number {
  return diasDelRango(desde, hasta).reduce(
    (peor, dia) => Math.max(peor, plazasBloqueadasEnDia(bloqueos, dia, cupoTotal)),
    0
  );
}

// Extraído de disponibilidad.ts para que la reserva manual de Staff use
// exactamente la misma fuente de verdad que el Portal público.
// "categoria" solo aplica (y es obligatoria) para QUINCHOS: filtra las
// parcelas a las que pertenecen a esa categoría (chico/grande/especial/
// compartido) — cada categoría tiene su propio precio y su propio grupo de
// parcelas numeradas.
export async function obtenerDisponibilidad(
  unidadTipo: string,
  desde: string,
  hasta: string,
  categoria?: string,
  // Al editar una reserva, se la excluye del cálculo para que no colisione
  // consigo misma (sus propias fechas ya "ocupan" la unidad/parcela).
  excluirReservaId?: string
): Promise<
  | { error: string; status: number }
  | { unidad: { id: string; nombre: string }; disponibilidad: Disponibilidad }
> {
  const { data: unidad, error: errUnidad } = await supabaseAdmin
    .from('unidades')
    .select(
      'id, tipo, nombre, cupo_total, parcelas(id, nombre, atributos, activa, opciones_precio(clave))'
    )
    .eq('tipo', unidadTipo)
    .single();

  if (errUnidad || !unidad) {
    return { error: 'Unidad no encontrada', status: 404 };
  }

  if (unidad.tipo === 'QUINCHOS' && !categoria) {
    return { error: 'Falta la categoría de quincho', status: 400 };
  }

  let queryReservas = supabaseAdmin
    .from('reservas')
    .select('parcela_id')
    .eq('unidad_id', unidad.id)
    .in('estado', ['CONFIRMADA', 'CHECKIN_HECHO'])
    .lt('fecha_ingreso', hasta)
    .gt('fecha_salida', desde);
  if (excluirReservaId) queryReservas = queryReservas.neq('id', excluirReservaId);

  // Los bloqueos que puso la dueña desde el Calendario ocupan lugar igual
  // que una reserva (ver sql/009_bloqueos.sql).
  let solapadas: { parcela_id: string | null }[] | null;
  let bloqueos: Bloqueo[];
  try {
    const [resReservas, resBloqueos] = await Promise.all([
      queryReservas,
      listarBloqueos(unidad.id, desde, hasta),
    ]);
    if (resReservas.error) {
      console.error('obtenerDisponibilidad — error consultando reservas:', resReservas.error);
      return { error: 'No se pudo calcular la disponibilidad', status: 500 };
    }
    solapadas = resReservas.data;
    bloqueos = resBloqueos;
  } catch (e) {
    console.error('obtenerDisponibilidad — error consultando bloqueos:', e);
    return { error: 'No se pudo calcular la disponibilidad', status: 500 };
  }

  const unidadInfo = { id: unidad.id, nombre: unidad.nombre };
  const unidadBloqueada = bloqueaUnidadEntera(bloqueos);
  const parcelasBloqueadas = new Set(bloqueos.map((b) => b.parcelaId).filter(Boolean));

  // MOTORHOME: el cliente no elige parcela — el sistema asigna una libre
  // automáticamente al confirmar (ver asignarParcelaMotorhome). Acá solo
  // importa saber si hay al menos una parcela activa sin solapar.
  if (unidad.tipo === 'MOTORHOME') {
    const parcelasOcupadasIds = new Set((solapadas ?? []).map((r) => r.parcela_id));
    const libres = unidadBloqueada
      ? []
      : (unidad.parcelas ?? []).filter(
          (p: any) => p.activa && !parcelasOcupadasIds.has(p.id) && !parcelasBloqueadas.has(p.id)
        );
    return {
      unidad: unidadInfo,
      disponibilidad: { tipo: 'cupo', disponible: libres.length > 0, cuposLibres: libres.length },
    };
  }

  if (unidad.tipo === 'QUINCHOS') {
    const parcelasOcupadasIds = new Set((solapadas ?? []).map((r) => r.parcela_id));
    const disponibles = unidadBloqueada
      ? []
      : (unidad.parcelas ?? [])
          .filter(
            (p: any) =>
              p.activa &&
              !parcelasOcupadasIds.has(p.id) &&
              !parcelasBloqueadas.has(p.id) &&
              p.opciones_precio?.clave === categoria
          )
          .map((p: any) => ({ id: p.id, nombre: p.nombre, atributos: p.atributos }));

    return { unidad: unidadInfo, disponibilidad: { tipo: 'lista', opciones: disponibles } };
  }

  if (unidad.tipo === 'CAMPING') {
    const cupo = unidad.cupo_total ?? 0;
    const ocupadas = solapadas?.length ?? 0;
    const libres = cupo - ocupadas - plazasBloqueadasEnRango(bloqueos, desde, hasta, cupo);
    return {
      unidad: unidadInfo,
      disponibilidad: { tipo: 'cupo', disponible: libres > 0, cuposLibres: Math.max(libres, 0) },
    };
  }

  // CABANA / SALON: unidad única — cualquier bloqueo la deshabilita entera.
  const disponible = (solapadas?.length ?? 0) === 0 && bloqueos.length === 0;
  return { unidad: unidadInfo, disponibilidad: { tipo: 'unica', disponible } };
}

// Elige una parcela de Motorhome libre para esas fechas (la más baja
// numerada entre las disponibles) — el cliente ya no elige "Parcela N", el
// sistema la saca del stock al confirmar. Llamarla recién al confirmar (no
// al mostrar disponibilidad) para no reservarle una parcela a alguien que
// todavía está mirando fechas.
// NOTA: mismo hueco de concurrencia que el resto de las reservas (ver nota
// en reservar.ts) — dos confirmaciones simultáneas podrían tomar la misma
// parcela hasta que eso se resuelva con un lock en Postgres.
export async function asignarParcelaMotorhome(
  unidadId: string,
  desde: string,
  hasta: string,
  excluirReservaId?: string,
  // Al editar una reserva, se conserva su parcela actual si sigue libre para
  // no reubicar al cliente sin necesidad.
  parcelaPreferida?: string | null
): Promise<string | null> {
  const { data: parcelas } = await supabaseAdmin
    .from('parcelas')
    .select('id, numero')
    .eq('unidad_id', unidadId)
    .eq('activa', true)
    .order('numero');

  let querySolapadas = supabaseAdmin
    .from('reservas')
    .select('parcela_id')
    .eq('unidad_id', unidadId)
    .in('estado', ['CONFIRMADA', 'CHECKIN_HECHO'])
    .lt('fecha_ingreso', hasta)
    .gt('fecha_salida', desde);
  if (excluirReservaId) querySolapadas = querySolapadas.neq('id', excluirReservaId);
  const [{ data: solapadas }, bloqueos] = await Promise.all([
    querySolapadas,
    listarBloqueos(unidadId, desde, hasta),
  ]);

  // Una parcela bloqueada por la dueña no se puede asignar, igual que una
  // ocupada; si el bloqueo es de toda la unidad, no hay ninguna para dar.
  if (bloqueaUnidadEntera(bloqueos)) return null;
  const ocupadasIds = new Set([
    ...(solapadas ?? []).map((r) => r.parcela_id),
    ...bloqueos.map((b) => b.parcelaId),
  ]);
  if (
    parcelaPreferida &&
    !ocupadasIds.has(parcelaPreferida) &&
    (parcelas ?? []).some((p) => p.id === parcelaPreferida)
  ) {
    return parcelaPreferida;
  }
  const libre = (parcelas ?? []).find((p) => !ocupadasIds.has(p.id));
  return libre?.id ?? null;
}

// Las rutas de reserva manejan la parcela por id (uuid); el email de
// confirmación necesita el nombre legible ("Parcela 12") para que el cliente
// sepa adónde ir al llegar.
export async function nombreDeParcela(parcelaId: string | null): Promise<string | null> {
  if (!parcelaId) return null;
  const { data } = await supabaseAdmin
    .from('parcelas')
    .select('nombre')
    .eq('id', parcelaId)
    .single();
  return data?.nombre ?? null;
}

// ------------------------------------------------------------
// Crear / quitar bloqueos. La validación vive acá (y no en la ruta /api)
// para que sea la misma regla que usa obtenerDisponibilidad: un bloqueo
// nunca puede pisar una reserva ya tomada ni dejar el cupo en negativo.
// ------------------------------------------------------------
export interface EntradaBloqueo {
  unidadTipo: string;
  // Lugar puntual a bloquear (motorhome / quincho). Se ignora si
  // todaLaUnidad viene en true.
  parcelaId?: string | null;
  todaLaUnidad?: boolean;
  fechaInicio: string;
  fechaFin: string; // exclusiva
  nota?: string | null;
  creadoPor?: string | null;
}

const LARGO_MAXIMO_NOTA = 300;

const fechaCorta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export async function crearBloqueo(
  entrada: EntradaBloqueo
): Promise<{ error: string; status: number } | { bloqueo: Bloqueo }> {
  const { fechaInicio, fechaFin } = entrada;
  if (
    !FORMATO_FECHA.test(fechaInicio ?? '') ||
    !FORMATO_FECHA.test(fechaFin ?? '') ||
    fechaFin <= fechaInicio
  ) {
    return { error: 'Las fechas del bloqueo no son válidas', status: 400 };
  }

  const { data: unidad, error: errUnidad } = await supabaseAdmin
    .from('unidades')
    .select('id, tipo, nombre, cupo_total')
    .eq('tipo', entrada.unidadTipo)
    .single();

  if (errUnidad || !unidad) {
    return { error: 'Unidad no encontrada', status: 404 };
  }

  // La cabaña y el salón son uno solo: bloquearlos siempre los ocupa enteros.
  const todaLaUnidad =
    Boolean(entrada.todaLaUnidad) || unidad.tipo === 'CABANA' || unidad.tipo === 'SALON';
  const necesitaParcela = unidad.tipo === 'MOTORHOME' || unidad.tipo === 'QUINCHOS';

  let parcelaId: string | null = null;
  if (!todaLaUnidad && necesitaParcela) {
    if (!entrada.parcelaId) {
      return { error: 'Elegí el lugar a bloquear, o bloqueá la unidad entera', status: 400 };
    }
    const { data: parcela } = await supabaseAdmin
      .from('parcelas')
      .select('id')
      .eq('id', entrada.parcelaId)
      .eq('unidad_id', unidad.id)
      .maybeSingle();
    if (!parcela) {
      return { error: 'Ese lugar no pertenece a esta unidad', status: 400 };
    }
    parcelaId = parcela.id;
  }

  // CAMPING no tiene parcelas: un bloqueo de un solo lugar se guarda como
  // "1 plaza del cupo" (ver sql/009_bloqueos.sql).
  const plazas = !todaLaUnidad && unidad.tipo === 'CAMPING' ? 1 : null;

  let reservasSolapadas: {
    parcela_id: string | null;
    fecha_ingreso: string;
    fecha_salida: string;
  }[];
  let bloqueosExistentes: Bloqueo[];
  try {
    const [resReservas, resBloqueos] = await Promise.all([
      supabaseAdmin
        .from('reservas')
        .select('parcela_id, fecha_ingreso, fecha_salida')
        .eq('unidad_id', unidad.id)
        .in('estado', ['CONFIRMADA', 'CHECKIN_HECHO'])
        .lt('fecha_ingreso', fechaFin)
        .gt('fecha_salida', fechaInicio),
      listarBloqueos(unidad.id, fechaInicio, fechaFin),
    ]);
    if (resReservas.error) throw resReservas.error;
    reservasSolapadas = resReservas.data ?? [];
    bloqueosExistentes = resBloqueos;
  } catch (e) {
    console.error('crearBloqueo — error consultando ocupación:', e);
    return { error: 'No se pudo verificar la ocupación de esas fechas', status: 500 };
  }

  if (todaLaUnidad) {
    if (reservasSolapadas.length > 0) {
      return {
        error: `Hay ${reservasSolapadas.length} reserva(s) en esas fechas: cancelalas o cambialas de fecha antes de bloquear todo.`,
        status: 409,
      };
    }
    // En una unidad única, un segundo bloqueo encima de otro sería anotar
    // dos eventos el mismo día en el salón: se rechaza.
    if ((unidad.tipo === 'CABANA' || unidad.tipo === 'SALON') && bloqueosExistentes.length > 0) {
      const b = bloqueosExistentes[0];
      return {
        error: `Esas fechas ya están ocupadas (${fechaCorta(b.fechaInicio)} → ${fechaCorta(b.fechaFin)}${b.nota ? `: ${b.nota}` : ''})`,
        status: 409,
      };
    }
  } else if (parcelaId) {
    if (reservasSolapadas.some((r) => r.parcela_id === parcelaId)) {
      return { error: 'Ese lugar ya tiene una reserva en esas fechas', status: 409 };
    }
    // Un bloqueo duplicado quedaría tapado por el que ya está y no se vería
    // en el Calendario: se rechaza en vez de dejar filas invisibles.
    if (bloqueosExistentes.some((b) => b.parcelaId === parcelaId || b.parcelaId === null)) {
      return { error: 'Esas fechas ya están bloqueadas', status: 409 };
    }
  } else {
    // CAMPING, un lugar del cupo: tiene que quedar al menos uno libre cada
    // día del rango.
    const cupo = unidad.cupo_total ?? 0;
    for (const dia of diasDelRango(fechaInicio, fechaFin)) {
      const reservasDia = reservasSolapadas.filter(
        (r) => r.fecha_ingreso <= dia && r.fecha_salida > dia
      ).length;
      const bloqueadasDia = plazasBloqueadasEnDia(bloqueosExistentes, dia, cupo);
      if (reservasDia + bloqueadasDia + 1 > cupo) {
        return {
          error: `El ${fechaCorta(dia)} ya no queda ningún lugar libre para bloquear`,
          status: 409,
        };
      }
    }
  }

  const nota = (entrada.nota ?? '').trim().slice(0, LARGO_MAXIMO_NOTA) || null;

  const { data, error } = await supabaseAdmin
    .from('bloqueos')
    .insert({
      unidad_id: unidad.id,
      parcela_id: parcelaId,
      plazas,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      nota,
      creado_por: entrada.creadoPor ?? null,
    })
    .select(SELECT_BLOQUEO)
    .single();

  if (error || !data) {
    console.error('crearBloqueo — error insertando:', error);
    return { error: 'No se pudo guardar el bloqueo', status: 500 };
  }
  return { bloqueo: mapearBloqueo(data) };
}

export async function eliminarBloqueo(
  id: string
): Promise<{ error: string; status: number } | null> {
  const { error } = await supabaseAdmin.from('bloqueos').delete().eq('id', id);
  if (error) {
    console.error('eliminarBloqueo:', error);
    return { error: 'No se pudo quitar el bloqueo', status: 500 };
  }
  return null;
}

// ------------------------------------------------------------
// Precio: cada unidad tiene una lista de "ítems" (opciones_precio) — ver
// sql/003_precios_itemizados.sql. Único lugar donde se calcula monto_total,
// usado tanto por el Portal público (reservar.ts) como por la carga manual
// de Staff (manual.ts) y por el resumen en vivo de BookingWidget.
// ------------------------------------------------------------
export const CAPACIDAD_MAXIMA_CABANA = 8;

export interface SeleccionPrecio {
  categoria?: string; // MOTORHOME: CHICO/GRANDE. QUINCHOS: CHICO/GRANDE/ESPECIAL/COMPARTIDO. CABANA: FIJO.
  acompanantes?: number; // MOTORHOME
  menores?: number; // CAMPING (cobra) / CABANA (informativo, no se usa acá)
  mayores?: number; // CAMPING (cobra) / CABANA (informativo, no se usa acá)
}

export interface ItemPrecio {
  clave: string;
  etiqueta: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export async function calcularPrecio(
  unidadTipo: string,
  noches: number,
  seleccion: SeleccionPrecio
): Promise<{ error: string; status: number } | { montoTotal: number; detalle: ItemPrecio[] }> {
  const { data: unidad, error: errUnidad } = await supabaseAdmin
    .from('unidades')
    .select('id, opciones_precio(clave, etiqueta, tipo_cargo, precio_por_noche, activo)')
    .eq('tipo', unidadTipo)
    .single();

  if (errUnidad || !unidad) {
    return { error: 'Unidad no válida', status: 400 };
  }

  const opciones = ((unidad as any).opciones_precio ?? []).filter((o: any) => o.activo);
  const detalle: ItemPrecio[] = [];

  for (const op of opciones) {
    let cantidad = 0;
    if (op.tipo_cargo === 'BASE') {
      cantidad = seleccion.categoria === op.clave ? 1 : 0;
    } else if (op.tipo_cargo === 'CANTIDAD') {
      if (op.clave === 'ACOMPANANTE') cantidad = seleccion.acompanantes ?? 0;
      else if (op.clave === 'MENOR') cantidad = seleccion.menores ?? 0;
      else if (op.clave === 'MAYOR') cantidad = seleccion.mayores ?? 0;
    }
    if (cantidad <= 0) continue;

    const precioUnitario = Number(op.precio_por_noche);
    detalle.push({
      clave: op.clave,
      etiqueta: op.etiqueta,
      cantidad,
      precioUnitario,
      subtotal: cantidad * precioUnitario * noches,
    });
  }

  const montoTotal = detalle.reduce((acc, d) => acc + d.subtotal, 0);
  return { montoTotal, detalle };
}

// Fecha de "hoy" en huso horario de Puerto Iguazú — evita el off-by-one que
// daría usar la fecha UTC del server (Vercel corre en UTC) cerca de
// medianoche, algo crítico para decidir qué reserva es "de hoy".
export function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
}

// Espejo de diaSiguiente() en BookingWidget.tsx — usado para validar que un
// quincho (que se reserva por un solo día) tenga fecha_salida = día
// siguiente a fecha_ingreso.
export function diaSiguiente(fechaISO: string): string {
  const [y, m, d] = fechaISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
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
  cantidadMenores: number;
  cantidadMayores: number;
  detallePrecio: ItemPrecio[];
  parcelaId: string | null;
  categoriaSeleccionada: string | null;
  datosVehiculo: string | null;
}

type FiltroReservas =
  | { modo: 'llegadas-hoy' }
  | { modo: 'salidas-hoy' }
  | { modo: 'buscar'; q: string }
  | { modo: 'pendientes-pago' }
  // Todo lo que toca un día cualquiera (vista Día del Calendario): quien
  // llega, quien ya está y quien se va ese día.
  | { modo: 'del-dia'; fecha: string };

const SELECT_RESUMEN =
  'id, nombre_cliente, dni, telefono, email, fecha_ingreso, fecha_salida, monto_total, monto_pagado, fecha_limite_pago, estado, origen, cantidad_acompanantes, cantidad_menores, cantidad_mayores, detalle_precio, parcela_id, categoria_seleccionada, datos_vehiculo, unidades(nombre, tipo), parcelas(nombre)';

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
    cantidadMenores: r.cantidad_menores ?? 0,
    cantidadMayores: r.cantidad_mayores ?? 0,
    detallePrecio: r.detalle_precio ?? [],
    parcelaId: r.parcela_id ?? null,
    categoriaSeleccionada: r.categoria_seleccionada ?? null,
    datosVehiculo: r.datos_vehiculo ?? null,
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
  } else if (filtro.modo === 'del-dia') {
    // fecha_salida es exclusiva para ocupar la noche, pero la reserva que se
    // va ese día sigue estando en el predio hasta el check-out: entra con
    // `gte` y la vista la marca como salida.
    query = query
      .lte('fecha_ingreso', filtro.fecha)
      .gte('fecha_salida', filtro.fecha)
      .neq('estado', 'CANCELADA')
      .order('fecha_ingreso', { ascending: true });
  } else if (filtro.modo === 'buscar') {
    // Allowlist estricta: solo letras (incl. acentos/ñ), números y espacios.
    // Evita que caracteres con significado en el filtro PostgREST
    // (`, . ( ) * :`) alteren la semántica de la consulta `.or(...)`.
    const termino = filtro.q
      .normalize('NFC')
      .replace(/[^\p{L}\p{N} ]/gu, '')
      .trim()
      .slice(0, 60);
    if (!termino) return [];

    const condiciones = [`nombre_cliente.ilike.%${termino}%`, `dni.ilike.%${termino}%`];

    // Búsqueda por el código del email ("A3F91C2D"). Son los primeros 8
    // caracteres hex del uuid, y sobre una columna uuid no se puede usar LIKE;
    // pero como es un prefijo, todos los uuid que empiezan con esos dígitos
    // caen en un rango contiguo. Así entra por el índice de la clave primaria
    // en vez de recorrer la tabla.
    if (/^[0-9a-f]{8}$/i.test(termino)) {
      const c = termino.toLowerCase();
      condiciones.push(
        `and(id.gte.${c}-0000-0000-0000-000000000000,id.lte.${c}-ffff-ffff-ffff-ffffffffffff)`
      );
    }

    query = query.or(condiciones.join(',')).order('fecha_ingreso', { ascending: false }).limit(30);
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

// ------------------------------------------------------------
// Reporte mensual — usado por la página /panel/admin/reportes (números en
// pantalla) y por /api/panel/admin/reportes (descarga Excel). Mismo cálculo
// para las dos, para que lo que se ve coincida con lo que se descarga.
// El "mes" se interpreta en huso horario de Puerto Iguazú.
// ------------------------------------------------------------
export interface FilaReservaReporte {
  fechaIngreso: string;
  fechaSalida: string;
  noches: number;
  nombreCliente: string;
  dni: string;
  telefono: string | null;
  email: string | null;
  unidadNombre: string;
  parcelaNombre: string | null;
  estado: EstadoReserva;
  origen: 'WEB' | 'MANUAL';
  montoTotal: number;
  montoPagado: number;
  estadoPago: string;
  creadaEn: string;
}

export interface FilaPagoReporte {
  fecha: string;
  nombreCliente: string;
  metodo: string;
  monto: number;
  registradoPor: string | null;
  nota: string | null;
}

export interface ReporteMensual {
  mes: string; // YYYY-MM
  nombreMes: string;
  facturadoDelMes: number;
  nochesOcupadas: number;
  reservasTotales: number;
  reservas: FilaReservaReporte[];
  pagos: FilaPagoReporte[];
}

const ETIQUETA_ESTADO_PAGO: Record<EstadoPago, string> = {
  NO_PAGADO: 'No pagado',
  PARCIAL: 'Parcial',
  PAGADO: 'Pagado',
};

// Normaliza cualquier entrada a YYYY-MM válido; si no lo es, usa el mes actual.
export function mesValido(mes: string | null | undefined): string {
  return mes && /^\d{4}-\d{2}$/.test(mes) ? mes : hoyISO().slice(0, 7);
}

export async function obtenerReporteMensual(
  mesEntrada: string | null | undefined
): Promise<ReporteMensual> {
  const mes = mesValido(mesEntrada);
  const [anio, mesNum] = mes.split('-').map(Number);
  const inicioDia = `${mes}-01`;
  const finDia = new Date(Date.UTC(anio, mesNum, 1)).toISOString().slice(0, 10);
  const inicioTs = new Date(Date.UTC(anio, mesNum - 1, 1)).toISOString();
  const finTs = new Date(Date.UTC(anio, mesNum, 1)).toISOString();
  const nombreMes = new Date(anio, mesNum - 1, 1).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  const [{ data: pagosData }, { data: reservasData }] = await Promise.all([
    supabaseAdmin
      .from('pagos')
      .select('creado_en, monto, metodo, nota, registrado_por, reservas(nombre_cliente)')
      .gte('creado_en', inicioTs)
      .lt('creado_en', finTs)
      .order('creado_en', { ascending: true }),
    supabaseAdmin
      .from('reservas')
      .select(
        'fecha_ingreso, fecha_salida, nombre_cliente, dni, telefono, email, monto_total, monto_pagado, estado, origen, creado_en, unidades(nombre), parcelas(nombre)'
      )
      .gte('fecha_ingreso', inicioDia)
      .lt('fecha_ingreso', finDia)
      .order('fecha_ingreso', { ascending: true }),
  ]);

  const pagos: FilaPagoReporte[] = (pagosData ?? []).map((p: any) => ({
    fecha: p.creado_en,
    nombreCliente: p.reservas?.nombre_cliente ?? '',
    metodo: p.metodo,
    monto: Number(p.monto),
    registradoPor: p.registrado_por,
    nota: p.nota,
  }));

  const reservas: FilaReservaReporte[] = (reservasData ?? []).map((r: any) => {
    const montoTotal = Number(r.monto_total);
    const montoPagado = Number(r.monto_pagado);
    return {
      fechaIngreso: r.fecha_ingreso,
      fechaSalida: r.fecha_salida,
      noches: calcularNoches(r.fecha_ingreso, r.fecha_salida),
      nombreCliente: r.nombre_cliente,
      dni: r.dni,
      telefono: r.telefono,
      email: r.email,
      unidadNombre: r.unidades?.nombre ?? '',
      parcelaNombre: r.parcelas?.nombre ?? null,
      estado: r.estado,
      origen: r.origen,
      montoTotal,
      montoPagado,
      estadoPago: ETIQUETA_ESTADO_PAGO[calcularEstadoPago(montoTotal, montoPagado)],
      creadaEn: r.creado_en,
    };
  });

  // Los totales en pantalla excluyen las canceladas (igual que la Vista
  // operativa); el detalle sí las lista, marcadas como CANCELADA.
  const noCanceladas = reservas.filter((r) => r.estado !== 'CANCELADA');

  return {
    mes,
    nombreMes,
    facturadoDelMes: pagos.reduce((acc, p) => acc + p.monto, 0),
    nochesOcupadas: noCanceladas.reduce((acc, r) => acc + r.noches, 0),
    reservasTotales: noCanceladas.length,
    reservas,
    pagos,
  };
}

// ------------------------------------------------------------
// Comentarios de reserva — bitácora libre para asentar inconvenientes.
// Ver sql/007_comentarios_reserva.sql. Se listan en la pantalla de Detalle.
// ------------------------------------------------------------
export interface ComentarioReserva {
  id: string;
  texto: string;
  autor: string | null;
  creadoEn: string;
}

export async function listarComentarios(reservaId: string): Promise<ComentarioReserva[]> {
  const { data, error } = await supabaseAdmin
    .from('comentarios_reserva')
    .select('id, texto, autor, creado_en')
    .eq('reserva_id', reservaId)
    .order('creado_en', { ascending: false });
  if (error || !data) return [];
  return data.map((c: any) => ({
    id: c.id,
    texto: c.texto,
    autor: c.autor,
    creadoEn: c.creado_en,
  }));
}

export async function agregarComentario(
  reservaId: string,
  texto: string,
  autor: string | null
): Promise<ComentarioReserva | null> {
  const { data, error } = await supabaseAdmin
    .from('comentarios_reserva')
    .insert({ reserva_id: reservaId, texto, autor })
    .select('id, texto, autor, creado_en')
    .single();
  if (error || !data) {
    console.error('agregarComentario:', error);
    return null;
  }
  return { id: data.id, texto: data.texto, autor: data.autor, creadoEn: data.creado_en };
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
