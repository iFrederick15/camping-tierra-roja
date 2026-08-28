import { useState } from 'react';

interface Comentario {
  id: string;
  texto: string;
  autor: string | null;
  creadoEn: string;
}

interface Props {
  reservaId: string;
  comentariosIniciales: Comentario[];
}

// Bitácora de la reserva: Staff/Admin deja asentado cualquier inconveniente
// (llegadas fuera de horario, faltó documentación, daños, etc.). Cada
// entrada guarda autor y fecha — no se editan ni se borran, son un registro
// histórico. Ver sql/007_comentarios_reserva.sql.
export default function ComentariosReserva({ reservaId, comentariosIniciales }: Props) {
  const [comentarios, setComentarios] = useState<Comentario[]>(comentariosIniciales);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/panel/reservas/${reservaId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'No se pudo guardar el comentario');
      setComentarios((prev) => [data.comentario, ...prev]);
      setTexto('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const fmtFecha = (f: string) =>
    new Date(f).toLocaleString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="bg-superficie rounded-card border-2 border-borde p-5 flex flex-col gap-4">
      <h2 className="font-titulo font-bold text-negro">Comentarios</h2>

      <form onSubmit={agregar} className="flex flex-col gap-3">
        <textarea
          placeholder="Deja asentado cualquier inconveniente o novedad."
          className="w-full border-2 border-borde rounded-card px-4 py-2.5 focus:border-primario focus:outline-none transition-colors resize-y min-h-[80px]"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={2000}
          required
        />
        {error && <p className="text-[#DC2626] text-sm font-medium">{error}</p>}
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="self-start inline-flex items-center gap-2 bg-gradient-to-r from-primario to-acento text-white px-5 py-2.5 rounded-pill font-titulo font-bold hover:shadow-hero transition-all disabled:opacity-40"
        >
          {enviando ? 'Guardando…' : 'Agregar comentario'}
        </button>
      </form>

      {comentarios.length === 0 ? (
        <p className="text-texto-suave text-sm">Todavía no hay comentarios.</p>
      ) : (
        <ul className="flex flex-col gap-3 pt-1">
          {comentarios.map((c) => (
            <li key={c.id} className="border-t border-borde pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm text-texto whitespace-pre-wrap">{c.texto}</p>
              <p className="text-texto-suave text-xs mt-1">
                {c.autor ?? 'Staff'} · {fmtFecha(c.creadoEn)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
