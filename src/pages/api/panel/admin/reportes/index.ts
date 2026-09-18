// GET /api/panel/admin/reportes?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&rubro=TIPO
// — descarga el reporte del período como archivo Excel (.xlsx), con el mismo
// filtro que la pantalla. Solo-admin (gateado por middleware). Los cálculos
// viven en lib/reportes, compartidos con la página y con las rutas JSON de
// cada reporte (./[reporte].ts).
import type { APIRoute } from 'astro';
import {
  NOMBRE_RUBRO,
  crearLector,
  leerFiltro,
  periodoAnterior,
  obtenerDetallePeriodo,
  obtenerIngresosPorRubro,
  obtenerKpis,
  sumarDias,
} from '../../../../../lib/reportes';
import { construirXlsx, type Hoja } from '../../../../../lib/xlsx';
import { exigirAdmin } from '../../../../../lib/auth-guard';

const fmtFechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const fmtFecha = (f: string) => {
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
};

// Los porcentajes van redondeados a un decimal; vacío si no hay base.
const pct = (valor: number | null) => (valor === null ? '' : Math.round(valor * 10) / 10);

export const GET: APIRoute = async ({ url, locals }) => {
  const noAutorizado = exigirAdmin(locals);
  if (noAutorizado) return noAutorizado;

  const filtro = leerFiltro(url.searchParams);
  const ultimoDia = sumarDias(filtro.hasta, -1);

  // KPIs e ingresos por rubro comparten lectura: el rango de los KPIs
  // (período anterior + actual) ya contiene al de ingresos.
  const lector = crearLector();
  lector.precargar({ desde: periodoAnterior(filtro).desde, hasta: filtro.hasta });

  let kpis, porRubro, detalle;
  try {
    [kpis, porRubro, detalle] = await Promise.all([
      obtenerKpis(filtro, lector),
      obtenerIngresosPorRubro(filtro, lector),
      obtenerDetallePeriodo(filtro),
    ]);
  } catch (e) {
    console.error('reportes (Excel):', e);
    return new Response(JSON.stringify({ error: 'No se pudo generar el reporte' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resumen: Hoja = {
    nombre: 'Resumen',
    filas: [
      ['Reporte — Camping Tierra Roja'],
      ['Período', `${fmtFecha(filtro.desde)} al ${fmtFecha(ultimoDia)}`],
      ['Rubro', filtro.rubro ? NOMBRE_RUBRO[filtro.rubro] : 'Todo el alojamiento'],
      [],
      ['Ingresos (monto de reservas)', kpis.ingresos],
      ['Ingresos período anterior', kpis.ingresosAnterior],
      ['Variación ingresos (%)', pct(kpis.variacionIngresos)],
      ['Cobrado en el período (pagos registrados)', detalle.cobrado],
      ['Ocupación (%)', pct(kpis.ocupacion.porcentaje)],
      ['Ocupación período anterior (%)', pct(kpis.ocupacionAnterior.porcentaje)],
      ['Reservas', kpis.reservas],
      ['Canceladas', kpis.canceladas],
      ['Tasa de cancelación (%)', pct(kpis.tasaCancelacion)],
      ['No-show', kpis.noShows],
      ['Tasa de no-show (%)', pct(kpis.tasaNoShow)],
      [],
      ['Rubro', 'Reservas', 'Ingresos'],
      ...porRubro.map((r) => [r.nombre, r.reservas, r.ingresos]),
    ],
  };

  const reservas: Hoja = {
    nombre: 'Reservas',
    filas: [
      [
        'Ingreso',
        'Salida',
        'Noches',
        'Huésped',
        'DNI',
        'Teléfono',
        'Email',
        'Unidad',
        'Parcela',
        'Estado',
        'Origen',
        'Monto total',
        'Monto pagado',
        'Estado de pago',
        'Creada',
      ],
      ...detalle.reservas.map((r) => [
        fmtFecha(r.fechaIngreso),
        fmtFecha(r.fechaSalida),
        r.noches,
        r.nombreCliente,
        r.dni,
        r.telefono ?? '',
        r.email ?? '',
        r.unidadNombre,
        r.parcelaNombre ?? '',
        r.estado,
        r.origen,
        r.montoTotal,
        r.montoPagado,
        r.estadoPago,
        fmtFechaHora(r.creadaEn),
      ]),
    ],
  };

  const pagos: Hoja = {
    nombre: 'Pagos',
    filas: [
      ['Fecha', 'Huésped', 'Método', 'Monto', 'Registrado por', 'Nota'],
      ...detalle.pagos.map((p) => [
        fmtFechaHora(p.fecha),
        p.nombreCliente,
        p.metodo,
        p.monto,
        p.registradoPor ?? '',
        p.nota ?? '',
      ]),
    ],
  };

  const xlsx = construirXlsx([resumen, reservas, pagos]);
  const sufijoRubro = filtro.rubro ? `-${filtro.rubro.toLowerCase()}` : '';
  const nombreArchivo = `reporte-tierra-roja-${filtro.desde}-al-${ultimoDia}${sufijoRubro}.xlsx`;

  return new Response(new Uint8Array(xlsx), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Cache-Control': 'no-store',
    },
  });
};
