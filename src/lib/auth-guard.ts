// Guardas de autorización para usar DENTRO de cada handler /api/panel/**.
// El middleware (src/middleware.ts) ya gatea estas rutas por prefijo de path,
// pero esto es defensa en profundidad: si el middleware fallara o un refactor
// rompiera el prefijo, el handler igual rechaza. Devuelven un `Response` de
// error listo para retornar, o `null` si el acceso está permitido.

type Locals = App.Locals;

function json(estado: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function exigirStaff(locals: Locals): Response | null {
  if (!locals.usuario) return json(401, 'No autenticado');
  return null;
}

export function exigirAdmin(locals: Locals): Response | null {
  if (!locals.usuario) return json(401, 'No autenticado');
  if (locals.usuario.rol !== 'admin') return json(403, 'No autorizado');
  return null;
}
