// Escapado de HTML para interpolar datos del usuario en cuerpos de email
// (lib/email.ts) o en cualquier string HTML armado a mano. Astro ya escapa
// las expresiones `{...}` en las plantillas .astro; esto es para el HTML que
// se construye por template string fuera de una plantilla.
export function escaparHtml(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
