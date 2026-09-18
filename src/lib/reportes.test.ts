// Reglas de cálculo de los reportes del Panel Admin (funciones puras) y que
// el Lector comparta las lecturas. Los datos reales se prueban a mano contra
// la base.
import { describe, it, expect, vi } from 'vitest';

// Fake mínimo que solo cuenta cuántas consultas llegan a cada tabla y
// devuelve filas vacías — alcanza para probar que el Lector comparte.
const consultas = vi.hoisted(() => ({}) as Record<string, number>);

vi.mock('./supabase', () => {
  const builder = (tabla: string) => {
    consultas[tabla] = (consultas[tabla] ?? 0) + 1;
    const api: any = {
      select: () => api,
      lt: () => api,
      gt: () => api,
      order: () => api,
      range: () => api,
      then: (resolver: any) => resolver({ data: [], error: null }),
    };
    return api;
  };
  return { supabase: {}, supabaseAdmin: { from: builder } };
});

const reportes = await import('./reportes');
const {
  calcularOcupacion,
  cuentaParaNoShow,
  diasDeAnticipacion,
  esNoShow,
  leerFiltro,
  mesesDelPeriodo,
  nochesEnPeriodo,
  periodoAnterior,
  periodoHistorico,
  sumarMeses,
  temporadaDe,
} = reportes;

type Reserva = Parameters<typeof esNoShow>[0];

const reserva = (extra: Partial<Reserva>): Reserva => ({
  tipo: 'CAMPING',
  unidadId: 'camping',
  parcelaId: null,
  fechaIngreso: '2026-09-10',
  fechaSalida: '2026-09-12',
  montoTotal: 1000,
  estado: 'CONFIRMADA',
  origen: 'WEB',
  creadoEn: '2026-09-01T15:00:00Z',
  ...extra,
});

describe('periodoAnterior', () => {
  it('compara un mes entero contra el mes anterior entero', () => {
    expect(periodoAnterior({ desde: '2026-09-01', hasta: '2026-10-01' })).toEqual({
      desde: '2026-08-01',
      hasta: '2026-09-01',
    });
  });

  it('compara varios meses contra la misma cantidad de meses previos', () => {
    expect(periodoAnterior({ desde: '2026-01-01', hasta: '2026-04-01' })).toEqual({
      desde: '2025-10-01',
      hasta: '2026-01-01',
    });
  });

  it('un rango suelto se compara con los mismos días inmediatamente antes', () => {
    expect(periodoAnterior({ desde: '2026-09-10', hasta: '2026-09-17' })).toEqual({
      desde: '2026-09-03',
      hasta: '2026-09-10',
    });
  });
});

describe('nochesEnPeriodo y mesesDelPeriodo', () => {
  it('reparte una estadía que cruza de mes', () => {
    const [sep, oct] = mesesDelPeriodo({ desde: '2026-09-01', hasta: '2026-11-01' });
    expect(nochesEnPeriodo('2026-09-30', '2026-10-03', sep)).toBe(1);
    expect(nochesEnPeriodo('2026-09-30', '2026-10-03', oct)).toBe(2);
  });

  it('recorta el primer y último tramo', () => {
    expect(mesesDelPeriodo({ desde: '2026-09-15', hasta: '2026-10-10' })).toEqual([
      { mes: '2026-09', desde: '2026-09-15', hasta: '2026-10-01' },
      { mes: '2026-10', desde: '2026-10-01', hasta: '2026-10-10' },
    ]);
  });
});

describe('leerFiltro', () => {
  it('pasa hasta a exclusiva', () => {
    const f = leerFiltro(new URLSearchParams('desde=2026-09-01&hasta=2026-09-30&rubro=CABANA'));
    expect(f).toEqual({ desde: '2026-09-01', hasta: '2026-10-01', rubro: 'CABANA' });
  });

  it('ignora un rubro inventado y un rango invertido', () => {
    const f = leerFiltro(new URLSearchParams('desde=2026-09-30&hasta=2026-09-01&rubro=HOTEL'));
    expect(f.rubro).toBeNull();
    expect(f.desde.endsWith('-01')).toBe(true);
  });

  it('rechaza un día que no existe en vez de correrlo', () => {
    const f = leerFiltro(new URLSearchParams('desde=2026-02-01&hasta=2026-02-30'));
    expect(f.hasta).not.toBe('2026-03-03');
    expect(f.desde).not.toBe('2026-02-01');
  });
});

describe('sumarMeses', () => {
  it('recorta al último día del mes destino', () => {
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(sumarMeses('2026-03-31', -1)).toBe('2026-02-28');
    expect(sumarMeses('2026-09-01', -12)).toBe('2025-09-01');
  });
});

describe('periodoHistorico', () => {
  it('un solo mes se amplía a los 6 meses que terminan en él', () => {
    expect(periodoHistorico({ desde: '2026-09-01', hasta: '2026-10-01' })).toEqual({
      desde: '2026-04-01',
      hasta: '2026-10-01',
    });
  });

  it('un rango de varios meses se respeta', () => {
    const p = { desde: '2026-01-01', hasta: '2026-04-01' };
    expect(periodoHistorico(p)).toEqual(p);
  });
});

describe('calcularOcupacion', () => {
  const sep = { desde: '2026-09-01', hasta: '2026-09-11' }; // 10 noches
  const camping = {
    id: 'camping',
    tipo: 'CAMPING' as const,
    nombre: 'Camping',
    cupoTotal: 10,
    parcelas: [],
  };
  const salon = {
    id: 'salon',
    tipo: 'SALON' as const,
    nombre: 'Salón',
    cupoTotal: null,
    parcelas: [],
  };

  it('cuenta noches reservadas sobre el cupo, sin canceladas', () => {
    const o = calcularOcupacion(
      {
        unidades: [camping],
        reservas: [
          reserva({ fechaIngreso: '2026-09-01', fechaSalida: '2026-09-06' }), // 5
          reserva({ fechaIngreso: '2026-09-09', fechaSalida: '2026-09-15' }), // 2 dentro
          reserva({ estado: 'CANCELADA', fechaIngreso: '2026-09-01', fechaSalida: '2026-09-11' }),
        ],
        bloqueos: [],
      },
      sep,
      ['CAMPING']
    );
    expect(o).toMatchObject({ ocupadas: 7, disponibles: 100 });
    expect(o.porcentaje).toBeCloseTo(7);
  });

  it('un bloqueo de mantenimiento resta de lo disponible', () => {
    const o = calcularOcupacion(
      {
        unidades: [camping],
        reservas: [],
        bloqueos: [
          {
            unidadId: 'camping',
            parcelaId: null,
            plazas: 5,
            fechaInicio: '2026-09-01',
            fechaFin: '2026-09-03',
          },
        ],
      },
      sep,
      ['CAMPING']
    );
    expect(o.disponibles).toBe(90);
  });

  it('en el salón el bloqueo es el evento: cuenta como ocupado', () => {
    const o = calcularOcupacion(
      {
        unidades: [salon],
        reservas: [],
        bloqueos: [
          {
            unidadId: 'salon',
            parcelaId: null,
            plazas: null,
            fechaInicio: '2026-09-05',
            fechaFin: '2026-09-07',
          },
        ],
      },
      sep,
      ['SALON']
    );
    expect(o).toEqual({ ocupadas: 2, disponibles: 10, porcentaje: 20 });
  });

  it('sin capacidad devuelve porcentaje null, no 0', () => {
    const o = calcularOcupacion({ unidades: [], reservas: [], bloqueos: [] }, sep, ['CAMPING']);
    expect(o.porcentaje).toBeNull();
  });
});

describe('no-show inferido', () => {
  const hoy = '2026-09-18';

  it('confirmada con fecha pasada y sin check-in es no-show', () => {
    const r = reserva({ fechaIngreso: '2026-09-10' });
    expect(esNoShow(r, hoy)).toBe(true);
    expect(cuentaParaNoShow(r, hoy)).toBe(true);
  });

  it('la que llega hoy todavía no se juzga', () => {
    const r = reserva({ fechaIngreso: hoy });
    expect(esNoShow(r, hoy)).toBe(false);
    expect(cuentaParaNoShow(r, hoy)).toBe(false);
  });

  it('check-in hecho cuenta en la base pero no es no-show; sin seña no cuenta', () => {
    expect(esNoShow(reserva({ estado: 'CHECKIN_HECHO' }), hoy)).toBe(false);
    expect(cuentaParaNoShow(reserva({ estado: 'CHECKIN_HECHO' }), hoy)).toBe(true);
    expect(cuentaParaNoShow(reserva({ estado: 'REALIZADA' }), hoy)).toBe(false);
  });
});

describe('temporadaDe (hemisferio sur)', () => {
  it.each([
    ['2026-12-15', 'VERANO'],
    ['2026-02-28', 'VERANO'],
    ['2026-03-01', 'OTONO'],
    ['2026-07-20', 'INVIERNO'],
    ['2026-09-18', 'PRIMAVERA'],
  ])('%s → %s', (fecha, temporada) => {
    expect(temporadaDe(fecha)).toBe(temporada);
  });
});

describe('diasDeAnticipacion', () => {
  it('usa el día de Puerto Iguazú de creado_en', () => {
    // 01:00 UTC del 10/09 es todavía el 09/09 en Argentina.
    expect(
      diasDeAnticipacion({ creadoEn: '2026-09-10T01:00:00Z', fechaIngreso: '2026-09-12' })
    ).toBe(3);
  });

  it('una carga posterior a la llegada cuenta como 0', () => {
    expect(
      diasDeAnticipacion({ creadoEn: '2026-09-15T15:00:00Z', fechaIngreso: '2026-09-12' })
    ).toBe(0);
  });
});

describe('Lector compartido', () => {
  it('los 8 reportes de la pantalla leen cada tabla una sola vez', async () => {
    for (const tabla of Object.keys(consultas)) delete consultas[tabla];
    const filtro = reportes.leerFiltro(new URLSearchParams('desde=2026-09-01&hasta=2026-09-30'));
    const lector = reportes.crearLector();
    lector.precargar(reportes.periodoDeLaPantalla(filtro));

    await Promise.all([
      reportes.obtenerKpis(filtro, lector),
      reportes.obtenerIngresosPorRubro(filtro, lector),
      reportes.obtenerOcupacionHistorica(filtro, lector),
      reportes.obtenerCancelacionesPorRubro(filtro, lector),
      reportes.obtenerOrigen(filtro, lector),
      reportes.obtenerTemporadas(null, lector),
      reportes.obtenerAnticipacion(filtro, lector),
      reportes.obtenerUnidadesMasUsadas(filtro, lector),
    ]);

    expect(consultas).toEqual({ reservas: 1, unidades: 1, bloqueos: 1 });
  });

  it('un rango contenido en otro ya leído se filtra en memoria', async () => {
    for (const tabla of Object.keys(consultas)) delete consultas[tabla];
    const lector = reportes.crearLector();
    await lector.reservas({ desde: '2026-01-01', hasta: '2027-01-01' });
    await lector.reservas({ desde: '2026-09-01', hasta: '2026-10-01' });
    await lector.reservas({ desde: '2025-12-01', hasta: '2026-02-01' }); // se sale: consulta nueva
    expect(consultas.reservas).toBe(2);
  });
});
