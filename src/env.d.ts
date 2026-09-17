/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly RESEND_API_KEY: string;
  readonly CRON_SECRET: string;
  readonly GTM_ID: string;
  readonly GOOGLE_PLACES_API_KEY: string;
  readonly GOOGLE_PLACE_ID: string;
  /** Casilla que recibe el formulario de /contacto. Por defecto, NEGOCIO.email. */
  readonly CONTACTO_EMAIL_DESTINO: string;
  /** Host de las imágenes del email (el logo). Por defecto, el `site` de astro.config. */
  readonly EMAIL_BASE_URL: string;
  // Datos de la cuenta para transferir la reserva. Van en env y no en el
  // código: son datos bancarios del negocio y cambian sin deploy. Si faltan,
  // el email de confirmación los pide por WhatsApp en vez de dejar un hueco.
  // Mínimo para que el email los muestre: PAGO_TITULAR + PAGO_CBU o PAGO_ALIAS
  // (las demás son opcionales y las filas vacías no se imprimen).
  readonly PAGO_TITULAR: string;
  readonly PAGO_CBU: string;
  readonly PAGO_ALIAS: string;
  readonly PAGO_BANCO: string;
  /** Porcentaje del total que se pide como seña en el email. Por defecto, 50. */
  readonly PAGO_SENA_PORCENTAJE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    usuario: { id: string; nombre: string; rol: 'staff' | 'admin' } | null;
  }
}
