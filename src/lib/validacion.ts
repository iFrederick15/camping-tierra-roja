// Validación de los datos de cliente que llegan a las rutas de reserva
// (/api/reservar es pública y sin auth). Devuelve un mensaje de error o
// `null` si los datos son aceptables. No normaliza: solo valida.

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface DatosCliente {
  nombreCliente?: unknown;
  dni?: unknown;
  email?: unknown;
  telefono?: unknown;
  datosVehiculo?: unknown;
}

export function validarDatosCliente(
  datos: DatosCliente,
  opciones: { emailObligatorio?: boolean; telefonoObligatorio?: boolean } = {}
): string | null {
  const nombre = typeof datos.nombreCliente === 'string' ? datos.nombreCliente.trim() : '';
  if (nombre && nombre.length > 120) return 'El nombre es demasiado largo';
  if (/[<>]/.test(nombre)) return 'El nombre contiene caracteres no permitidos';

  const dni = datos.dni == null ? '' : String(datos.dni).trim();
  if (dni && !/^[\d.\s-]{6,15}$/.test(dni)) return 'El DNI no es válido';

  const email = typeof datos.email === 'string' ? datos.email.trim() : '';
  if (opciones.emailObligatorio && !email) return 'El email es obligatorio';
  if (email && (email.length > 254 || !RE_EMAIL.test(email))) return 'El email no es válido';

  const telefono = datos.telefono == null ? '' : String(datos.telefono).trim();
  if (opciones.telefonoObligatorio && !telefono) return 'El teléfono es obligatorio';
  if (telefono && !/^[\d+()\s-]{6,25}$/.test(telefono)) return 'El teléfono no es válido';

  if (typeof datos.datosVehiculo === 'string' && datos.datosVehiculo.length > 200) {
    return 'Los datos del vehículo son demasiado largos';
  }

  return null;
}
