import { useState, useEffect, useRef, useCallback } from 'react';
import { useDniScanner } from '../hooks/useDniScanner';

type TipoUnidad = 'CAMPING' | 'MOTORHOME' | 'CABANA' | 'QUINCHOS';
type Paso = 'unidad' | 'fechas' | 'datos' | 'confirmado';
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
  precioUnitario: number;
  subtotal: number;
}

type Disponibilidad =
  | { tipo: 'cupo'; disponible: boolean; cuposLibres: number }
  | { tipo: 'unica'; disponible: boolean }
  | { tipo: 'lista'; opciones: OpcionParcela[] };

const UNIDADES: { tipo: TipoUnidad; label: string; descripcion: string; icono: string }[] = [
  {
    tipo: 'CAMPING',
    label: 'Camping',
    descripcion: 'Arma tu carpa bajo el dosel de la selva.',
    icono: 'forest',
  },
  {
    tipo: 'MOTORHOME',
    label: 'Motorhome',
    descripcion: 'Parcela con luz y agua para tu rodante.',
    icono: 'airport_shuttle',
  },
  {
    tipo: 'CABANA',
    label: 'Cabaña',
    descripcion: 'Comodidad techada en plena naturaleza.',
    icono: 'cottage',
  },
  {
    tipo: 'QUINCHOS',
    label: 'Quincho',
    descripcion: 'Espacio con parrilla para tu grupo.',
    icono: 'outdoor_grill',
  },
];

const CAPACIDAD_MAXIMA_CABANA = 8;

function formatoMoneda(monto: number): string {
  return monto.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
}

function calcularNochesLocal(desde: string, hasta: string): number {
  const ingreso = new Date(desde);
  const salida = new Date(hasta);
  return Math.max(1, Math.round((salida.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24)));
}

// Fecha de "hoy" en huso horario de Puerto Iguazú, para no dejar elegir
// fechas pasadas en el portal público. Duplica hoyISO() de
// src/lib/reservas.ts porque ese módulo importa supabaseAdmin y no puede
// bundlearse en el cliente.
function hoyISOLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
}

function diaSiguiente(fechaISO: string): string {
  const [y, m, d] = fechaISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

// Espejo de calcularPrecio() en src/lib/reservas.ts — el servidor recalcula
// todo al confirmar, esto es solo para mostrar el total en vivo sin pedirlo
// de nuevo por red.
function calcularDetalle(
  opciones: OpcionPrecio[],
  seleccion: {
    categoria: string | null;
    acompanantes: number;
    menores: number;
    mayores: number;
  },
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
    } else if (op.tipoCargo === 'ADICIONAL') {
      // PERSONAS_BASE (MOTORHOME): las 2 primeras personas se cobran aparte
      // de la parcela, siempre que haya una categoría (parcela) elegida.
      if (op.clave === 'PERSONAS_BASE') cantidad = seleccion.categoria ? 1 : 0;
    }
    if (cantidad <= 0) continue;
    detalle.push({
      clave: op.clave,
      etiqueta: op.etiqueta,
      cantidad,
      precioUnitario: op.precioPorNoche,
      subtotal: cantidad * op.precioPorNoche * noches,
    });
  }
  return detalle;
}

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

function Stepper({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (valor: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm font-titulo font-medium text-texto-suave">
      <span>{label}</span>
      {sublabel && (
        <span className="text-xs text-texto-suave/70 font-normal font-cuerpo">{sublabel}</span>
      )}
      <div className="flex items-center justify-between gap-3 bg-superficie border-2 border-transparent rounded-card px-2 py-1.5">
        <button
          type="button"
          aria-label={`Restar ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-fondo-alt text-negro hover:bg-primario hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
        <span className="font-cuerpo font-bold text-negro text-lg tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Sumar ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-fondo-alt text-negro hover:bg-primario hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </div>
    </div>
  );
}

interface Props {
  // 'staff': lo usa /panel/reservas/nueva (Staff). Misma UI, pero postea a
  // /api/panel/reservas/manual, no exige email/teléfono, y al confirmar
  // manda directo al Detalle de la reserva (para check-in/pago) en vez de
  // mostrar el paso "confirmado" genérico del Portal público.
  modo?: 'publico' | 'staff';
  // Precarga desde el Calendario de ocupación (clic/arrastre en una celda
  // vacía) — ver /panel/reservas/nueva.astro. categoriaInicial/parcelaInicial
  // solo aplican a QUINCHOS: es el único tipo donde Staff elige la parcela
  // exacta (MOTORHOME siempre se asigna automático en el backend).
  unidadInicial?: TipoUnidad;
  fechaIngresoInicial?: string;
  fechaSalidaInicial?: string;
  categoriaInicial?: string;
  parcelaInicial?: string;
}

// Único componente React del sitio — todo lo demás sigue siendo Astro plano.
// Sin cuenta, sin login: 4 pasos, todo el estado vive acá.
export default function BookingWidget({
  modo = 'publico',
  unidadInicial,
  fechaIngresoInicial,
  fechaSalidaInicial,
  categoriaInicial,
  parcelaInicial,
}: Props) {
  const [paso, setPaso] = useState<Paso>('unidad');
  const [unidad, setUnidad] = useState<TipoUnidad | null>(unidadInicial ?? null);

  // El widget no cambia de ruta al avanzar de paso (todo vive en este mismo
  // componente), así que el navegador no resetea el scroll solo. Sin esto,
  // en mobile el usuario queda viendo el footer de la página y tiene que
  // scrollear para encontrar el paso siguiente.
  const contenedorRef = useRef<HTMLDivElement>(null);
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    contenedorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [paso]);

  // Al elegir la unidad, baja automáticamente hasta las fotos y las
  // opciones (acompañantes/categoría/etc.) para que el cliente no tenga
  // que scrollear manualmente para verlas.
  const detalleUnidadRef = useRef<HTMLDivElement>(null);
  const primerRenderUnidad = useRef(true);
  useEffect(() => {
    if (primerRenderUnidad.current) {
      primerRenderUnidad.current = false;
      return;
    }
    if (!unidad) return;
    detalleUnidadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [unidad]);

  // Ítems de precio de la unidad elegida (ver sql/003_precios_itemizados.sql)
  // y la selección del cliente sobre esos ítems. Se piden apenas se elige la
  // unidad — antes de fechas, porque QUINCHOS necesita la categoría para
  // poder consultar disponibilidad (cada categoría tiene sus propias parcelas).
  const [opcionesPrecio, setOpcionesPrecio] = useState<OpcionPrecio[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [acompanantes, setAcompanantes] = useState(0); // MOTORHOME
  const [menores, setMenores] = useState(0); // CAMPING (cobra) / CABANA (informativo)
  const [mayores, setMayores] = useState(0); // CAMPING (cobra) / CABANA (informativo, "adultos")

  const [fechaIngreso, setFechaIngreso] = useState(fechaIngresoInicial ?? '');
  const [fechaSalida, setFechaSalida] = useState(
    unidadInicial === 'QUINCHOS' && fechaIngresoInicial
      ? diaSiguiente(fechaIngresoInicial)
      : (fechaSalidaInicial ?? '')
  );
  // QUINCHOS se reserva por un solo día: el cliente elige una única fecha y
  // fechaSalida se deriva automáticamente (día siguiente) para reusar el
  // mismo modelo de rango [ingreso, salida) que el resto de las unidades.
  useEffect(() => {
    if (unidad === 'QUINCHOS' && fechaIngreso) {
      setFechaSalida(diaSiguiente(fechaIngreso));
    }
  }, [unidad, fechaIngreso]);
  // Aplicar la precarga de categoría/parcela una sola vez (al llegar los
  // datos async correspondientes), no cada vez que cambia `unidad` —
  // de lo contrario pisaría una elección posterior de Staff.
  const categoriaInicialAplicada = useRef(false);
  const parcelaInicialAplicada = useRef(false);
  // Safari muestra la fecha de hoy en gris como "hint" nativo de un
  // <input type="date"> vacío (no es un valor real, pero parece precargado).
  // Tapamos ese hint con nuestro propio placeholder hasta que el campo
  // reciba foco al menos una vez.
  const [tocadoIngreso, setTocadoIngreso] = useState(false);
  const [tocadoSalida, setTocadoSalida] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [parcelaSeleccionada, setParcelaSeleccionada] = useState<string | null>(null);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

  const [datosCliente, setDatosCliente] = useState({
    nombreCliente: '',
    dni: '',
    email: '',
    telefono: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feedback del escaneo de DNI por pistola lectora (ver useDniScanner más
  // abajo). 'ok' es un highlight verde breve; 'baja-confianza' se queda
  // visible hasta que el recepcionista edite el campo, porque pide
  // verificar contra el documento físico antes de guardar.
  const [scanEstado, setScanEstado] = useState<'idle' | 'ok' | 'baja-confianza' | 'error'>('idle');
  const scanHighlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const manejarScanDni = useCallback(
    (resultado: { nombre: string; apellido: string; dni: string; confianza: 'alta' | 'baja' }) => {
      setDatosCliente((prev) => ({
        ...prev,
        nombreCliente: `${resultado.nombre} ${resultado.apellido}`.trim(),
        dni: resultado.dni,
      }));
      setScanEstado(resultado.confianza === 'alta' ? 'ok' : 'baja-confianza');
      if (scanHighlightTimeout.current) clearTimeout(scanHighlightTimeout.current);
      if (resultado.confianza === 'alta') {
        scanHighlightTimeout.current = setTimeout(() => {
          setScanEstado((actual) => (actual === 'ok' ? 'idle' : actual));
        }, 2500);
      }
    },
    []
  );

  const manejarErrorScanDni = useCallback(() => {
    setScanEstado('error');
    if (scanHighlightTimeout.current) clearTimeout(scanHighlightTimeout.current);
    scanHighlightTimeout.current = setTimeout(() => {
      setScanEstado((actual) => (actual === 'error' ? 'idle' : actual));
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (scanHighlightTimeout.current) clearTimeout(scanHighlightTimeout.current);
    };
  }, []);

  // Solo escucha en el panel de Staff y mientras el formulario de datos del
  // cliente está visible — no debe interferir con otras pantallas/pasos.
  useDniScanner({
    activo: modo === 'staff' && paso === 'datos',
    onScan: manejarScanDni,
    onError: manejarErrorScanDni,
  });

  // Apenas se elige la unidad, pide sus ítems de precio y reinicia la
  // selección anterior (categoría/acompañantes/menores/mayores).
  useEffect(() => {
    setCategoria(null);
    setAcompanantes(0);
    setMenores(0);
    setMayores(0);
    setOpcionesPrecio([]);
    if (!unidad) return;
    let cancelado = false;
    fetch(`/api/precios?unidad=${unidad}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelado) return;
        const opciones: OpcionPrecio[] = data.opciones ?? [];
        setOpcionesPrecio(opciones);
        if (!categoriaInicialAplicada.current && categoriaInicial && unidad === unidadInicial) {
          categoriaInicialAplicada.current = true;
          setCategoria(categoriaInicial);
        } else if (unidad === 'CABANA') {
          // CABANA tiene un único ítem BASE ("Fijo") sin elección real: se
          // preselecciona para que el precio se muestre sin pedirle nada al cliente.
          const fijo = opciones.find((o) => o.clave === 'FIJO');
          if (fijo) setCategoria(fijo.clave);
        }
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [unidad]);

  // Consulta disponibilidad apenas hay unidad + ambas fechas (y, para
  // QUINCHOS, categoría) — sin botón "buscar".
  useEffect(() => {
    if (!unidad || !fechaIngreso || !fechaSalida) return;
    if (unidad === 'QUINCHOS' && !categoria) return;
    let cancelado = false;
    setCargandoDisponibilidad(true);
    setParcelaSeleccionada(null);
    setDisponibilidad(null);
    setError(null);
    const params = new URLSearchParams({ unidad, desde: fechaIngreso, hasta: fechaSalida });
    if (unidad === 'QUINCHOS' && categoria) params.set('categoria', categoria);
    fetch(`/api/disponibilidad?${params}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? 'No pudimos consultar la disponibilidad');
        return data;
      })
      .then((data) => {
        if (cancelado) return;
        setDisponibilidad(data.disponibilidad);
        if (
          !parcelaInicialAplicada.current &&
          parcelaInicial &&
          data.disponibilidad?.tipo === 'lista' &&
          data.disponibilidad.opciones.some((o: OpcionParcela) => o.id === parcelaInicial)
        ) {
          parcelaInicialAplicada.current = true;
          setParcelaSeleccionada(parcelaInicial);
        }
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
  }, [unidad, fechaIngreso, fechaSalida, categoria]);

  const puedeContinuarDesdeUnidad =
    !!unidad &&
    (unidad !== 'MOTORHOME' || !!categoria) &&
    (unidad !== 'QUINCHOS' || !!categoria) &&
    (unidad !== 'CAMPING' || menores + mayores > 0);

  // Staff puede cargar reservas manuales con fechas pasadas (ej. registrar
  // una estadía ya ocurrida); el portal público no.
  const minEntrada = modo === 'publico' ? hoyISOLocal() : undefined;
  const minSalida = fechaIngreso ? diaSiguiente(fechaIngreso) : minEntrada;

  const puedeContinuarDesdeFechas =
    disponibilidad &&
    ((disponibilidad.tipo === 'cupo' && disponibilidad.disponible) ||
      (disponibilidad.tipo === 'unica' && disponibilidad.disponible) ||
      (disponibilidad.tipo === 'lista' && parcelaSeleccionada));

  const datosCompletos =
    datosCliente.nombreCliente.trim() !== '' &&
    datosCliente.dni.trim() !== '' &&
    (modo === 'staff' || (datosCliente.email.trim() !== '' && datosCliente.telefono.trim() !== ''));

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
          categoria,
          cantidadAcompanantes: acompanantes,
          cantidadMenores: menores,
          cantidadMayores: mayores,
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
    'inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primario to-acento text-white px-8 py-4 rounded-pill font-titulo font-bold hover:shadow-hero hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:hover:scale-100';
  const btnSecundario =
    'inline-flex items-center justify-center gap-2 border-2 border-borde text-texto-suave px-8 py-4 rounded-pill font-titulo font-bold hover:border-primario-claro transition-colors duration-300';
  const input =
    'w-full bg-fondo-alt border-2 border-transparent rounded-card px-5 py-3 font-cuerpo text-texto placeholder:text-texto-suave/60 focus:bg-superficie focus:border-primario focus:outline-none transition-colors';
  const opcionBase = (activa: boolean) =>
    `text-left rounded-card p-4 border-2 transition-colors ${
      activa
        ? 'border-primario bg-superficie'
        : 'border-transparent bg-superficie/60 hover:bg-superficie'
    }`;

  const noches =
    fechaIngreso && fechaSalida ? calcularNochesLocal(fechaIngreso, fechaSalida) : null;
  const detalle = noches
    ? calcularDetalle(opcionesPrecio, { categoria, acompanantes, menores, mayores }, noches)
    : [];
  const total = detalle.length > 0 ? detalle.reduce((acc, d) => acc + d.subtotal, 0) : null;
  const unidadElegida = UNIDADES.find((u) => u.tipo === unidad);

  const PASOS: { paso: Paso; label: string }[] = [
    { paso: 'unidad', label: 'Alojamiento' },
    { paso: 'fechas', label: 'Fechas' },
    { paso: 'datos', label: 'Tus datos' },
  ];
  const indicePaso = PASOS.findIndex((p) => p.paso === paso);

  return (
    <div
      ref={contenedorRef}
      className="max-w-xl mx-auto bg-superficie rounded-card shadow-elevada p-5 sm:p-8 lg:p-10 relative overflow-hidden"
    >
      {/* Acento orgánico decorativo, igual al usado en el resto del sitio */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-primario/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-16 w-48 h-48 bg-acento/5 rounded-full blur-2xl pointer-events-none" />

      {paso !== 'confirmado' && (
        <div className="flex items-center gap-2 mb-8 relative z-10">
          {PASOS.map((p, i) => (
            <div key={p.paso} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-titulo font-bold text-sm transition-colors ${
                  i < indicePaso
                    ? 'bg-primario text-white'
                    : i === indicePaso
                      ? 'bg-gradient-to-r from-primario to-acento text-white'
                      : 'bg-fondo-alt text-texto-suave'
                }`}
              >
                {i < indicePaso ? (
                  <span className="material-symbols-outlined text-[18px]">check</span>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`hidden sm:inline font-titulo text-sm font-medium ${
                  i <= indicePaso ? 'text-negro' : 'text-texto-suave'
                }`}
              >
                {p.label}
              </span>
              {i < PASOS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full ${
                    i < indicePaso ? 'bg-primario' : 'bg-fondo-alt'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {paso === 'unidad' && (
        <section className="flex flex-col gap-6 relative z-10">
          <h2 className="font-titulo font-bold text-3xl text-negro">¿Qué quieres reservar?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {UNIDADES.map((u) => {
              const seleccionada = unidad === u.tipo;
              return (
                <button
                  key={u.tipo}
                  onClick={() => setUnidad(u.tipo)}
                  className={`text-left rounded-card p-5 h-full transition-all duration-300 ${
                    seleccionada
                      ? 'bg-fondo-alt shadow-suave ring-2 ring-primario/30'
                      : 'bg-fondo-alt/50 hover:bg-fondo-alt'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                        seleccionada
                          ? 'bg-gradient-to-r from-primario to-acento text-white'
                          : 'bg-superficie text-texto-suave'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: `'FILL' ${seleccionada ? 1 : 0}` }}
                      >
                        {u.icono}
                      </span>
                    </div>
                    <span
                      className={`material-symbols-outlined text-primario transition-opacity ${
                        seleccionada ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      check_circle
                    </span>
                  </div>
                  <h3 className="font-titulo font-bold text-lg text-negro leading-tight">
                    {u.label}
                  </h3>
                  <p className="text-sm text-texto-suave mt-1">{u.descripcion}</p>
                </button>
              );
            })}
          </div>

          {unidad && (
            <div ref={detalleUnidadRef} className="flex flex-col gap-6 scroll-mt-6">
              <Carousel
                imagenes={IMAGENES_UNIDAD[unidad]}
                alt={UNIDADES.find((u) => u.tipo === unidad)?.label ?? ''}
              />

              {unidad === 'MOTORHOME' && (
                <div className="flex flex-col gap-4 bg-fondo-alt rounded-card p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {opcionesPrecio
                      .filter((o) => o.tipoCargo === 'BASE')
                      .map((op) => (
                        <button
                          key={op.clave}
                          type="button"
                          onClick={() => setCategoria(op.clave)}
                          className={opcionBase(categoria === op.clave)}
                        >
                          <div className="font-titulo font-bold text-negro text-sm">
                            {op.etiqueta}
                          </div>
                          <div className="text-texto-suave text-xs mt-1">
                            {formatoMoneda(op.precioPorNoche)} / noche
                          </div>
                        </button>
                      ))}
                  </div>
                  {opcionesPrecio
                    .filter((o) => o.tipoCargo === 'ADICIONAL' && o.clave === 'PERSONAS_BASE')
                    .map((op) => (
                      <div
                        key={op.clave}
                        className="flex items-center justify-between text-sm border-t border-borde pt-4"
                      >
                        <span className="text-texto-suave">{op.etiqueta}</span>
                        <span className="font-titulo font-bold text-negro">
                          {formatoMoneda(op.precioPorNoche)} / noche
                        </span>
                      </div>
                    ))}
                  <div className="border-t border-borde pt-4 flex flex-col gap-3">
                    <p className="flex items-center gap-1.5 text-sm font-titulo font-bold text-negro">
                      <span className="material-symbols-outlined text-[18px] text-primario">
                        group
                      </span>
                      Acompañantes adicionales
                    </p>
                    {opcionesPrecio
                      .filter((o) => o.tipoCargo === 'CANTIDAD' && o.clave === 'ACOMPANANTE')
                      .map((op) => (
                        <Stepper
                          key={op.clave}
                          label={op.etiqueta}
                          sublabel={`${formatoMoneda(op.precioPorNoche)} / noche c/u`}
                          value={acompanantes}
                          onChange={setAcompanantes}
                        />
                      ))}
                  </div>
                </div>
              )}

              {unidad === 'CAMPING' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-fondo-alt rounded-card p-5">
                  {opcionesPrecio.map((op) => (
                    <Stepper
                      key={op.clave}
                      label={op.etiqueta}
                      sublabel={`${formatoMoneda(op.precioPorNoche)} / noche c/u`}
                      value={op.clave === 'MENOR' ? menores : mayores}
                      onChange={op.clave === 'MENOR' ? setMenores : setMayores}
                    />
                  ))}
                </div>
              )}

              {unidad === 'CABANA' && (
                <div className="flex flex-col gap-4 bg-fondo-alt rounded-card p-5">
                  {opcionesPrecio
                    .filter((o) => o.clave === 'FIJO')
                    .map((op) => (
                      <div key={op.clave} className="flex items-center justify-between text-sm">
                        <span className="text-texto-suave">{op.etiqueta}</span>
                        <span className="font-titulo font-bold text-negro">
                          {formatoMoneda(op.precioPorNoche)} / noche
                        </span>
                      </div>
                    ))}
                  <p className="text-xs text-texto-suave flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    Capacidad máxima {CAPACIDAD_MAXIMA_CABANA} personas.
                  </p>
                </div>
              )}

              {unidad === 'QUINCHOS' && (
                <div className="flex flex-col gap-4 bg-fondo-alt rounded-card p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {opcionesPrecio.map((op) => (
                      <button
                        key={op.clave}
                        type="button"
                        onClick={() => setCategoria(op.clave)}
                        className={opcionBase(categoria === op.clave)}
                      >
                        <div className="font-titulo font-bold text-negro text-sm">
                          {op.etiqueta}
                        </div>
                        <div className="text-texto-suave text-xs mt-1">
                          {formatoMoneda(op.precioPorNoche)} / día
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-texto-suave flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    La entrada al parque por persona no está incluida.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            className={btnPrimario}
            disabled={!puedeContinuarDesdeUnidad}
            onClick={() => setPaso('fechas')}
          >
            Continuar
          </button>
        </section>
      )}

      {paso === 'fechas' && (
        <section className="flex flex-col gap-5 relative z-10">
          <h2 className="font-titulo font-bold text-3xl text-negro">
            {unidad === 'QUINCHOS' ? 'Elegí el día' : 'Elegí tus fechas'}
          </h2>
          {unidad === 'QUINCHOS' ? (
            <label className="flex flex-col gap-1 text-sm font-titulo font-medium text-texto-suave min-w-0">
              Fecha
              <div className="relative">
                <input
                  type="date"
                  className={`${input} ${!fechaIngreso && !tocadoIngreso ? 'text-transparent' : ''}`}
                  value={fechaIngreso}
                  min={minEntrada}
                  onFocus={() => setTocadoIngreso(true)}
                  onChange={(e) => setFechaIngreso(e.target.value)}
                />
                {!fechaIngreso && !tocadoIngreso && (
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-texto-suave/60 font-cuerpo pointer-events-none">
                    dd/mm/aaaa
                  </span>
                )}
              </div>
            </label>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm font-titulo font-medium text-texto-suave min-w-0">
                Entrada
                <div className="relative">
                  <input
                    type="date"
                    className={`${input} ${!fechaIngreso && !tocadoIngreso ? 'text-transparent' : ''}`}
                    value={fechaIngreso}
                    min={minEntrada}
                    onFocus={() => setTocadoIngreso(true)}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setFechaIngreso(valor);
                      if (fechaSalida && fechaSalida <= valor) setFechaSalida('');
                    }}
                  />
                  {!fechaIngreso && !tocadoIngreso && (
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-texto-suave/60 font-cuerpo pointer-events-none">
                      dd/mm/aaaa
                    </span>
                  )}
                </div>
              </label>
              <label className="flex flex-col gap-1 text-sm font-titulo font-medium text-texto-suave min-w-0">
                Salida
                <div className="relative">
                  <input
                    type="date"
                    className={`${input} ${!fechaSalida && !tocadoSalida ? 'text-transparent' : ''}`}
                    value={fechaSalida}
                    min={minSalida}
                    onFocus={() => setTocadoSalida(true)}
                    onChange={(e) => setFechaSalida(e.target.value)}
                  />
                  {!fechaSalida && !tocadoSalida && (
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-texto-suave/60 font-cuerpo pointer-events-none">
                      dd/mm/aaaa
                    </span>
                  )}
                </div>
              </label>
            </div>
          )}

          {cargandoDisponibilidad && (
            <p className="text-texto-suave text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] animate-spin">
                progress_activity
              </span>
              Consultando disponibilidad…
            </p>
          )}

          {error && <p className="text-primario text-sm font-medium">{error}</p>}

          {disponibilidad?.tipo === 'cupo' && (
            <div
              className={`flex items-center gap-2 rounded-card px-4 py-3 font-medium text-sm ${
                disponibilidad.disponible
                  ? 'bg-confirmado/10 text-confirmado'
                  : 'bg-fondo-alt text-texto-suave'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {disponibilidad.disponible ? 'check_circle' : 'cancel'}
              </span>
              {disponibilidad.disponible
                ? 'Hay lugar para estas fechas'
                : 'Sin disponibilidad para estas fechas'}
            </div>
          )}
          {disponibilidad?.tipo === 'unica' && (
            <div
              className={`flex items-center gap-2 rounded-card px-4 py-3 font-medium text-sm ${
                disponibilidad.disponible
                  ? 'bg-confirmado/10 text-confirmado'
                  : 'bg-fondo-alt text-texto-suave'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {disponibilidad.disponible ? 'check_circle' : 'cancel'}
              </span>
              {disponibilidad.disponible
                ? 'La cabaña está disponible'
                : 'La cabaña no está disponible en estas fechas'}
            </div>
          )}
          {disponibilidad?.tipo === 'lista' && (
            <div className="flex flex-col gap-2">
              {disponibilidad.opciones.length === 0 && (
                <p className="text-texto-suave text-sm">
                  Sin parcelas disponibles para estas fechas.
                </p>
              )}
              {disponibilidad.opciones.map((p: OpcionParcela) => {
                const seleccionada = parcelaSeleccionada === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setParcelaSeleccionada(p.id)}
                    className={`flex items-center justify-between text-left rounded-card px-5 py-3 transition-all ${
                      seleccionada
                        ? 'bg-fondo-alt shadow-suave ring-2 ring-primario/30'
                        : 'bg-fondo-alt/50 hover:bg-fondo-alt'
                    }`}
                  >
                    <div>
                      <div className="font-titulo font-bold text-negro">{p.nombre}</div>
                      {p.atributos.length > 0 && (
                        <div className="text-texto-suave text-sm">{p.atributos.join(' · ')}</div>
                      )}
                    </div>
                    <span
                      className={`material-symbols-outlined text-primario transition-opacity ${
                        seleccionada ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      check_circle
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {detalle.length > 0 && (
            <div className="bg-fondo-alt rounded-card p-5 flex flex-col gap-2 text-sm">
              {detalle.map((d) => (
                <div key={d.clave} className="flex justify-between">
                  <span className="text-texto-suave">
                    {d.etiqueta}
                    {d.cantidad > 1 ? ` × ${d.cantidad}` : ''}
                  </span>
                  <span className="font-medium text-negro">{formatoMoneda(d.subtotal)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button className={`${btnSecundario} flex-1`} onClick={() => setPaso('unidad')}>
              Volver
            </button>
            <button
              className={`${btnPrimario} flex-1`}
              disabled={!puedeContinuarDesdeFechas}
              onClick={() => setPaso('datos')}
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      {paso === 'datos' && (
        <section className="flex flex-col gap-4 relative z-10">
          <h2 className="font-titulo font-bold text-3xl text-negro">Tus datos</h2>
          {modo === 'staff' && scanEstado === 'baja-confianza' && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-advertencia bg-advertencia/10 rounded-card px-4 py-3">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Verificá nombre, apellido y DNI contra el documento físico antes de guardar.
            </p>
          )}
          {modo === 'staff' && scanEstado === 'error' && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-texto-suave bg-fondo-alt rounded-card px-4 py-3">
              <span className="material-symbols-outlined text-[18px]">info</span>
              No se pudo leer el DNI, complete los datos manualmente.
            </p>
          )}
          <input
            className={`${input} ${
              scanEstado === 'ok'
                ? 'border-confirmado'
                : scanEstado === 'baja-confianza'
                  ? 'border-advertencia'
                  : ''
            }`}
            placeholder="Nombre y apellido"
            value={datosCliente.nombreCliente}
            onChange={(e) => {
              setScanEstado('idle');
              setDatosCliente({ ...datosCliente, nombreCliente: e.target.value });
            }}
          />
          <input
            className={`${input} ${
              scanEstado === 'ok'
                ? 'border-confirmado'
                : scanEstado === 'baja-confianza'
                  ? 'border-advertencia'
                  : ''
            }`}
            placeholder="DNI o PASAPORTE"
            value={datosCliente.dni}
            onChange={(e) => {
              setScanEstado('idle');
              setDatosCliente({ ...datosCliente, dni: e.target.value });
            }}
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

          {(unidadElegida || noches || detalle.length > 0) && (
            <div className="bg-fondo-alt rounded-card p-5 flex flex-col gap-2 text-sm">
              {unidadElegida && (
                <div className="flex justify-between">
                  <span className="text-texto-suave">Alojamiento</span>
                  <span className="font-medium text-negro">{unidadElegida.label}</span>
                </div>
              )}
              {noches && (
                <div className="flex justify-between">
                  <span className="text-texto-suave">
                    {unidad === 'QUINCHOS' ? 'Días' : 'Noches'}
                  </span>
                  <span className="font-medium text-negro">{noches}</span>
                </div>
              )}
              {detalle.map((d) => (
                <div key={d.clave} className="flex justify-between">
                  <span className="text-texto-suave">
                    {d.etiqueta}
                    {d.cantidad > 1 ? ` × ${d.cantidad}` : ''}
                  </span>
                  <span className="font-medium text-negro">{formatoMoneda(d.subtotal)}</span>
                </div>
              ))}
              {total != null && (
                <div className="flex justify-between items-center pt-2 border-t border-borde">
                  <span className="font-titulo font-bold text-negro">Total</span>
                  <span className="font-titulo font-black text-xl text-primario">
                    {formatoMoneda(total)}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-primario text-sm font-medium">{error}</p>}

          <div className="flex gap-3">
            <button
              className={`${btnSecundario} flex-1`}
              disabled={enviando}
              onClick={() => setPaso('fechas')}
            >
              Volver
            </button>
            <button
              className={`${btnPrimario} flex-1`}
              disabled={!datosCompletos || enviando}
              onClick={confirmarReserva}
            >
              {enviando ? 'Confirmando…' : 'Confirmar reserva'}
            </button>
          </div>
        </section>
      )}

      {paso === 'confirmado' && (
        <section className="flex flex-col items-center gap-3 text-center py-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primario to-acento text-white flex items-center justify-center mb-2">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check
            </span>
          </div>
          <h2 className="font-titulo font-bold text-3xl text-negro">¡Reserva confirmada!</h2>
          <p className="text-texto-suave max-w-sm">
            Te enviamos los detalles y los datos para transferir a tu email.
          </p>
        </section>
      )}
    </div>
  );
}
