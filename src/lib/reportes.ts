// Reportes del Panel Admin. Cada reporte es una función propia con su propia
// consulta; los usan la página /panel/admin/reportes (llamada directa desde el
// frontmatter), las rutas JSON /api/panel/admin/reportes/[reporte] y la
// descarga Excel /api/panel/admin/reportes. Mismo cálculo para las tres, así
// lo que se ve coincide con lo que se descarga.
//
// Criterios comunes:
// - Las fechas son días calendario de Puerto Iguazú; los rangos son
//   [desde, hasta) con `hasta` exclusiva, igual que reservas.fecha_salida.
// - Una reserva "pertenece" al período por su fecha_ingreso (ingresos, tasas,
//   origen, anticipación). La ocupación, en cambio, cuenta noche por noche:
//   una estadía del 30/09 al 03/10 suma 1 noche a septiembre y 2 a octubre.
// - La capacidad sale de la configuración actual (cupo del camping, parcelas
//   activas): no hay historial de cuántas parcelas había activas cada mes.
import { supabaseAdmin } from './supabase';
import {
  TIPOS_PUBLICOS,
  calcularEstadoPago,
  calcularNoches,
  diaSiguiente,
  hoyISO,
  type EstadoPago,
  type EstadoReserva,
  type TipoUnidad,
} from './reservas';

export const TIPOS_REPORTE: readonly TipoUnidad[] = [...TIPOS_PUBLICOS, 'SALON'];

// Sin rubro elegido se promedia el alojamiento, sin el salón — mismo criterio
// que el porcentaje de ocupación de la Vista operativa.
export const TIPOS_ALOJAMIENTO: readonly TipoUnidad[] = TIPOS_PUBLICOS;

export const NOMBRE_RUBRO: Record<TipoUnidad, string> = {
  CAMPING: 'Camping',
  MOTORHOME: 'Motorhome',
  CABANA: 'Cabaña',
  QUINCHOS: 'Quinchos',
  SALON: 'Salón',
};

// Los quinchos y el salón se alquilan por día, no por noche.
export const unidadDeUso = (tipo: TipoUnidad) =>
  tipo === 'QUINCHOS' || tipo === 'SALON' ? 'días' : 'noches';

// ------------------------------------------------------------
// Fechas
// ------------------------------------------------------------
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MS_DIA = 1000 * 60 * 60 * 24;
// Tope defensivo: un rango de años no puede colgar el server.
const DIAS_MAXIMOS_PERIODO = 366 * 3;

export interface Periodo {
  desde: string;
  hasta: string; // exclusiva
}

const aUTC = (fecha: string) => {
  const [y, m, d] = fecha.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUTC(hasta) - aUTC(desde)) / MS_DIA);
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(aUTC(fecha) + dias * MS_DIA).toISOString().slice(0, 10);
}

// El día se recorta al último del mes destino: 31/01 + 1 mes = 28/02, no
// 03/03 (que es lo que haría Date.UTC al desbordar).
export function sumarMeses(fecha: string, meses: number): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const ultimoDiaDestino = new Date(Date.UTC(y, m + meses, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + meses, Math.min(d, ultimoDiaDestino)))
    .toISOString()
    .slice(0, 10);
}

// YYYY-MM-DD de un día que existe: "2026-02-30" pasa el formato pero Date lo
// corre en silencio al 02/03, y el reporte mostraría otro período sin avisar.
const esFechaValida = (fecha: string) =>
  FORMATO_FECHA.test(fecha) && new Date(aUTC(fecha)).toISOString().startsWith(fecha);

const inicioDeMes = (fecha: string) => `${fecha.slice(0, 7)}-01`;

// Noches de [desde, hasta) que caen dentro del período.
export function nochesEnPeriodo(desde: string, hasta: string, periodo: Periodo): number {
  const inicio = desde > periodo.desde ? desde : periodo.desde;
  const fin = hasta < periodo.hasta ? hasta : periodo.hasta;
  return fin > inicio ? diasEntre(inicio, fin) : 0;
}

// El período anterior equivalente. Si el filtro son meses enteros (el caso
// normal: "septiembre") se compara contra los meses anteriores enteros, no
// contra los 30 días previos — si no, septiembre se compararía con un agosto
// al que le falta el día 1.
export function periodoAnterior({ desde, hasta }: Periodo): Periodo {
  if (desde.endsWith('-01') && hasta.endsWith('-01')) {
    const meses =
      (Number(hasta.slice(0, 4)) - Number(desde.slice(0, 4))) * 12 +
      Number(hasta.slice(5, 7)) -
      Number(desde.slice(5, 7));
    return { desde: sumarMeses(desde, -meses), hasta: desde };
  }
  return { desde: sumarDias(desde, -diasEntre(desde, hasta)), hasta: desde };
}

export interface TramoMes extends Periodo {
  mes: string; // YYYY-MM
}

// Parte el período en tramos de un mes calendario (el primero y el último
// pueden quedar recortados).
export function mesesDelPeriodo(periodo: Periodo): TramoMes[] {
  const tramos: TramoMes[] = [];
  for (let inicio = periodo.desde; inicio < periodo.hasta; ) {
    const proximoMes = sumarMeses(inicioDeMes(inicio), 1);
    const fin = proximoMes < periodo.hasta ? proximoMes : periodo.hasta;
    tramos.push({ mes: inicio.slice(0, 7), desde: inicio, hasta: fin });
    inicio = fin;
  }
  return tramos;
}

export function nombreMes(mes: string, formato: 'long' | 'short' = 'long'): string {
  const [y, m] = mes.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('es-AR', {
    month: formato,
    year: formato === 'long' ? 'numeric' : '2-digit',
    timeZone: 'UTC',
  });
}

// Día calendario de Puerto Iguazú de un timestamp (creado_en).
const fechaLocal = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

// ------------------------------------------------------------
// Filtro de la pantalla / query string. En la URL `hasta` es inclusiva (lo
// que la dueña elige en el calendario); acá adentro pasa a exclusiva.
// ------------------------------------------------------------
export interface FiltroReportes extends Periodo {
  rubro: TipoUnidad | null;
}

export function esRubro(valor: unknown): valor is TipoUnidad {
  return (TIPOS_REPORTE as readonly unknown[]).includes(valor);
}

// Por defecto, el mes en curso completo.
export function leerFiltro(params: URLSearchParams): FiltroReportes {
  const hoy = hoyISO();
  const desdeParam = params.get('desde') ?? '';
  const hastaParam = params.get('hasta') ?? '';
  const rubroParam = params.get('rubro');
  const rubro = esRubro(rubroParam) ? rubroParam : null;

  if (
    esFechaValida(desdeParam) &&
    esFechaValida(hastaParam) &&
    hastaParam >= desdeParam &&
    diasEntre(desdeParam, hastaParam) < DIAS_MAXIMOS_PERIODO
  ) {
    return { desde: desdeParam, hasta: diaSiguiente(hastaParam), rubro };
  }
  const desde = inicioDeMes(hoy);
  return { desde, hasta: sumarMeses(desde, 1), rubro };
}

// Inversa de leerFiltro, para armar links que conserven el filtro.
export function filtroAQuery(filtro: FiltroReportes): string {
  const q = new URLSearchParams({ desde: filtro.desde, hasta: sumarDias(filtro.hasta, -1) });
  if (filtro.rubro) q.set('rubro', filtro.rubro);
  return q.toString();
}

const tiposDelFiltro = (rubro: TipoUnidad | null): readonly TipoUnidad[] =>
  rubro ? [rubro] : TIPOS_ALOJAMIENTO;

// ------------------------------------------------------------
// Lecturas
// ------------------------------------------------------------
export interface ReservaReporte {
  tipo: TipoUnidad;
  unidadId: string;
  parcelaId: string | null;
  fechaIngreso: string;
  fechaSalida: string;
  montoTotal: number;
  estado: EstadoReserva;
  origen: 'WEB' | 'MANUAL';
  creadoEn: string;
}

export interface UnidadReporte {
  id: string;
  tipo: TipoUnidad;
  nombre: string;
  cupoTotal: number | null;
  parcelas: { id: string; nombre: string; numero: number; activa: boolean }[];
}

export interface BloqueoReporte {
  unidadId: string;
  parcelaId: string | null;
  plazas: number | null;
  fechaInicio: string;
  fechaFin: string;
}

// PostgREST corta cada respuesta en 1000 filas: un año de reservas del
// camping las supera. Se lee de a páginas, ordenado para que no se salteen
// ni repitan filas entre una página y la siguiente.
const PAGINA = 1000;

async function leerPaginado<T>(
  consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const filas: T[] = [];
  for (let i = 0; ; i += PAGINA) {
    const { data, error } = await consulta(i, i + PAGINA - 1);
    if (error) throw error;
    filas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return filas;
  }
}

// Todas las reservas (canceladas incluidas) que tocan alguna noche de
// [desde, hasta). Incluye también todas las que ingresan en el período: una
// reserva siempre ocupa su noche de ingreso.
async function leerReservas(periodo: Periodo): Promise<ReservaReporte[]> {
  const filas = await leerPaginado<any>((a, b) =>
    supabaseAdmin
      .from('reservas')
      .select(
        'unidad_id, parcela_id, fecha_ingreso, fecha_salida, monto_total, estado, origen, creado_en, unidades(tipo)'
      )
      .lt('fecha_ingreso', periodo.hasta)
      .gt('fecha_salida', periodo.desde)
      .order('id')
      .range(a, b)
  );
  return filas.map((r) => ({
    tipo: r.unidades?.tipo,
    unidadId: r.unidad_id,
    parcelaId: r.parcela_id ?? null,
    fechaIngreso: r.fecha_ingreso,
    fechaSalida: r.fecha_salida,
    montoTotal: Number(r.monto_total),
    estado: r.estado,
    origen: r.origen,
    creadoEn: r.creado_en,
  }));
}

async function leerUnidades(): Promise<UnidadReporte[]> {
  const { data, error } = await supabaseAdmin
    .from('unidades')
    .select('id, tipo, nombre, cupo_total, parcelas(id, nombre, numero, activa)');
  if (error) throw error;
  return (data ?? []).map((u: any) => ({
    id: u.id,
    tipo: u.tipo,
    nombre: u.nombre,
    cupoTotal: u.cupo_total,
    parcelas: u.parcelas ?? [],
  }));
}

async function leerBloqueos(periodo: Periodo): Promise<BloqueoReporte[]> {
  const { data, error } = await supabaseAdmin
    .from('bloqueos')
    .select('unidad_id, parcela_id, plazas, fecha_inicio, fecha_fin')
    .lt('fecha_inicio', periodo.hasta)
    .gt('fecha_fin', periodo.desde);
  if (error) {
    // Mismo criterio que listarBloqueos: sin la migración 009 no hay bloqueos.
    if (error.code === '42P01' || error.code === 'PGRST205') return [];
    throw error;
  }
  return (data ?? []).map((b: any) => ({
    unidadId: b.unidad_id,
    parcelaId: b.parcela_id,
    plazas: b.plazas,
    fechaInicio: b.fecha_inicio,
    fechaFin: b.fecha_fin,
  }));
}

// ------------------------------------------------------------
// Lectura compartida. Cada reporte pide lo suyo a un Lector; la pantalla usa
// uno solo para los 8 reportes y lo precarga con el rango que los cubre a
// todos, así Supabase se consulta una vez por tabla y no una por reporte.
// Un pedido que cae dentro de un rango ya leído (o en vuelo) se resuelve
// filtrando en memoria. Sin Lector explícito, cada reporte crea el suyo y
// lee solo lo que necesita (las rutas JSON de a un reporte).
// El Lector vive lo que dura una request: no es una caché entre requests.
// ------------------------------------------------------------
export interface Lector {
  reservas(periodo: Periodo): Promise<ReservaReporte[]>;
  unidades(): Promise<UnidadReporte[]>;
  bloqueos(periodo: Periodo): Promise<BloqueoReporte[]>;
  precargar(periodo: Periodo): void;
}

const contiene = (a: Periodo, b: Periodo) => a.desde <= b.desde && a.hasta >= b.hasta;

// Mismo criterio de solapamiento que las consultas: [inicio, fin) toca el período.
const tocaPeriodo = (inicio: string, fin: string, p: Periodo) => inicio < p.hasta && fin > p.desde;

function lecturaPorRango<T>(
  leer: (p: Periodo) => Promise<T[]>,
  rango: (fila: T) => [string, string]
): (p: Periodo) => Promise<T[]> {
  const leidas: { periodo: Periodo; filas: Promise<T[]> }[] = [];
  return (p) => {
    const previa = leidas.find((l) => contiene(l.periodo, p));
    if (previa)
      return previa.filas.then((filas) => filas.filter((f) => tocaPeriodo(...rango(f), p)));
    const filas = leer(p);
    leidas.push({ periodo: p, filas });
    return filas;
  };
}

export function crearLector(): Lector {
  let unidades: Promise<UnidadReporte[]> | null = null;
  const reservas = lecturaPorRango(leerReservas, (r) => [r.fechaIngreso, r.fechaSalida]);
  const bloqueos = lecturaPorRango(leerBloqueos, (b) => [b.fechaInicio, b.fechaFin]);
  const lector: Lector = {
    reservas,
    bloqueos,
    unidades: () => (unidades ??= leerUnidades()),
    // Dispara las lecturas sin esperarlas; los errores los ve el reporte que
    // las use (cada uno maneja el suyo).
    precargar(periodo) {
      for (const lectura of [lector.reservas(periodo), lector.bloqueos(periodo), lector.unidades()])
        lectura.catch(() => {});
    },
  };
  return lector;
}

// El rango que necesitan los 8 reportes de la pantalla juntos: el período, el
// anterior (KPIs), el histórico por mes y los últimos 12 meses (temporadas).
export function periodoDeLaPantalla(filtro: Periodo): Periodo {
  const rangos = [filtro, periodoAnterior(filtro), periodoHistorico(filtro), periodoTemporadas()];
  return {
    desde: rangos.map((r) => r.desde).reduce((a, b) => (a < b ? a : b)),
    hasta: rangos.map((r) => r.hasta).reduce((a, b) => (a > b ? a : b)),
  };
}

// ------------------------------------------------------------
// Reglas de cálculo (puras, sin Supabase — ver reportes.test.ts)
// ------------------------------------------------------------
const noCancelada = (r: ReservaReporte) => r.estado !== 'CANCELADA';

const ingresaEn = (r: ReservaReporte, periodo: Periodo) =>
  r.fechaIngreso >= periodo.desde && r.fechaIngreso < periodo.hasta;

// No existe un estado NO_SHOW: se infiere. Es no-show la reserva confirmada
// (con seña) cuya fecha de ingreso ya pasó y nunca hizo check-in. Un check-in
// que Staff se olvidó de marcar en el sistema cuenta como no-show.
// Si algún día se agrega el estado, se reemplazan estas dos funciones.
const ESTADOS_CONFIRMADOS: readonly EstadoReserva[] = [
  'CONFIRMADA',
  'CHECKIN_HECHO',
  'CHECKOUT_HECHO',
];

export function esNoShow(r: ReservaReporte, hoy: string): boolean {
  return r.estado === 'CONFIRMADA' && r.fechaIngreso < hoy;
}

// Base de la tasa: solo las reservas cuyo día de llegada ya pasó (las que
// todavía pueden llegar no se pueden juzgar).
export function cuentaParaNoShow(r: ReservaReporte, hoy: string): boolean {
  return ESTADOS_CONFIRMADOS.includes(r.estado) && r.fechaIngreso < hoy;
}

export const porcentaje = (parte: number, total: number): number | null =>
  total > 0 ? (parte / total) * 100 : null;

export const variacion = (actual: number, anterior: number): number | null =>
  anterior > 0 ? ((actual - anterior) / anterior) * 100 : null;

export function capacidadDiaria(u: UnidadReporte): number {
  if (u.tipo === 'CABANA' || u.tipo === 'SALON') return 1;
  if (u.tipo === 'CAMPING') return u.cupoTotal ?? 0;
  return u.parcelas.filter((p) => p.activa).length;
}

export interface Ocupacion {
  ocupadas: number; // lugar-noches (o lugar-días en quinchos/salón)
  disponibles: number;
  porcentaje: number | null;
}

// Ocupadas ÷ disponibles, sumando todas las unidades de los tipos pedidos.
// Los bloqueos de mantenimiento o uso propio restan de lo disponible; en el
// salón, en cambio, un bloqueo ES el evento (sql/010) y cuenta como ocupado.
export function calcularOcupacion(
  datos: { unidades: UnidadReporte[]; reservas: ReservaReporte[]; bloqueos: BloqueoReporte[] },
  periodo: Periodo,
  tipos: readonly TipoUnidad[]
): Ocupacion {
  const dias = diasEntre(periodo.desde, periodo.hasta);
  let ocupadas = 0;
  let disponibles = 0;

  for (const u of datos.unidades.filter((u) => tipos.includes(u.tipo))) {
    const capacidad = capacidadDiaria(u);
    const bruto = dias * capacidad;
    const bloqueado = datos.bloqueos
      .filter((b) => b.unidadId === u.id)
      .reduce(
        (acc, b) =>
          acc +
          nochesEnPeriodo(b.fechaInicio, b.fechaFin, periodo) *
            (b.parcelaId ? 1 : (b.plazas ?? capacidad)),
        0
      );

    if (u.tipo === 'SALON') {
      ocupadas += Math.min(bloqueado, bruto);
      disponibles += bruto;
      continue;
    }

    const libres = Math.max(bruto - bloqueado, 0);
    const reservadas = datos.reservas
      .filter((r) => r.unidadId === u.id && noCancelada(r))
      .reduce((acc, r) => acc + nochesEnPeriodo(r.fechaIngreso, r.fechaSalida, periodo), 0);
    ocupadas += Math.min(reservadas, libres);
    disponibles += libres;
  }

  return { ocupadas, disponibles, porcentaje: porcentaje(ocupadas, disponibles) };
}

// ------------------------------------------------------------
// 1. KPIs del período
// ------------------------------------------------------------
export interface Kpis {
  periodo: Periodo;
  periodoAnterior: Periodo;
  ingresos: number;
  ingresosAnterior: number;
  variacionIngresos: number | null; // %
  ocupacion: Ocupacion;
  ocupacionAnterior: Ocupacion;
  variacionOcupacion: number | null; // puntos porcentuales
  reservas: number;
  canceladas: number;
  tasaCancelacion: number | null;
  confirmadasVencidas: number;
  noShows: number;
  tasaNoShow: number | null;
}

export async function obtenerKpis(filtro: FiltroReportes, lector = crearLector()): Promise<Kpis> {
  const anterior = periodoAnterior(filtro);
  const tipos = tiposDelFiltro(filtro.rubro);
  const cubre: Periodo = { desde: anterior.desde, hasta: filtro.hasta };

  const [todas, unidades, bloqueos] = await Promise.all([
    lector.reservas(cubre),
    lector.unidades(),
    lector.bloqueos(cubre),
  ]);
  const reservas = todas.filter((r) => tipos.includes(r.tipo));
  const datos = { unidades, reservas, bloqueos };
  const hoy = hoyISO();

  const sumarIngresos = (p: Periodo) =>
    reservas
      .filter((r) => noCancelada(r) && ingresaEn(r, p))
      .reduce((acc, r) => acc + r.montoTotal, 0);

  const delPeriodo = reservas.filter((r) => ingresaEn(r, filtro));
  const canceladas = delPeriodo.filter((r) => !noCancelada(r)).length;
  const baseNoShow = delPeriodo.filter((r) => cuentaParaNoShow(r, hoy));
  const noShows = baseNoShow.filter((r) => esNoShow(r, hoy)).length;

  const ingresos = sumarIngresos(filtro);
  const ingresosAnterior = sumarIngresos(anterior);
  const ocupacion = calcularOcupacion(datos, filtro, tipos);
  const ocupacionAnterior = calcularOcupacion(datos, anterior, tipos);

  return {
    periodo: { desde: filtro.desde, hasta: filtro.hasta },
    periodoAnterior: anterior,
    ingresos,
    ingresosAnterior,
    variacionIngresos: variacion(ingresos, ingresosAnterior),
    ocupacion,
    ocupacionAnterior,
    variacionOcupacion:
      ocupacion.porcentaje !== null && ocupacionAnterior.porcentaje !== null
        ? ocupacion.porcentaje - ocupacionAnterior.porcentaje
        : null,
    reservas: delPeriodo.length,
    canceladas,
    tasaCancelacion: porcentaje(canceladas, delPeriodo.length),
    confirmadasVencidas: baseNoShow.length,
    noShows,
    tasaNoShow: porcentaje(noShows, baseNoShow.length),
  };
}

// ------------------------------------------------------------
// 2. Ingresos por rubro (ignora el filtro de rubro: es la comparación)
// ------------------------------------------------------------
export interface FilaIngresosRubro {
  tipo: TipoUnidad;
  nombre: string;
  reservas: number;
  ingresos: number;
}

export async function obtenerIngresosPorRubro(
  periodo: Periodo,
  lector = crearLector()
): Promise<FilaIngresosRubro[]> {
  const reservas = (await lector.reservas(periodo)).filter(
    (r) => noCancelada(r) && ingresaEn(r, periodo)
  );
  return TIPOS_PUBLICOS.map((tipo) => {
    const delRubro = reservas.filter((r) => r.tipo === tipo);
    return {
      tipo,
      nombre: NOMBRE_RUBRO[tipo],
      reservas: delRubro.length,
      ingresos: delRubro.reduce((acc, r) => acc + r.montoTotal, 0),
    };
  }).sort((a, b) => b.ingresos - a.ingresos);
}

// ------------------------------------------------------------
// 3. Ocupación histórica por mes
// ------------------------------------------------------------
export interface PuntoOcupacionMes extends Ocupacion {
  mes: string;
  etiqueta: string;
}

export const MESES_HISTORICO_POR_DEFECTO = 6;

// Si el período elegido abarca dos meses o más, se grafican esos meses; si es
// un solo mes (el caso por defecto), los 6 meses que terminan en ese.
export function periodoHistorico(filtro: Periodo): Periodo {
  const ultimoDia = sumarDias(filtro.hasta, -1);
  if (filtro.desde.slice(0, 7) !== ultimoDia.slice(0, 7)) return filtro;
  const fin = sumarMeses(inicioDeMes(ultimoDia), 1);
  return { desde: sumarMeses(fin, -MESES_HISTORICO_POR_DEFECTO), hasta: fin };
}

export async function obtenerOcupacionHistorica(
  filtro: FiltroReportes,
  lector = crearLector()
): Promise<PuntoOcupacionMes[]> {
  const periodo = periodoHistorico(filtro);
  const tipos = tiposDelFiltro(filtro.rubro);
  const [reservas, unidades, bloqueos] = await Promise.all([
    lector.reservas(periodo),
    lector.unidades(),
    lector.bloqueos(periodo),
  ]);
  return mesesDelPeriodo(periodo).map((tramo) => ({
    mes: tramo.mes,
    etiqueta: nombreMes(tramo.mes, 'short'),
    ...calcularOcupacion({ unidades, reservas, bloqueos }, tramo, tipos),
  }));
}

// ------------------------------------------------------------
// 4. Cancelaciones y no-show por rubro (ignora el filtro de rubro)
// ------------------------------------------------------------
export interface FilaCancelacionRubro {
  tipo: TipoUnidad;
  nombre: string;
  reservas: number;
  canceladas: number;
  tasaCancelacion: number | null;
  confirmadasVencidas: number;
  noShows: number;
  tasaNoShow: number | null;
}

export async function obtenerCancelacionesPorRubro(
  periodo: Periodo,
  lector = crearLector()
): Promise<FilaCancelacionRubro[]> {
  const hoy = hoyISO();
  const reservas = (await lector.reservas(periodo)).filter((r) => ingresaEn(r, periodo));
  return TIPOS_PUBLICOS.map((tipo) => {
    const delRubro = reservas.filter((r) => r.tipo === tipo);
    const canceladas = delRubro.filter((r) => !noCancelada(r)).length;
    const base = delRubro.filter((r) => cuentaParaNoShow(r, hoy));
    const noShows = base.filter((r) => esNoShow(r, hoy)).length;
    return {
      tipo,
      nombre: NOMBRE_RUBRO[tipo],
      reservas: delRubro.length,
      canceladas,
      tasaCancelacion: porcentaje(canceladas, delRubro.length),
      confirmadasVencidas: base.length,
      noShows,
      tasaNoShow: porcentaje(noShows, base.length),
    };
  });
}

// ------------------------------------------------------------
// 5. Origen de las reservas (sin canceladas)
// ------------------------------------------------------------
export interface FilaOrigen {
  origen: 'WEB' | 'MANUAL';
  nombre: string;
  reservas: number;
  porcentaje: number | null;
}

const NOMBRE_ORIGEN: Record<FilaOrigen['origen'], string> = {
  WEB: 'Web',
  MANUAL: 'Carga manual (Staff)',
};

export async function obtenerOrigen(
  filtro: FiltroReportes,
  lector = crearLector()
): Promise<FilaOrigen[]> {
  const tipos = tiposDelFiltro(filtro.rubro);
  const reservas = (await lector.reservas(filtro)).filter(
    (r) => noCancelada(r) && ingresaEn(r, filtro) && tipos.includes(r.tipo)
  );
  return (Object.keys(NOMBRE_ORIGEN) as FilaOrigen['origen'][])
    .map((origen) => {
      const cantidad = reservas.filter((r) => r.origen === origen).length;
      return {
        origen,
        nombre: NOMBRE_ORIGEN[origen],
        reservas: cantidad,
        porcentaje: porcentaje(cantidad, reservas.length),
      };
    })
    .sort((a, b) => b.reservas - a.reservas);
}

// ------------------------------------------------------------
// 6. Comparativa por temporada, últimos 12 meses
// Puerto Iguazú está en el hemisferio sur: el verano es dic–feb.
// ------------------------------------------------------------
export type Temporada = 'VERANO' | 'OTONO' | 'INVIERNO' | 'PRIMAVERA';

export const TEMPORADAS: { clave: Temporada; nombre: string; meses: string }[] = [
  { clave: 'VERANO', nombre: 'Verano', meses: 'dic – feb' },
  { clave: 'OTONO', nombre: 'Otoño', meses: 'mar – may' },
  { clave: 'INVIERNO', nombre: 'Invierno', meses: 'jun – ago' },
  { clave: 'PRIMAVERA', nombre: 'Primavera', meses: 'sep – nov' },
];

export function temporadaDe(fecha: string): Temporada {
  const mes = Number(fecha.slice(5, 7));
  if (mes === 12 || mes <= 2) return 'VERANO';
  if (mes <= 5) return 'OTONO';
  if (mes <= 8) return 'INVIERNO';
  return 'PRIMAVERA';
}

export interface FilaTemporada extends Ocupacion {
  temporada: Temporada;
  nombre: string;
  meses: string;
  actual: boolean;
}

// Los 12 meses que terminan con el mes en curso (completo).
export function periodoTemporadas(): Periodo {
  const hasta = sumarMeses(inicioDeMes(hoyISO()), 1);
  return { desde: sumarMeses(hasta, -12), hasta };
}

export async function obtenerTemporadas(
  rubro: TipoUnidad | null,
  lector = crearLector()
): Promise<FilaTemporada[]> {
  const hoy = hoyISO();
  const periodo = periodoTemporadas();
  const tipos = tiposDelFiltro(rubro);
  const [reservas, unidades, bloqueos] = await Promise.all([
    lector.reservas(periodo),
    lector.unidades(),
    lector.bloqueos(periodo),
  ]);
  const datos = { unidades, reservas, bloqueos };
  const porMes = mesesDelPeriodo(periodo).map((tramo) => ({
    temporada: temporadaDe(tramo.desde),
    ...calcularOcupacion(datos, tramo, tipos),
  }));
  const actual = temporadaDe(hoy);

  return TEMPORADAS.map(({ clave, nombre, meses }) => {
    const tramos = porMes.filter((m) => m.temporada === clave);
    const ocupadas = tramos.reduce((acc, m) => acc + m.ocupadas, 0);
    const disponibles = tramos.reduce((acc, m) => acc + m.disponibles, 0);
    return {
      temporada: clave,
      nombre,
      meses,
      actual: clave === actual,
      ocupadas,
      disponibles,
      porcentaje: porcentaje(ocupadas, disponibles),
    };
  });
}

// ------------------------------------------------------------
// 7. Anticipación promedio (días entre que se crea la reserva y el ingreso)
// ------------------------------------------------------------
export interface FilaAnticipacion {
  tipo: TipoUnidad;
  nombre: string;
  reservas: number;
  diasPromedio: number | null;
}

// Una reserva manual cargada después de que el cliente llegó daría
// anticipación negativa: cuenta como 0 (llegó sin reserva previa).
export function diasDeAnticipacion(r: Pick<ReservaReporte, 'fechaIngreso' | 'creadoEn'>): number {
  return Math.max(diasEntre(fechaLocal(r.creadoEn), r.fechaIngreso), 0);
}

export async function obtenerAnticipacion(
  periodo: Periodo,
  lector = crearLector()
): Promise<FilaAnticipacion[]> {
  const reservas = (await lector.reservas(periodo)).filter(
    (r) => noCancelada(r) && ingresaEn(r, periodo)
  );
  return TIPOS_PUBLICOS.map((tipo) => {
    const delRubro = reservas.filter((r) => r.tipo === tipo);
    const total = delRubro.reduce((acc, r) => acc + diasDeAnticipacion(r), 0);
    return {
      tipo,
      nombre: NOMBRE_RUBRO[tipo],
      reservas: delRubro.length,
      diasPromedio: delRubro.length > 0 ? total / delRubro.length : null,
    };
  });
}

// ------------------------------------------------------------
// 8. Unidades más utilizadas — a nivel de lugar: cada parcela de motorhome y
// cada quincho por separado; camping (cupo genérico), cabaña y salón como
// una fila cada uno.
// ------------------------------------------------------------
export interface FilaUnidadUso {
  clave: string;
  nombre: string;
  rubro: string;
  tipo: TipoUnidad;
  uso: number; // noches (o días en quinchos/salón) dentro del período
  unidadDeUso: string;
  reservas: number;
  ingresos: number;
}

export async function obtenerUnidadesMasUsadas(
  filtro: FiltroReportes,
  lector = crearLector()
): Promise<FilaUnidadUso[]> {
  const tipos = filtro.rubro ? [filtro.rubro] : TIPOS_REPORTE;
  const [todas, unidades, bloqueos] = await Promise.all([
    lector.reservas(filtro),
    lector.unidades(),
    lector.bloqueos(filtro),
  ]);
  const reservas = todas.filter(noCancelada);
  const filas = new Map<string, FilaUnidadUso>();

  const fila = (clave: string, nombre: string, u: UnidadReporte): FilaUnidadUso => {
    let f = filas.get(clave);
    if (!f) {
      f = {
        clave,
        nombre,
        rubro: NOMBRE_RUBRO[u.tipo],
        tipo: u.tipo,
        uso: 0,
        unidadDeUso: unidadDeUso(u.tipo),
        reservas: 0,
        ingresos: 0,
      };
      filas.set(clave, f);
    }
    return f;
  };

  for (const u of unidades.filter((u) => tipos.includes(u.tipo))) {
    const porParcela = u.tipo === 'MOTORHOME' || u.tipo === 'QUINCHOS';
    // Las parcelas activas aparecen aunque no se hayan usado: una parcela
    // con 0 noches también es un dato.
    if (porParcela) {
      [...u.parcelas]
        .filter((p) => p.activa)
        .sort((a, b) => a.numero - b.numero)
        .forEach((p) => fila(p.id, p.nombre, u));
    } else {
      fila(u.id, u.nombre, u);
    }

    if (u.tipo === 'SALON') {
      fila(u.id, u.nombre, u).uso += bloqueos
        .filter((b) => b.unidadId === u.id)
        .reduce((acc, b) => acc + nochesEnPeriodo(b.fechaInicio, b.fechaFin, filtro), 0);
      continue;
    }

    for (const r of reservas.filter((r) => r.unidadId === u.id)) {
      const parcela = porParcela ? u.parcelas.find((p) => p.id === r.parcelaId) : null;
      const f = porParcela
        ? parcela
          ? fila(parcela.id, parcela.nombre, u)
          : fila(`${u.id}-sin-parcela`, `${u.nombre} (sin lugar asignado)`, u)
        : fila(u.id, u.nombre, u);
      f.uso += nochesEnPeriodo(r.fechaIngreso, r.fechaSalida, filtro);
      if (ingresaEn(r, filtro)) {
        f.reservas += 1;
        f.ingresos += r.montoTotal;
      }
    }
  }

  return [...filas.values()].sort((a, b) => b.uso - a.uso || b.ingresos - a.ingresos);
}

// ------------------------------------------------------------
// Detalle del período para la descarga Excel: todas las reservas que
// ingresan en el período (canceladas incluidas, marcadas) y todos los pagos
// registrados en él.
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

export interface DetallePeriodo {
  cobrado: number; // suma de pagos registrados en el período (caja)
  reservas: FilaReservaReporte[];
  pagos: FilaPagoReporte[];
}

const ETIQUETA_ESTADO_PAGO: Record<EstadoPago, string> = {
  NO_PAGADO: 'No pagado',
  PARCIAL: 'Parcial',
  PAGADO: 'Pagado',
};

// Inicio del día `fecha` en Puerto Iguazú (UTC−3, sin horario de verano).
const inicioDiaLocal = (fecha: string) => `${fecha}T00:00:00-03:00`;

export async function obtenerDetallePeriodo(filtro: FiltroReportes): Promise<DetallePeriodo> {
  // Sin rubro no se filtra nada: el Excel tiene que cuadrar con la caja
  // aunque algún join viniera vacío.
  const delRubro = (tipo: unknown) => !filtro.rubro || tipo === filtro.rubro;
  const [pagosData, reservasData] = await Promise.all([
    leerPaginado<any>((a, b) =>
      supabaseAdmin
        .from('pagos')
        .select(
          'id, creado_en, monto, metodo, nota, registrado_por, reservas(nombre_cliente, unidades(tipo))'
        )
        .gte('creado_en', inicioDiaLocal(filtro.desde))
        .lt('creado_en', inicioDiaLocal(filtro.hasta))
        .order('creado_en', { ascending: true })
        .order('id')
        .range(a, b)
    ),
    leerPaginado<any>((a, b) =>
      supabaseAdmin
        .from('reservas')
        .select(
          'id, fecha_ingreso, fecha_salida, nombre_cliente, dni, telefono, email, monto_total, monto_pagado, estado, origen, creado_en, unidades(nombre, tipo), parcelas(nombre)'
        )
        .gte('fecha_ingreso', filtro.desde)
        .lt('fecha_ingreso', filtro.hasta)
        .order('fecha_ingreso', { ascending: true })
        .order('id')
        .range(a, b)
    ),
  ]);

  const pagos: FilaPagoReporte[] = pagosData
    .filter((p) => delRubro(p.reservas?.unidades?.tipo))
    .map((p) => ({
      fecha: p.creado_en,
      nombreCliente: p.reservas?.nombre_cliente ?? '',
      metodo: p.metodo,
      monto: Number(p.monto),
      registradoPor: p.registrado_por,
      nota: p.nota,
    }));

  const reservas: FilaReservaReporte[] = reservasData
    .filter((r) => delRubro(r.unidades?.tipo))
    .map((r) => {
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

  return { cobrado: pagos.reduce((acc, p) => acc + p.monto, 0), reservas, pagos };
}
