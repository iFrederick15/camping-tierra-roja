import { useState, useEffect, useRef } from 'react';

type TipoUnidad = 'CAMPING' | 'MOTORHOME' | 'CABANA' | 'QUINCHOS';
type TipoCargo = 'BASE' | 'CANTIDAD' | 'ADICIONAL';

interface OpcionParcela {
  id: string;
  nombre: string;
  atributos: string[];
}

interface OpcionPrecio {
  clave: string;
  etiqueta: string;
  tipoCargo: TipoCargo;
  precioPorNoche: number;
}

interface ItemPrecio {
  clave: string;
  etiqueta: string;
  cantidad: number;
  subtotal: number;
}

type Disponibilidad =
  | { tipo: 'cupo'; disponible: boolean; cuposLibres: number }
  | { tipo: 'unica'; disponible: boolean }
  | { tipo: 'lista'; opciones: OpcionParcela[] };

interface Props {
  id: string;
  unidadTipo: TipoUnidad;
  categoriaSeleccionada: string | null;
  fechaIngreso: string;
  fechaSalida: string;
  parcelaId: string | null;
  cantidadAcompanantes: number;
  cantidadMenores: number;
  cantidadMayores: number;
  nombreCliente: string;
  dni: string;
  email: string | null;
  telefono: string | null;
  datosVehiculo: string | null;
}

const UNIDADES: { tipo: TipoUnidad; label: string }[] = [
  { tipo: 'CAMPING', label: 'Camping' },
  { tipo: 'MOTORHOME', label: 'Motorhome' },
  { tipo: 'CABANA', label: 'Cabaña' },
  { tipo: 'QUINCHOS', label: 'Quincho' },
];

const CAPACIDAD_MAXIMA_CABANA = 8;

function fmtMoneda(n: number): string {
  return `$${n.toLocaleString('es-AR')}`;
}

function calcularNoches(desde: string, hasta: string): number {
  const a = new Date(desde);
  const b = new Date(hasta);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function diaSiguiente(fechaISO: string): string {
  const [y, m, d] = fechaISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

// Espejo de calcularPrecio() en src/lib/reservas.ts, igual que calcularDetalle
// en BookingWidget.tsx — solo para mostrar el total en vivo. El servidor
// recalcula todo al guardar.
function calcularDetalle(
  opciones: OpcionPrecio[],
  seleccion: { categoria: string | null; acompanantes: number; menores: number; mayores: number },
  noches: number
): ItemPrecio[] {
  const detalle: ItemPrecio[] = [];
  for (const op of opciones) {
    let cantidad = 0;
    if (op.tipoCargo === 'BASE') {
      cantidad = seleccion.categoria === op.clave ? 1 : 0;
    } else if (op.tipoCargo === 'CANTIDAD') {
      if (op.clave === 'ACOMPANANTE') cantidad = seleccion.acompanantes;
      else if (op.clave === 'MENOR') cantidad = seleccion.menores;
      else if (op.clave === 'MAYOR') cantidad = seleccion.mayores;
    }
    if (cantidad <= 0) continue;
    detalle.push({
      clave: op.clave,
      etiqueta: op.etiqueta,
      cantidad,
      subtotal: cantidad * op.precioPorNoche * noches,
    });
  }
  return detalle;
}

const inputCls =
  'border-2 border-borde rounded-card px-4 py-2.5 focus:border-primario focus:outline-none bg-superficie';
const labelCls = 'flex flex-col gap-1 text-sm text-texto-suave';

export default function EditarReserva(props: Props) {
  const [abierto, setAbierto] = useState(false);

  const [unidad, setUnidad] = useState<TipoUnidad>(props.unidadTipo);
  const [categoria, setCategoria] = useState<string | null>(props.categoriaSeleccionada);
  const [fechaIngreso, setFechaIngreso] = useState(props.fechaIngreso);
  const [fechaSalida, setFechaSalida] = useState(props.fechaSalida);
  const [acompanantes, setAcompanantes] = useState(props.cantidadAcompanantes);
  const [menores, setMenores] = useState(props.cantidadMenores);
  const [mayores, setMayores] = useState(props.cantidadMayores);
  const [parcela, setParcela] = useState<string | null>(props.parcelaId);

  const [nombreCliente, setNombreCliente] = useState(props.nombreCliente);
  const [dni, setDni] = useState(props.dni);
  const [email, setEmail] = useState(props.email ?? '');
  const [telefono, setTelefono] = useState(props.telefono ?? '');
  const [datosVehiculo, setDatosVehiculo] = useState(props.datosVehiculo ?? '');

  const [opcionesPrecio, setOpcionesPrecio] = useState<OpcionPrecio[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [cargandoDisp, setCargandoDisp] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QUINCHOS: un solo día — fechaSalida siempre es el día siguiente.
  useEffect(() => {
    if (unidad === 'QUINCHOS' && fechaIngreso) setFechaSalida(diaSiguiente(fechaIngreso));
  }, [unidad, fechaIngreso]);

  // Ítems de precio de la unidad elegida. Al cambiar de unidad se resetea la
  // categoría salvo que siga siendo válida.
  const primeraCarga = useRef(true);
  useEffect(() => {
    let cancelado = false;
    fetch(`/api/precios?unidad=${unidad}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelado) return;
        const opciones: OpcionPrecio[] = data.opciones ?? [];
        setOpcionesPrecio(opciones);
        const bases = opciones.filter((o) => o.tipoCargo === 'BASE');
        if (unidad === 'CABANA') {
          setCategoria(bases[0]?.clave ?? null);
        } else if (bases.length === 0) {
          setCategoria(null);
        } else if (primeraCarga.current) {
          // Mantener la categoría original de la reserva en el primer render.
        } else if (!bases.some((b) => b.clave === categoria)) {
          setCategoria(null);
        }
        primeraCarga.current = false;
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidad]);

  // Disponibilidad para las fechas elegidas, excluyendo esta misma reserva.
  useEffect(() => {
    if (!fechaIngreso || !fechaSalida) return;
    if (unidad === 'QUINCHOS' && !categoria) return;
    let cancelado = false;
    setCargandoDisp(true);
    setDisponibilidad(null);
    setError(null);
    const params = new URLSearchParams({
      unidad,
      desde: fechaIngreso,
      hasta: fechaSalida,
      excluir: props.id,
    });
    if (unidad === 'QUINCHOS' && categoria) params.set('categoria', categoria);
    fetch(`/api/disponibilidad?${params}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? 'No se pudo consultar la disponibilidad');
        return data;
      })
      .then((data) => {
        if (cancelado) return;
        setDisponibilidad(data.disponibilidad);
        if (data.disponibilidad?.tipo === 'lista') {
          const sigueDisponible = data.disponibilidad.opciones.some(
            (o: OpcionParcela) => o.id === parcela
          );
          if (!sigueDisponible) setParcela(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelado) setError(e.message);
      })
      .finally(() => {
        if (!cancelado) setCargandoDisp(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidad, fechaIngreso, fechaSalida, categoria]);

  const bases = opcionesPrecio.filter((o) => o.tipoCargo === 'BASE');
  const noches = fechaIngreso && fechaSalida ? calcularNoches(fechaIngreso, fechaSalida) : 0;
  const detalle = noches
    ? calcularDetalle(opcionesPrecio, { categoria, acompanantes, menores, mayores }, noches)
    : [];
  const total = detalle.reduce((acc, d) => acc + d.subtotal, 0);

  const dispOk =
    disponibilidad != null &&
    ((disponibilidad.tipo === 'cupo' && disponibilidad.disponible) ||
      (disponibilidad.tipo === 'unica' && disponibilidad.disponible) ||
      (disponibilidad.tipo === 'lista' && !!parcela));

  const excedeCabana = unidad === 'CABANA' && menores + mayores > CAPACIDAD_MAXIMA_CABANA;

  const puedeGuardar =
    !enviando &&
    nombreCliente.trim() !== '' &&
    dni.trim() !== '' &&
    !!fechaIngreso &&
    !!fechaSalida &&
    fechaSalida > fechaIngreso &&
    dispOk &&
    !excedeCabana &&
    ((unidad !== 'MOTORHOME' && unidad !== 'QUINCHOS') || !!categoria);

  async function guardar() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/panel/reservas/${props.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidadTipo: unidad,
          parcelaId: parcela,
          fechaIngreso,
          fechaSalida,
          categoria,
          cantidadAcompanantes: acompanantes,
          cantidadMenores: menores,
          cantidadMayores: mayores,
          nombreCliente,
          dni,
          email,
          telefono,
          datosVehiculo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo guardar la reserva');
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-2 border-2 border-primario rounded-pill px-5 py-2.5 font-titulo font-bold text-primario hover:bg-primario-claro hover:text-fondo transition-colors"
      >
        Editar reserva
      </button>
    );
  }

  return (
    <div className="bg-superficie rounded-card border-2 border-borde p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-titulo font-bold text-negro">Editar reserva</h2>
        <button
          onClick={() => setAbierto(false)}
          className="text-texto-suave text-sm hover:text-primario"
        >
          Cerrar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className={labelCls}>
          Unidad
          <select
            className={inputCls}
            value={unidad}
            onChange={(e) => setUnidad(e.target.value as TipoUnidad)}
          >
            {UNIDADES.map((u) => (
              <option key={u.tipo} value={u.tipo}>
                {u.label}
              </option>
            ))}
          </select>
        </label>

        {bases.length > 0 && unidad !== 'CABANA' && (
          <label className={labelCls}>
            Categoría
            <select
              className={inputCls}
              value={categoria ?? ''}
              onChange={(e) => setCategoria(e.target.value || null)}
            >
              <option value="">Elegir…</option>
              {bases.map((b) => (
                <option key={b.clave} value={b.clave}>
                  {b.etiqueta}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className={labelCls}>
          {unidad === 'QUINCHOS' ? 'Fecha' : 'Ingreso'}
          <input
            type="date"
            className={inputCls}
            value={fechaIngreso}
            onChange={(e) => {
              const v = e.target.value;
              setFechaIngreso(v);
              if (unidad !== 'QUINCHOS' && fechaSalida && fechaSalida <= v) setFechaSalida('');
            }}
          />
        </label>

        {unidad !== 'QUINCHOS' && (
          <label className={labelCls}>
            Salida
            <input
              type="date"
              className={inputCls}
              value={fechaSalida}
              min={fechaIngreso ? diaSiguiente(fechaIngreso) : undefined}
              onChange={(e) => setFechaSalida(e.target.value)}
            />
          </label>
        )}

        {unidad === 'MOTORHOME' && (
          <label className={labelCls}>
            Acompañantes
            <input
              type="number"
              min="0"
              className={inputCls}
              value={acompanantes}
              onChange={(e) => setAcompanantes(Math.max(0, Number(e.target.value)))}
            />
          </label>
        )}

        {(unidad === 'CAMPING' || unidad === 'CABANA') && (
          <>
            <label className={labelCls}>
              Mayores
              <input
                type="number"
                min="0"
                className={inputCls}
                value={mayores}
                onChange={(e) => setMayores(Math.max(0, Number(e.target.value)))}
              />
            </label>
            <label className={labelCls}>
              Menores
              <input
                type="number"
                min="0"
                className={inputCls}
                value={menores}
                onChange={(e) => setMenores(Math.max(0, Number(e.target.value)))}
              />
            </label>
          </>
        )}
      </div>

      {cargandoDisp && <p className="text-texto-suave text-sm">Consultando disponibilidad…</p>}

      {disponibilidad?.tipo === 'cupo' && (
        <p
          className={`text-sm font-medium ${disponibilidad.disponible ? 'text-confirmado' : 'text-primario'}`}
        >
          {disponibilidad.disponible
            ? `Hay lugar para estas fechas (${disponibilidad.cuposLibres} libre/s)`
            : 'Sin disponibilidad para estas fechas'}
        </p>
      )}
      {disponibilidad?.tipo === 'unica' && (
        <p
          className={`text-sm font-medium ${disponibilidad.disponible ? 'text-confirmado' : 'text-primario'}`}
        >
          {disponibilidad.disponible
            ? 'Disponible para estas fechas'
            : 'No disponible en estas fechas'}
        </p>
      )}
      {disponibilidad?.tipo === 'lista' && (
        <div className="flex flex-col gap-2">
          {disponibilidad.opciones.length === 0 && (
            <p className="text-primario text-sm">Sin quinchos disponibles para esa fecha.</p>
          )}
          {disponibilidad.opciones.map((o) => (
            <label
              key={o.id}
              className={`flex items-center gap-2 rounded-card border-2 px-4 py-2.5 cursor-pointer ${
                parcela === o.id ? 'border-primario' : 'border-borde'
              }`}
            >
              <input
                type="radio"
                name="parcela"
                checked={parcela === o.id}
                onChange={() => setParcela(o.id)}
              />
              <span className="text-sm text-texto">
                {o.nombre}
                {o.atributos.length > 0 ? ` · ${o.atributos.join(' · ')}` : ''}
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-borde">
        <label className={labelCls}>
          Nombre del cliente
          <input
            className={inputCls}
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
          />
        </label>
        <label className={labelCls}>
          DNI o Pasaporte
          <input className={inputCls} value={dni} onChange={(e) => setDni(e.target.value)} />
        </label>
        <label className={labelCls}>
          Email
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={labelCls}>
          Teléfono
          <input
            className={inputCls}
            type="tel"
            inputMode="numeric"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        <label className={`${labelCls} sm:col-span-2`}>
          Vehículo
          <input
            className={inputCls}
            placeholder="Patente / modelo"
            value={datosVehiculo}
            onChange={(e) => setDatosVehiculo(e.target.value)}
          />
        </label>
      </div>

      {detalle.length > 0 && (
        <div className="bg-fondo-alt rounded-card p-4 flex flex-col gap-1 text-sm">
          {detalle.map((d) => (
            <div key={d.clave} className="flex justify-between">
              <span className="text-texto-suave">
                {d.etiqueta}
                {d.cantidad > 1 ? ` × ${d.cantidad}` : ''}
              </span>
              <span className="font-medium text-negro">{fmtMoneda(d.subtotal)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 mt-1 border-t border-borde">
            <span className="font-titulo font-bold text-negro">Nuevo total</span>
            <span className="font-titulo font-black text-lg text-primario">{fmtMoneda(total)}</span>
          </div>
        </div>
      )}

      {excedeCabana && (
        <p className="text-primario text-sm font-medium">
          La cabaña tiene capacidad máxima para {CAPACIDAD_MAXIMA_CABANA} personas.
        </p>
      )}
      {error && <p className="text-primario text-sm font-medium">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={guardar}
          disabled={!puedeGuardar}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primario to-acento text-white px-6 py-2.5 rounded-pill font-titulo font-bold hover:shadow-hero transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          onClick={() => setAbierto(false)}
          disabled={enviando}
          className="inline-flex items-center gap-2 border-2 border-borde rounded-pill px-6 py-2.5 font-titulo font-bold text-texto-suave hover:border-primario-claro transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
