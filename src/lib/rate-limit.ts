// Rate limiting best-effort en memoria del proceso.
//
// LIMITACIÓN: en Vercel (serverless) el estado vive por instancia y se
// pierde al reciclarse; distintas instancias no comparten contador. Sirve
// como primera barrera contra ráfagas sobre una instancia caliente, pero la
// protección real contra fuerza bruta / spam distribuido necesita un store
// compartido (Vercel KV / Upstash Redis) o reglas de Vercel WAF. Ver
// auditoria-seguridad.md (H-04).

interface Registro {
  conteo: number;
  reinicioEn: number;
}

const cubetas = new Map<string, Registro>();

// Limpieza perezosa para que el Map no crezca sin techo.
function purgar(ahora: number) {
  if (cubetas.size < 5000) return;
  for (const [k, v] of cubetas) {
    if (v.reinicioEn <= ahora) cubetas.delete(k);
  }
}

export interface ResultadoLimite {
  permitido: boolean;
  reintentarEnSegundos: number;
}

/**
 * @param clave    Identificador de la cubeta (p. ej. `login:<ip>`).
 * @param maximo   Cantidad de eventos permitidos por ventana.
 * @param ventanaMs Duración de la ventana en milisegundos.
 */
export function consumir(clave: string, maximo: number, ventanaMs: number): ResultadoLimite {
  const ahora = Date.now();
  purgar(ahora);

  const actual = cubetas.get(clave);
  if (!actual || actual.reinicioEn <= ahora) {
    cubetas.set(clave, { conteo: 1, reinicioEn: ahora + ventanaMs });
    return { permitido: true, reintentarEnSegundos: 0 };
  }

  if (actual.conteo >= maximo) {
    return {
      permitido: false,
      reintentarEnSegundos: Math.max(1, Math.ceil((actual.reinicioEn - ahora) / 1000)),
    };
  }

  actual.conteo += 1;
  return { permitido: true, reintentarEnSegundos: 0 };
}

// IP del cliente detrás del proxy de Vercel.
export function ipDe(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'desconocida';
}
