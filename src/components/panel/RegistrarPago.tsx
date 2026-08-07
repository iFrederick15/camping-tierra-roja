import { useState } from 'react';

interface Props {
  reservaId: string;
}

// Único punto interactivo de la pantalla de Detalle: registra un pago sin
// perder el resto del formulario de check-in/check-out. Tras confirmar,
// recarga la página — así el estado de check-in/check-out (que vive en el
// server, en src/lib/reservas.ts) queda como única fuente de verdad, sin
// duplicar esas reglas acá.
export default function RegistrarPago({ reservaId }: Props) {
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('Transferencia');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  async function registrarPago(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/panel/reservas/${reservaId}/pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: Number(monto), metodo, nota: nota || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo registrar el pago');
      setExito(true);
      setTimeout(() => window.location.reload(), 600);
    } catch (e: any) {
      setError(e.message);
      setEnviando(false);
    }
  }

  const input =
    'w-full border-2 border-borde rounded-card px-4 py-2.5 focus:border-primario focus:outline-none transition-colors';

  return (
    <form onSubmit={registrarPago} className="flex flex-col gap-3 bg-superficie-elevada rounded-card p-5">
      <h3 className="font-titulo font-bold text-negro">Registrar pago</h3>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          min={1}
          step="0.01"
          placeholder="Monto"
          className={input}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />
        <select className={input} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
          <option>Transferencia</option>
          <option>Efectivo</option>
          <option>Otro</option>
        </select>
      </div>
      <input
        type="text"
        placeholder="Nota (opcional)"
        className={input}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />
      {error && <p className="text-primario text-sm font-medium">{error}</p>}
      {exito && <p className="text-confirmado text-sm font-medium">Pago registrado.</p>}
      <button
        type="submit"
        disabled={enviando}
        className="self-start inline-flex items-center gap-2 bg-gradient-to-r from-primario to-acento text-white px-5 py-2.5 rounded-pill font-titulo font-bold hover:shadow-hero transition-all disabled:opacity-40"
      >
        {enviando ? 'Registrando…' : 'Registrar pago'}
      </button>
    </form>
  );
}
