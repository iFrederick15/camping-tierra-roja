// Cliente Supabase atado a las cookies de la request — SOLO para auth
// (signInWithPassword / signOut / getUser). El acceso a datos privilegiados
// sigue pasando por supabaseAdmin (service_role), como en el resto del sitio.
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseServerClient(cookies: AstroCookies, request: Request) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const header = request.headers.get('cookie') ?? '';
          return header
            .split(';')
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
              const eq = part.indexOf('=');
              return { name: part.slice(0, eq), value: decodeURIComponent(part.slice(eq + 1)) };
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );
}
