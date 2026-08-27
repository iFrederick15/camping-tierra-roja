// GET /api/panel/admin/reportes?mes=YYYY-MM — descarga el reporte del mes
// como archivo Excel (.xlsx). Solo-admin (gateado por middleware). El cálculo
// vive en lib/reservas (obtenerReporteMensual), compartido con la página.
import type { APIRoute } from 'astro';
import { obtenerReporteMensual } from '../../../../lib/reservas';
import { construirXlsx, type Hoja } from '../../../../lib/xlsx';
import { exigirAdmin } from '../../../../lib/auth-guard';

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

export const GET: APIRoute = async ({ url, locals }) => {
  const noAutorizado = exigirAdmin(locals);
  if (noAutorizado) return noAutorizado;

  const reporte = await obtenerReporteMensual(url.searchParams.get('mes'));

  const resumen: Hoja = {
    nombre: 'Resumen',
    filas: [
      ['Reporte mensual — Camping Tierra Roja'],
      ['Mes', reporte.nombreMes],
      [],
      ['Facturado del mes', reporte.facturadoDelMes],
      ['Noches ocupadas', reporte.nochesOcupadas],
      ['Reservas totales', reporte.reservasTotales],
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
      ...reporte.reservas.map((r) => [
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
      ...reporte.pagos.map((p) => [
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
  const nombreArchivo = `reporte-tierra-roja-${reporte.mes}.xlsx`;

  return new Response(new Uint8Array(xlsx), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Cache-Control': 'no-store',
    },
  });
};
