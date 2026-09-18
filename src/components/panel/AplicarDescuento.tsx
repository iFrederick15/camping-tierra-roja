import { useState } from 'react';

interface Props {
  reservaId: string;
  // Total de lista, antes del descuento (montoTotal + descuento).
  subtotal: number;
  montoPagado: number;
  descuentoActual: number;
  motivoActual: string | null;
}

const fmtMoneda = (n: number) => `$${n.toLocaleString('es-AR')}`;

// Descuento sobre el total de la reserva. Se carga en pesos o en porcentaje,
// pero al server siempre viaja en pesos: es lo que queda guardado
// (sql/016). Igual que RegistrarPago, recarga la página al confirmar.
export default function AplicarDescuento({
  reservaId,
  subtotal,
  montoPagado,
  descuentoActual,
  motivoActual,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<'MONTO' | 'PORCENTAJE'>('MONTO');
  const [valor, setValor] = useState(descuentoActual > 0 ? String(descuentoActual) : '');
  const [motivo, setMotivo] = useState(motivoActual ?? '');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numero = Number(valor) || 0;
  const descuento =
    tipo === 'PORCENTAJE' ? Math.round((subtotal * numero) / 100) : Math.round(numero * 100) / 100;
  const totalNuevo = subtotal - descuento;

  async function enviar(monto: number) {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/panel/reservas/${reservaId}/descuento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descuento: monto, motivo: monto > 0 ? motivo : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo aplicar el descuento');
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
      setEnviando(false);
    }
  }

  function aplicar(e: React.FormEvent) {
    e.preventDefault();
    if (descuento <= 0) {
      setError('El descuento debe ser mayor a cero');
      return;
    }
    if (totalNuevo < 0) {
      setError('El descuento no puede superar el total de la reserva');
      return;
    }
    if (totalNuevo < montoPagado) {
      setError(`Ya se pagaron ${fmtMoneda(montoPagado)}: el total no puede quedar por debajo`);
      return;
    }
    enviar(descuento);
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="self-start inline-flex items-center gap-1.5 text-sm font-titulo font-bold text-primario hover:text-primario-oscuro transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">sell</span>
        {descuentoActual > 0 ? 'Modificar descuento' : 'Aplicar descuento'}
      </button>
    );
  }

  const input =
    'w-full border-2 border-borde rounded-card px-4 py-2.5 focus:border-primario focus:outline-none transition-colors';

  return (
    <form onSubmit={aplicar} className="flex flex-col gap-3 bg-superficie-elevada rounded-card p-5">
      <h3 className="font-titulo font-bold text-negro">
        {descuentoActual > 0 ? 'Modificar descuento' : 'Aplicar descuento'}
      </h3>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <input
          type="number"
          min={0.01}
          max={tipo === 'PORCENTAJE' ? 100 : subtotal}
          step="0.01"
          placeholder={tipo === 'PORCENTAJE' ? 'Porcentaje' : 'Monto'}
          className={input}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />
        <select
          className={input}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'MONTO' | 'PORCENTAJE')}
          aria-label="Tipo de descuento"
        >
          <option value="MONTO">$</option>
          <option value="PORCENTAJE">%</option>
        </select>
      </div>
      <input
        type="text"
        placeholder="Motivo (ej. estadía larga, cliente frecuente)"
        className={input}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        required
      />
      <button
        type="button"
        onClick={() => {
          setTipo('PORCENTAJE');
          setValor('100');
          if (!motivo) setMotivo('Por la casa');
        }}
        className="self-start text-sm font-medium text-primario hover:text-primario-oscuro"
      >
        Por la casa (100%)
      </button>
      {descuento > 0 && totalNuevo >= 0 && (
        <p className="text-sm text-texto-suave">
          {fmtMoneda(subtotal)} − {fmtMoneda(descuento)} ={' '}
          <span className="font-titulo font-bold text-negro">{fmtMoneda(totalNuevo)}</span>
        </p>
      )}
      {error && <p className="text-[#DC2626] text-sm font-medium">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center gap-2 bg-primario text-white px-5 py-2.5 rounded-pill font-titulo font-bold hover:bg-primario-oscuro transition-colors disabled:opacity-40"
        >
          {enviando ? 'Guardando…' : 'Aplicar descuento'}
        </button>
        {descuentoActual > 0 && (
          <button
            type="button"
            disabled={enviando}
            onClick={() => enviar(0)}
            className="text-sm font-medium text-primario hover:text-primario-oscuro disabled:opacity-40"
          >
            Quitar descuento
          </button>
        )}
        <button
          type="button"
          disabled={enviando}
          onClick={() => {
            setAbierto(false);
            setError(null);
          }}
          className="text-sm font-medium text-texto-suave hover:text-texto disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
