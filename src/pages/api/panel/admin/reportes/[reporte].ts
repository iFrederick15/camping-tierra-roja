// GET /api/panel/admin/reportes/<reporte>?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&rubro=TIPO
// — cada reporte del Panel Admin como JSON. `hasta` es inclusiva; sin fechas
// se usa el mes en curso. Solo-admin (gateado por middleware + exigirAdmin).
// Los cálculos viven en lib/reportes; la página /panel/admin/reportes llama
// a las mismas funciones directo desde el frontmatter.
import type { APIRoute } from 'astro';
import {
  leerFiltro,
  obtenerAnticipacion,
  obtenerCancelacionesPorRubro,
  obtenerIngresosPorRubro,
  obtenerKpis,
  obtenerOcupacionHistorica,
  obtenerOrigen,
  obtenerTemporadas,
  obtenerUnidadesMasUsadas,
  sumarDias,
  type FiltroReportes,
} from '../../../../../lib/reportes';
import { exigirAdmin } from '../../../../../lib/auth-guard';

const REPORTES: Record<
  string,
  (filtro: FiltroReportes, params: URLSearchParams) => Promise<unknown>
> = {
  // Siempre envueltas: pasarlas por referencia les mandaría `params` como
  // segundo argumento, que es el Lector opcional.
  kpis: (filtro) => obtenerKpis(filtro),
  'ingresos-por-rubro': (filtro) => obtenerIngresosPorRubro(filtro),
  'ocupacion-historica': (filtro) => obtenerOcupacionHistorica(filtro),
  'cancelaciones-por-rubro': (filtro) => obtenerCancelacionesPorRubro(filtro),
  origen: (filtro) => obtenerOrigen(filtro),
  temporadas: (filtro) => obtenerTemporadas(filtro.rubro),
  anticipacion: (filtro) => obtenerAnticipacion(filtro),
  // ?limite=N devuelve solo las N primeras; sin limite, todas.
  unidades: async (filtro, params) => {
    const filas = await obtenerUnidadesMasUsadas(filtro);
    const limite = Number(params.get('limite'));
    return Number.isInteger(limite) && limite > 0 ? filas.slice(0, limite) : filas;
  },
};

const json = (status: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const GET: APIRoute = async ({ params, url, locals }) => {
  const noAutorizado = exigirAdmin(locals);
  if (noAutorizado) return noAutorizado;

  const calcular = Object.hasOwn(REPORTES, params.reporte ?? '') ? REPORTES[params.reporte!] : null;
  if (!calcular) return json(404, { error: 'Reporte inexistente' });

  const filtro = leerFiltro(url.searchParams);
  // Se devuelve el filtro aplicado como se pide en la URL (hasta inclusiva).
  // Los Periodo que vengan dentro de `datos` usan hasta exclusiva.
  const filtroAplicado = { ...filtro, hasta: sumarDias(filtro.hasta, -1) };
  try {
    return json(200, { filtro: filtroAplicado, datos: await calcular(filtro, url.searchParams) });
  } catch (e) {
    console.error(`reportes/${params.reporte}:`, e);
    return json(500, { error: 'No se pudo calcular el reporte' });
  }
};
