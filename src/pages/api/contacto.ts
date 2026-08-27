// POST /api/contacto
// Recibe el formulario de la página /contacto y lo reenvía por email a la
// casilla del negocio (vía Resend, ya presente en las dependencias).

import type { APIRoute } from 'astro';
import { enviarEmailContacto } from '../../lib/email';
import { consumir, ipDe } from '../../lib/rate-limit';

const MAX_LARGO = 5000;

export const POST: APIRoute = async ({ request }) => {
  const limite = consumir(`contacto:${ipDe(request)}`, 5, 60 * 60 * 1000);
  if (!limite.permitido) {
    return new Response(
      JSON.stringify({ error: 'Demasiados mensajes seguidos. Prueba de nuevo en un rato.' }),
      { status: 429, headers: { 'Retry-After': String(limite.reintentarEnSegundos) } }
    );
  }

  let datos: Record<string, unknown>;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    datos = await request.json();
  } else {
    datos = Object.fromEntries(await request.formData());
  }

  const nombre = String(datos.nombre ?? '').trim();
  const email = String(datos.email ?? '').trim();
  const tipoConsulta = String(datos.tipoConsulta ?? 'Información general').trim();
  const mensaje = String(datos.mensaje ?? '').trim();

  // Honeypot anti-spam: campo oculto que un humano nunca completa.
  if (String(datos.website ?? '').trim() !== '') {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!nombre || !emailValido || !mensaje) {
    return new Response(
      JSON.stringify({ error: 'Completa tu nombre, un email válido y el mensaje.' }),
      { status: 400 }
    );
  }
  if (nombre.length > 200 || mensaje.length > MAX_LARGO) {
    return new Response(JSON.stringify({ error: 'El mensaje es demasiado largo.' }), {
      status: 400,
    });
  }

  try {
    await enviarEmailContacto({ nombre, email, tipoConsulta, mensaje });
  } catch (e) {
    console.error('No se pudo enviar el email de contacto:', e);
    return new Response(
      JSON.stringify({ error: 'No pudimos enviar tu mensaje. Escríbenos por WhatsApp.' }),
      { status: 502 }
    );
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
