// Genera los emails de confirmación con datos de ejemplo y los abre en el
// navegador, para revisar el diseño sin gastar envíos de Resend ni crear
// reservas de prueba.
//
//   node scripts/preview-email.mjs                  → los escribe en dist-preview/
//   node scripts/preview-email.mjs --abrir          → además los abre en el navegador
//   node scripts/preview-email.mjs --enviar=vos@... → los manda de verdad por Resend
//
// Corre sobre Vite (no node suelto) porque src/lib/email.ts lee
// `import.meta.env`, que fuera del build de Astro no existe.

import { createServer, loadEnv } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { resolve } from 'node:path';

const SALIDA = resolve('dist-preview');

// Un caso de cada uno de los dos caminos que tiene el email: la reserva web,
// que vence si no se transfiere, y la que carga Staff a mano, que no vence.
const CASOS = {
  'reserva-web': {
    reservaId: 'a3f91c2d-7b4e-4f1a-9c22-5e8d0b6a7f31',
    email: 'cliente@ejemplo.com',
    nombreCliente: 'María González',
    unidadNombre: 'Motorhome',
    parcelaNombre: 'Parcela 12',
    fechaIngreso: '2026-10-09',
    fechaSalida: '2026-10-12',
    noches: 3,
    detalle: [
      {
        clave: 'GRANDE',
        etiqueta: 'Motorhome grande',
        cantidad: 1,
        precioUnitario: 18000,
        subtotal: 54000,
      },
      {
        clave: 'ACOMPANANTE',
        etiqueta: 'Acompañante',
        cantidad: 2,
        precioUnitario: 4500,
        subtotal: 27000,
      },
    ],
    montoTotal: 81000,
    fechaLimitePago: new Date('2026-09-19T21:00:00Z'),
  },
  'reserva-manual': {
    reservaId: 'f70c1b84-2d55-4a90-8e13-c4b7a1d2e905',
    email: 'cliente@ejemplo.com',
    nombreCliente: 'Juan Pérez',
    unidadNombre: 'Camping',
    parcelaNombre: null,
    fechaIngreso: '2026-10-09',
    fechaSalida: '2026-10-10',
    noches: 1,
    detalle: [
      { clave: 'MAYOR', etiqueta: 'Mayor', cantidad: 2, precioUnitario: 12000, subtotal: 24000 },
      { clave: 'MENOR', etiqueta: 'Menor', cantidad: 1, precioUnitario: 6000, subtotal: 6000 },
    ],
    montoTotal: 30000,
    fechaLimitePago: null,
  },
};

// Vite solo vuelca en `import.meta.env` las variables con prefijo `VITE_`.
// Sin esto, el bloque de datos bancarios saldría siempre en su versión de
// respaldo ("escríbenos por WhatsApp") aunque el .env esté completo, y la
// vista previa no serviría justamente para revisar lo que más importa.
// Se enumeran los prefijos en vez de abrir todo: `envPrefix: ''` expondría
// también RESEND_API_KEY y CRON_SECRET al bundle.
const servidor = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  envPrefix: ['VITE_', 'PAGO_', 'EMAIL_'],
});
const { construirEmailConfirmacion } = await servidor.ssrLoadModule('/src/lib/email.ts');

await mkdir(SALIDA, { recursive: true });
const generados = [];
const armados = [];

for (const [nombre, datos] of Object.entries(CASOS)) {
  const { subject, html, text } = construirEmailConfirmacion(datos);
  const archivo = resolve(SALIDA, `${nombre}.html`);
  await writeFile(archivo, html);
  await writeFile(resolve(SALIDA, `${nombre}.txt`), `Asunto: ${subject}\n\n${text}`);
  generados.push(archivo);
  armados.push({ nombre, subject, html, text });
  console.log(`${nombre}.html  —  ${subject}`);
}

await servidor.close();

// Envío real. El navegador no alcanza para saber cómo queda el email: Gmail
// reescribe el CSS, Outlook lo pasa por el motor de Word y ahí aparecen los
// problemas de verdad. Requiere RESEND_API_KEY y el dominio verificado en
// Resend (hasta entonces Resend solo deja enviar a la casilla de tu cuenta).
const destino = process.argv.find((a) => a.startsWith('--enviar='))?.split('=')[1];
if (destino) {
  // Node no lee el .env por su cuenta: sin `loadEnv` habría que repetir la
  // clave en la línea de comandos aunque ya esté en el archivo.
  const env = loadEnv('development', process.cwd(), ['RESEND_', 'EMAIL_']);
  const clave = process.env.RESEND_API_KEY || env.RESEND_API_KEY;
  if (!clave) {
    console.error(
      'RESEND_API_KEY está vacía. Cargala en .env (https://resend.com/api-keys) o pasala en la línea:\n' +
        '  RESEND_API_KEY=re_xxx node scripts/preview-email.mjs --enviar=vos@ejemplo.com'
    );
    process.exit(1);
  }
  const { Resend } = await import('resend');
  const resend = new Resend(clave);
  for (const { nombre, subject, html, text } of armados) {
    const { error } = await resend.emails.send({
      // Mientras el dominio no esté verificado en Resend, el único remitente
      // permitido es onboarding@resend.dev y solo hacia la casilla de tu
      // propia cuenta de Resend.
      from:
        process.env.EMAIL_FROM_PRUEBA ||
        env.EMAIL_FROM_PRUEBA ||
        'Tierra Roja <reservas@tierraroja.com.ar>',
      to: destino,
      subject: `[PRUEBA ${nombre}] ${subject}`,
      html,
      text,
    });
    console.log(error ? `✗ ${nombre}: ${error.message}` : `✓ ${nombre} enviado a ${destino}`);
  }
}

if (process.argv.includes('--abrir')) {
  for (const archivo of generados) execFile('open', [archivo]);
}
