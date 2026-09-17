// Los bloqueos son lo que la dueña usa para "deshabilitar" fechas: si el
// cálculo se equivoca, o le vende a un cliente una parcela que está en
// mantenimiento, o le deja cerrado el camping un fin de semana lleno. Estos
// tests cubren las dos direcciones —que el bloqueo reste lugar y que no reste
// de más— sin pegarle a Supabase.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// El fake no filtra por fecha (eso lo hace Postgres): cada caso pasa
// directamente las filas que ya solapan el rango consultado, que es lo que la
// consulta real devolvería.
const datos: {
  unidad: any;
  parcelas: any[];
  reservas: any[];
  bloqueos: any[];
  insertados: any[];
} = { unidad: {}, parcelas: [], reservas: [], bloqueos: [], insertados: [] };

function builder(tabla: string) {
  const filtros: Record<string, unknown> = {};
  let insertado: any = null;

  const filasDe = () =>
    tabla === 'reservas' ? datos.reservas : tabla === 'bloqueos' ? datos.bloqueos : datos.parcelas;

  const api: any = {
    select: () => api,
    eq: (columna: string, valor: unknown) => {
      filtros[columna] = valor;
      return api;
    },
    in: () => api,
    lt: () => api,
    gt: () => api,
    neq: () => api,
    order: () => api,
    insert: (fila: any) => {
      insertado = { id: `bloqueo-${datos.insertados.length + 1}`, ...fila };
      datos.insertados.push(insertado);
      return api;
    },
    delete: () => api,
    single: async () => {
      if (insertado) return { data: insertado, error: null };
      if (tabla === 'unidades') return { data: datos.unidad, error: null };
      return { data: filasDe()[0] ?? null, error: null };
    },
    maybeSingle: async () => ({
      data: filasDe().find((f: any) => f.id === filtros.id) ?? null,
      error: null,
    }),
    // Las consultas que no terminan en single() se esperan directo.
    then: (resolver: any) => resolver({ data: filasDe(), error: null }),
  };
  return api;
}

vi.mock('./supabase', () => ({
  supabase: {},
  supabaseAdmin: { from: (tabla: string) => builder(tabla) },
}));

const { obtenerDisponibilidad, crearBloqueo } = await import('./reservas');

const DESDE = '2026-10-10';
const HASTA = '2026-10-13';

const reserva = (fechaIngreso: string, fechaSalida: string, parcelaId: string | null = null) => ({
  parcela_id: parcelaId,
  fecha_ingreso: fechaIngreso,
  fecha_salida: fechaSalida,
});

const bloqueo = (
  fechaInicio: string,
  fechaFin: string,
  extra: { parcela_id?: string | null; plazas?: number | null } = {}
) => ({
  id: `b-${fechaInicio}`,
  unidad_id: 'u1',
  parcela_id: extra.parcela_id ?? null,
  plazas: extra.plazas ?? null,
  fecha_inicio: fechaInicio,
  fecha_fin: fechaFin,
  nota: null,
  creado_por: null,
});

beforeEach(() => {
  datos.unidad = {};
  datos.parcelas = [];
  datos.reservas = [];
  datos.bloqueos = [];
  datos.insertados = [];
});

describe('obtenerDisponibilidad con bloqueos', () => {
  it('descuenta del cupo del camping los lugares bloqueados', async () => {
    datos.unidad = { id: 'u1', tipo: 'CAMPING', nombre: 'Camping', cupo_total: 40, parcelas: [] };
    datos.reservas = [reserva(DESDE, HASTA), reserva(DESDE, HASTA)];
    datos.bloqueos = [bloqueo(DESDE, HASTA, { plazas: 3 })];

    const r = (await obtenerDisponibilidad('CAMPING', DESDE, HASTA)) as any;
    expect(r.disponibilidad).toEqual({ tipo: 'cupo', disponible: true, cuposLibres: 35 });
  });

  it('cierra el camping entero cuando el bloqueo no lleva plazas', async () => {
    datos.unidad = { id: 'u1', tipo: 'CAMPING', nombre: 'Camping', cupo_total: 40, parcelas: [] };
    datos.bloqueos = [bloqueo(DESDE, HASTA)];

    const r = (await obtenerDisponibilidad('CAMPING', DESDE, HASTA)) as any;
    expect(r.disponibilidad).toEqual({ tipo: 'cupo', disponible: false, cuposLibres: 0 });
  });

  it('no suma bloqueos de días distintos: el cupo se mide por día', async () => {
    // Dos bloqueos de 20 lugares que no comparten ningún día no dejan el
    // camping en cero; sumarlos de a rango diría "sin lugar" un fin de semana
    // que en realidad está casi vacío.
    datos.unidad = { id: 'u1', tipo: 'CAMPING', nombre: 'Camping', cupo_total: 40, parcelas: [] };
    datos.bloqueos = [
      bloqueo('2026-10-10', '2026-10-11', { plazas: 20 }),
      bloqueo('2026-10-12', '2026-10-13', { plazas: 20 }),
    ];

    const r = (await obtenerDisponibilidad('CAMPING', DESDE, HASTA)) as any;
    expect(r.disponibilidad).toEqual({ tipo: 'cupo', disponible: true, cuposLibres: 20 });
  });

  it('saca del stock la parcela de motorhome bloqueada', async () => {
    datos.unidad = {
      id: 'u1',
      tipo: 'MOTORHOME',
      nombre: 'Motorhome',
      cupo_total: null,
      parcelas: [
        { id: 'p1', nombre: 'Parcela 1', atributos: [], activa: true },
        { id: 'p2', nombre: 'Parcela 2', atributos: [], activa: true },
      ],
    };
    datos.bloqueos = [bloqueo(DESDE, HASTA, { parcela_id: 'p1' })];

    const r = (await obtenerDisponibilidad('MOTORHOME', DESDE, HASTA)) as any;
    expect(r.disponibilidad).toEqual({ tipo: 'cupo', disponible: true, cuposLibres: 1 });
  });

  it('deja la cabaña no disponible si está bloqueada', async () => {
    datos.unidad = { id: 'u1', tipo: 'CABANA', nombre: 'Cabaña', cupo_total: null, parcelas: [] };
    datos.bloqueos = [bloqueo(DESDE, HASTA)];

    const r = (await obtenerDisponibilidad('CABANA', DESDE, HASTA)) as any;
    expect(r.disponibilidad).toEqual({ tipo: 'unica', disponible: false });
  });

  it('esconde de la lista el quincho bloqueado', async () => {
    datos.unidad = {
      id: 'u1',
      tipo: 'QUINCHOS',
      nombre: 'Quincho',
      cupo_total: null,
      parcelas: [
        {
          id: 'q1',
          nombre: 'Quincho 1',
          atributos: [],
          activa: true,
          opciones_precio: { clave: 'CHICO' },
        },
        {
          id: 'q2',
          nombre: 'Quincho 2',
          atributos: [],
          activa: true,
          opciones_precio: { clave: 'CHICO' },
        },
      ],
    };
    datos.bloqueos = [bloqueo(DESDE, HASTA, { parcela_id: 'q2' })];

    const r = (await obtenerDisponibilidad('QUINCHOS', DESDE, HASTA, 'CHICO')) as any;
    expect(r.disponibilidad.opciones.map((o: any) => o.id)).toEqual(['q1']);
  });
});

describe('crearBloqueo', () => {
  it('no bloquea un lugar que ya tiene una reserva', async () => {
    datos.unidad = { id: 'u1', tipo: 'MOTORHOME', nombre: 'Motorhome', cupo_total: null };
    datos.parcelas = [{ id: 'p1', unidad_id: 'u1' }];
    datos.reservas = [reserva(DESDE, HASTA, 'p1')];

    const r = (await crearBloqueo({
      unidadTipo: 'MOTORHOME',
      parcelaId: 'p1',
      fechaInicio: DESDE,
      fechaFin: HASTA,
    })) as any;
    expect(r.error).toMatch(/ya tiene una reserva/i);
    expect(datos.insertados).toHaveLength(0);
  });

  it('no deja cerrar toda la unidad si hay reservas tomadas', async () => {
    datos.unidad = { id: 'u1', tipo: 'CAMPING', nombre: 'Camping', cupo_total: 40 };
    datos.reservas = [reserva(DESDE, HASTA)];

    const r = (await crearBloqueo({
      unidadTipo: 'CAMPING',
      todaLaUnidad: true,
      fechaInicio: DESDE,
      fechaFin: HASTA,
    })) as any;
    expect(r.error).toMatch(/reserva/i);
    expect(datos.insertados).toHaveLength(0);
  });

  it('rechaza el bloqueo del camping solo si ese día no queda ningún lugar', async () => {
    datos.unidad = { id: 'u1', tipo: 'CAMPING', nombre: 'Camping', cupo_total: 2 };
    datos.reservas = [reserva('2026-10-10', '2026-10-11'), reserva('2026-10-10', '2026-10-11')];

    const lleno = (await crearBloqueo({
      unidadTipo: 'CAMPING',
      fechaInicio: '2026-10-10',
      fechaFin: '2026-10-11',
    })) as any;
    expect(lleno.error).toMatch(/10\/10/);

    const libre = (await crearBloqueo({
      unidadTipo: 'CAMPING',
      fechaInicio: '2026-10-11',
      fechaFin: '2026-10-12',
    })) as any;
    expect(libre.bloqueo.plazas).toBe(1);
    expect(libre.bloqueo.parcelaId).toBeNull();
  });

  it('guarda la cabaña siempre como unidad entera y recorta la nota', async () => {
    datos.unidad = { id: 'u1', tipo: 'CABANA', nombre: 'Cabaña', cupo_total: null };

    const r = (await crearBloqueo({
      unidadTipo: 'CABANA',
      fechaInicio: DESDE,
      fechaFin: HASTA,
      nota: '   Uso propio   ',
      creadoPor: 'Ana',
    })) as any;
    expect(r.bloqueo.plazas).toBeNull();
    expect(r.bloqueo.parcelaId).toBeNull();
    expect(r.bloqueo.nota).toBe('Uso propio');
    expect(r.bloqueo.creadoPor).toBe('Ana');
  });

  it('rechaza un rango al revés antes de tocar la base', async () => {
    const r = (await crearBloqueo({
      unidadTipo: 'CAMPING',
      fechaInicio: HASTA,
      fechaFin: DESDE,
    })) as any;
    expect(r.status).toBe(400);
    expect(datos.insertados).toHaveLength(0);
  });
});
