import { useState, useEffect } from 'react';

type TipoUnidad = 'CAMPING' | 'MOTORHOME' | 'CABANA' | 'QUINCHOS';
type Paso = 'unidad' | 'fechas' | 'datos' | 'confirmado';

interface OpcionParcela {
  id: string;
  nombre: string;
  atributos: string[];
}

type Disponibilidad =
  | { tipo: 'cupo'; disponible: boolean; cuposLibres: number }
  | { tipo: 'unica'; disponible: boolean }
  | { tipo: 'lista'; opciones: OpcionParcela[] };

const UNIDADES: { tipo: TipoUnidad; label: string }[] = [
  { tipo: 'CAMPING', label: 'Camping' },
  { tipo: 'MOTORHOME', label: 'Motorhome' },
  { tipo: 'CABANA', label: 'Cabaña' },
  { tipo: 'QUINCHOS', label: 'Quincho' },
];

// TODO: reemplazar por fotos reales por tipo (hoy solo hay una imagen para
// camping y motorhome, y ninguna para cabaña/quincho — placeholders temporales).
const IMAGENES_UNIDAD: Record<TipoUnidad, string[]> = {
  CAMPING: ['/images/camping.jpg', '/images/camping.jpg', '/images/camping.jpg'],
  MOTORHOME: ['/images/motorhome.png', '/images/motorhome.png', '/images/motorhome.png'],
  CABANA: [],
  QUINCHOS: [],
};

function Carousel({ imagenes, alt }: { imagenes: string[]; alt: string }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    setIndice(0);
  }, [imagenes]);

  if (imagenes.length === 0) {
    return (
      <div className="w-full aspect-video rounded-card bg-superficie-elevada flex items-center justify-center text-texto-suave text-sm">
        Fotos próximamente
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-card overflow-hidden bg-superficie-elevada">
      <img src={imagenes[indice]} alt={alt} className="w-full h-full object-cover" />
      {imagenes.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={() => setIndice((i) => (i - 1 + imagenes.length) % imagenes.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Foto siguiente"
            onClick={() => setIndice((i) => (i + 1) % imagenes.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagenes.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la foto ${i + 1}`}
                onClick={() => setIndice(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === indice ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface Props {
  // 'staff': lo usa /panel/reservas/nueva (Staff). Misma UI, pero postea a
  // /api/panel/reservas/manual, no exige email/teléfono, y al confirmar
  // manda directo al Detalle de la reserva (para check-in/pago) en vez de
  // mostrar el paso "confirmado" genérico del Portal público.
  modo?: 'publico' | 'staff';
}

// Único componente React del sitio — todo lo demás sigue siendo Astro plano.
// Sin cuenta, sin login: 4 pasos, todo el estado vive acá.
export default function BookingWidget({ modo = 'publico' }: Props) {
  const [paso, setPaso] = useState<Paso>('unidad');
  const [unidad, setUnidad] = useState<TipoUnidad | null>(null);
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [fechaSalida, setFechaSalida] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [parcelaSeleccionada, setParcelaSeleccionada] = useState<string | null>(null);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

  const [datosCliente, setDatosCliente] = useState({
    nombreCliente: '',
    dni: '',
    email: '',
    telefono: '',
    cantidadAcompanantes: 1,
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consulta disponibilidad apenas hay unidad + ambas fechas — sin botón "buscar".
  useEffect(() => {
    if (!unidad || !fechaIngreso || !fechaSalida) return;
    let cancelado = false;
    setCargandoDisponibilidad(true);
    setParcelaSeleccionada(null);
    setDisponibilidad(null);
    setError(null);
    fetch(`/api/disponibilidad?unidad=${unidad}&desde=${fechaIngreso}&hasta=${fechaSalida}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? 'No pudimos consultar la disponibilidad');
        return data;
      })
      .then((data) => {
        if (!cancelado) setDisponibilidad(data);
      })
      .catch((e: Error) => {
        if (!cancelado)
          setError(e.message || 'No pudimos consultar la disponibilidad. Probá de nuevo.');
      })
      .finally(() => {
        if (!cancelado) setCargandoDisponibilidad(false);
      });
    // Evita que una respuesta vieja (p. ej. de fechas anteriores) pise el
    // resultado de la consulta más reciente si llega fuera de orden.
    return () => {
      cancelado = true;
    };
  }, [unidad, fechaIngreso, fechaSalida]);

  const puedeContinuarDesdeFechas =
    disponibilidad &&
    ((disponibilidad.tipo === 'cupo' && disponibilidad.disponible) ||
      (disponibilidad.tipo === 'unica' && disponibilidad.disponible) ||
      (disponibilidad.tipo === 'lista' && parcelaSeleccionada));

  const datosCompletos =
    datosCliente.nombreCliente.trim() !== '' &&
    datosCliente.dni.trim() !== '' &&
    (modo === 'staff' ||
      (datosCliente.email.trim() !== '' && datosCliente.telefono.trim() !== '')) &&
    datosCliente.cantidadAcompanantes >= 1;

  async function confirmarReserva() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(modo === 'staff' ? '/api/panel/reservas/manual' : '/api/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidadTipo: unidad,
          parcelaId: parcelaSeleccionada,
          fechaIngreso,
          fechaSalida,
          ...datosCliente,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'No pudimos confirmar la reserva');
      }
      if (modo === 'staff') {
        window.location.href = `/panel/reservas/${data.reservaId}`;
        return;
      }
      setPaso('confirmado');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const btnPrimario =
    'inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primario to-acento text-white px-8 py-4 rounded-pill font-titulo font-bold hover:shadow-hero hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none';
  const btnSecundario =
    'inline-flex items-center justify-center gap-2 border-2 border-borde text-texto-suave px-8 py-4 rounded-pill font-titulo font-bold hover:border-primario-claro transition-colors duration-300';
  const input =
    'w-full border-2 border-borde rounded-card px-5 py-3 font-cuerpo text-texto focus:border-primario focus:outline-none transition-colors';

  return (
    <div className="max-w-xl mx-auto bg-superficie rounded-card shadow-elevada p-8 lg:p-10">
      {paso === 'unidad' && (
        <section className="flex flex-col gap-6">
          <h2 className="font-titulo font-bold text-3xl text-negro">¿Qué quieres reservar?</h2>
          <div className="grid grid-cols-3 gap-3">
            {UNIDADES.map((u) => (
              <button
                key={u.tipo}
                onClick={() => setUnidad(u.tipo)}
                className={`rounded-card border-2 py-6 font-titulo font-bold transition-colors ${
                  unidad === u.tipo
                    ? 'border-primario bg-superficie-elevada text-primario'
                    : 'border-borde text-texto-suave hover:border-primario-claro'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>

          {unidad && (
            <Carousel
              imagenes={IMAGENES_UNIDAD[unidad]}
              alt={UNIDADES.find((u) => u.tipo === unidad)?.label ?? ''}
            />
          )}

          <button className={btnPrimario} disabled={!unidad} onClick={() => setPaso('fechas')}>
            Continuar
          </button>
        </section>
      )}

      {paso === 'fechas' && (
        <section className="flex flex-col gap-5">
          <h2 className="font-titulo font-bold text-3xl text-negro">Elegí tus fechas</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm font-titulo font-medium text-texto-suave">
              Entrada
              <input
                type="date"
                className={input}
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-titulo font-medium text-texto-suave">
              Salida
              <input
                type="date"
                className={input}
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
              />
            </label>
          </div>

          {cargandoDisponibilidad && (
            <p className="text-texto-suave text-sm">Consultando disponibilidad…</p>
          )}

          {error && <p className="text-primario text-sm font-medium">{error}</p>}

          {disponibilidad?.tipo === 'cupo' && (
            <p
              className={
                disponibilidad.disponible ? 'text-confirmado font-medium' : 'text-texto-suave'
              }
            >
              {disponibilidad.disponible
                ? 'Hay lugar para estas fechas'
                : 'Sin disponibilidad para estas fechas'}
            </p>
          )}
          {disponibilidad?.tipo === 'unica' && (
            <p
              className={
                disponibilidad.disponible ? 'text-confirmado font-medium' : 'text-texto-suave'
              }
            >
              {disponibilidad.disponible
                ? 'La cabaña está disponible'
                : 'La cabaña no está disponible en estas fechas'}
            </p>
          )}
          {disponibilidad?.tipo === 'lista' && (
            <div className="flex flex-col gap-2">
              {disponibilidad.opciones.length === 0 && (
                <p className="text-texto-suave text-sm">
                  Sin parcelas disponibles para estas fechas.
                </p>
              )}
              {disponibilidad.opciones.map((p: OpcionParcela) => (
                <button
                  key={p.id}
                  onClick={() => setParcelaSeleccionada(p.id)}
                  className={`text-left rounded-card border-2 px-5 py-3 transition-colors ${
                    parcelaSeleccionada === p.id
                      ? 'border-primario bg-superficie-elevada'
                      : 'border-borde hover:border-primario-claro'
                  }`}
                >
                  <div className="font-titulo font-bold text-negro">{p.nombre}</div>
                  {p.atributos.length > 0 && (
                    <div className="text-texto-suave text-sm">{p.atributos.join(' · ')}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button className={btnSecundario} onClick={() => setPaso('unidad')}>
              Volver
            </button>
            <button
              className={btnPrimario}
              disabled={!puedeContinuarDesdeFechas}
              onClick={() => setPaso('datos')}
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      {paso === 'datos' && (
        <section className="flex flex-col gap-4">
          <h2 className="font-titulo font-bold text-3xl text-negro">Tus datos</h2>
          <input
            className={input}
            placeholder="Nombre y apellido"
            value={datosCliente.nombreCliente}
            onChange={(e) => setDatosCliente({ ...datosCliente, nombreCliente: e.target.value })}
          />
          <input
            className={input}
            placeholder="DNI"
            value={datosCliente.dni}
            onChange={(e) => setDatosCliente({ ...datosCliente, dni: e.target.value })}
          />
          <input
            className={input}
            placeholder={modo === 'staff' ? 'Email (opcional)' : 'Email'}
            type="email"
            value={datosCliente.email}
            onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value })}
          />
          <input
            className={input}
            placeholder={modo === 'staff' ? 'Teléfono (opcional)' : 'Teléfono'}
            value={datosCliente.telefono}
            onChange={(e) => setDatosCliente({ ...datosCliente, telefono: e.target.value })}
          />
          <input
            className={input}
            type="number"
            min={1}
            placeholder="Cantidad de acompañantes"
            value={datosCliente.cantidadAcompanantes}
            onChange={(e) =>
              setDatosCliente({ ...datosCliente, cantidadAcompanantes: Number(e.target.value) })
            }
          />

          {error && <p className="text-primario text-sm font-medium">{error}</p>}

          <div className="flex gap-3">
            <button className={btnSecundario} disabled={enviando} onClick={() => setPaso('fechas')}>
              Volver
            </button>
            <button
              className={btnPrimario}
              disabled={!datosCompletos || enviando}
              onClick={confirmarReserva}
            >
              {enviando ? 'Confirmando…' : 'Confirmar reserva'}
            </button>
          </div>
        </section>
      )}

      {paso === 'confirmado' && (
        <section className="flex flex-col gap-3 text-center py-6">
          <h2 className="font-titulo font-bold text-3xl text-negro">¡Reserva confirmada!</h2>
          <p className="text-texto-suave">
            Te enviamos los detalles y los datos para transferir a tu email.
          </p>
        </section>
      )}
    </div>
  );
}
