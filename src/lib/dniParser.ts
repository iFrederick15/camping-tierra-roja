export type ConfianzaScan = 'alta' | 'baja';

export interface DniScanResult {
  nombre: string;
  apellido: string;
  dni: string;
  confianza: ConfianzaScan;
}

const CAMPOS_MINIMOS = 5;
const REGEX_DNI = /^\d{7,8}$/;

function extraerCampos(campos: string[]): { apellido: string; nombre: string; dni: string } | null {
  if (campos.length < CAMPOS_MINIMOS) return null;
  const apellido = campos[1]?.trim();
  const nombre = campos[2]?.trim();
  const dni = campos[4]?.trim();
  if (!apellido || !nombre || !dni) return null;
  if (!REGEX_DNI.test(dni)) return null;
  return { apellido, nombre, dni };
}

// Parsea el string que la pistola lectora inyecta (como si fuera tipeado) al
// escanear el código de barras PDF417 del dorso del DNI argentino nuevo
// formato: campos separados por '@' — trámite, apellido, nombre, sexo, dni,
// ejemplar, fecha nacimiento, fecha emisión, cuil/otro. Solo se usan
// apellido, nombre y dni.
//
// Se acepta '"' como separador alternativo de "baja confianza": algunos
// scanners/configuraciones regionales lo devuelven así, pero ese resultado
// requiere verificación visual contra el documento físico antes de guardar.
export function parseDniPdf417(raw: string): DniScanResult | null {
  if (!raw) return null;
  const texto = raw.trim();
  if (!texto) return null;

  const porArroba = extraerCampos(texto.split('@'));
  if (porArroba) {
    return { ...porArroba, confianza: 'alta' };
  }

  const porComillas = extraerCampos(texto.split('"'));
  if (porComillas) {
    return { ...porComillas, confianza: 'baja' };
  }

  return null;
}
