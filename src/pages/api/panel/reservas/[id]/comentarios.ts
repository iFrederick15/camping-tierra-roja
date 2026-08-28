import type { APIRoute } from 'astro';
import { obtenerReserva, agregarComentario } from '../../../../../lib/reservas';

export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!locals.usuario) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  const id = params.id!;
  const reserva = await obtenerReserva(id);
  if (!reserva) {
    return new Response(JSON.stringify({ error: 'Reserva no encontrada' }), { status: 404 });
  }

  const body = await request.json();
  const texto = String(body.texto ?? '').trim();
  if (!texto) {
    return new Response(JSON.stringify({ error: 'Escribí el comentario' }), { status: 400 });
  }
  if (texto.length > 2000) {
    return new Response(JSON.stringify({ error: 'El comentario es demasiado largo' }), { status: 400 });
  }

  const comentario = await agregarComentario(id, texto, locals.usuario.nombre);
  if (!comentario) {
    return new Response(JSON.stringify({ error: 'No se pudo guardar el comentario' }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true, comentario }), { status: 200 });
};
