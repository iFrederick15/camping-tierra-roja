// Protege todo /panel/** (páginas y /api/panel/**). Resuelve el perfil una
// sola vez por request y lo deja en Astro.locals.usuario para que páginas y
// rutas API no repitan la lógica de sesión.
import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase-server';
import { supabaseAdmin } from './lib/supabase';

const RUTAS_PUBLICAS_PANEL = ['/panel/login'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!pathname.startsWith('/panel') && !pathname.startsWith('/api/panel')) {
    return next();
  }

  if (RUTAS_PUBLICAS_PANEL.includes(pathname)) {
    return next();
  }

  const supabase = createSupabaseServerClient(context.cookies, context.request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith('/api/panel')) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
    }
    return context.redirect('/panel/login');
  }

  const { data: perfil } = await supabaseAdmin
    .from('perfiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single();

  if (!perfil) {
    if (pathname.startsWith('/api/panel')) {
      return new Response(JSON.stringify({ error: 'Usuario sin perfil asignado' }), {
        status: 403,
      });
    }
    return context.redirect('/panel/login');
  }

  context.locals.usuario = { id: user.id, nombre: perfil.nombre, rol: perfil.rol };

  const esRutaAdmin = pathname.startsWith('/panel/admin') || pathname.startsWith('/api/panel/admin');
  if (esRutaAdmin && perfil.rol !== 'admin') {
    if (pathname.startsWith('/api/panel')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
    }
    return context.redirect('/panel');
  }

  return next();
});
