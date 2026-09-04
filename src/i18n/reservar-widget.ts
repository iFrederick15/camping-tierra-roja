// ── Textos del widget de reserva (React) ──────────────────────────────────
//
// El widget vive en /reservar (y en el Panel de Staff, en modo 'staff'). Se
// le pasan los textos por prop en vez de importar el diccionario completo,
// para no arrastrar todas las traducciones del sitio al bundle de JavaScript
// del cliente.
//
// El modo 'staff' SIEMPRE usa español: lo opera el equipo del camping.

import type { Idioma } from './config';

export interface TextosWidget {
  pasos: { alojamiento: string; fechas: string; datos: string };
  queReservar: string;
  unidades: Record<
    'CAMPING' | 'MOTORHOME' | 'CABANA' | 'QUINCHOS',
    { label: string; descripcion: string }
  >;
  porNoche: string;
  porDia: string;
  porNocheCadaUno: string;
  motorhomeIncluye: string;
  acompanantes: string;
  capacidadCabana: string;
  quinchosNota: string;
  continuar: string;
  volver: string;
  elegiDia: string;
  elegiFechas: string;
  fecha: string;
  entrada: string;
  salida: string;
  formatoFecha: string;
  rangoInvalido: string;
  consultando: string;
  hayLugar: string;
  sinLugar: string;
  cabanaDisponible: string;
  cabanaNoDisponible: string;
  sinParcelas: string;
  tusDatos: string;
  nombrePlaceholder: string;
  dniPlaceholder: string;
  emailPlaceholder: string;
  telefonoPlaceholder: string;
  alojamiento: string;
  noches: string;
  dias: string;
  total: string;
  confirmar: string;
  confirmando: string;
  confirmadaTitulo: string;
  confirmadaTexto: string;
  volverInicio: string;
  errorDisponibilidad: string;
  errorReserva: string;
  fotoAnterior: string;
  fotoSiguiente: string;
  irAFoto: string;
  fotosProximamente: string;
  restar: string;
  sumar: string;
  /**
   * Etiquetas de los ítems de precio, traducidas por `clave`.
   *
   * Los textos que devuelve /api/precios vienen de la base de datos y los
   * edita el administrador desde el Panel, así que en español SIEMPRE se
   * respeta lo que él cargó (este mapa queda vacío). En portugués e inglés se
   * usa la traducción de acá y, si aparece una clave nueva sin traducir, se
   * cae al texto de la base — nunca a un texto vacío.
   */
  opcionesPrecio: Record<string, string>;
}

const es: TextosWidget = {
  pasos: { alojamiento: 'Alojamiento', fechas: 'Fechas', datos: 'Tus datos' },
  queReservar: '¿Qué quieres reservar?',
  unidades: {
    CAMPING: { label: 'Camping', descripcion: 'Arma tu carpa bajo el dosel de la selva.' },
    MOTORHOME: { label: 'Motorhome', descripcion: 'Parcela con luz y agua para tu rodante.' },
    CABANA: { label: 'Cabaña', descripcion: 'Comodidad techada en plena naturaleza.' },
    QUINCHOS: { label: 'Quincho', descripcion: 'Espacio con parrilla para tu grupo.' },
  },
  porNoche: '/ noche',
  porDia: '/ día',
  porNocheCadaUno: '/ noche c/u',
  motorhomeIncluye: 'El valor del motorhome por noche incluye 2 personas.',
  acompanantes: 'Acompañantes',
  capacidadCabana: 'Capacidad máxima {n} personas.',
  quinchosNota: 'La entrada al parque por persona no está incluida.',
  continuar: 'Continuar',
  volver: 'Volver',
  elegiDia: 'Elige el día',
  elegiFechas: 'Elige tus fechas',
  fecha: 'Fecha',
  entrada: 'Entrada',
  salida: 'Salida',
  formatoFecha: 'dd/mm/aaaa',
  rangoInvalido: 'La fecha de salida debe ser posterior a la de entrada.',
  consultando: 'Consultando disponibilidad…',
  hayLugar: 'Hay lugar para estas fechas',
  sinLugar: 'Sin disponibilidad para estas fechas',
  cabanaDisponible: 'La cabaña está disponible',
  cabanaNoDisponible: 'La cabaña no está disponible en estas fechas',
  sinParcelas: 'Sin parcelas disponibles para estas fechas.',
  tusDatos: 'Tus datos',
  nombrePlaceholder: 'Nombre y Apellido',
  dniPlaceholder: 'DNI o Pasaporte',
  emailPlaceholder: 'Email',
  telefonoPlaceholder: 'Teléfono',
  alojamiento: 'Alojamiento',
  noches: 'Noches',
  dias: 'Días',
  total: 'Total',
  confirmar: 'Confirmar reserva',
  confirmando: 'Confirmando…',
  confirmadaTitulo: '¡Reserva confirmada!',
  confirmadaTexto: 'Te enviamos los detalles y los datos para transferir a tu email.',
  volverInicio: 'Volver al inicio',
  errorDisponibilidad: 'No pudimos consultar la disponibilidad. Prueba de nuevo.',
  errorReserva: 'No pudimos confirmar la reserva',
  fotoAnterior: 'Foto anterior',
  fotoSiguiente: 'Foto siguiente',
  irAFoto: 'Ir a la foto {n}',
  fotosProximamente: 'Fotos próximamente',
  restar: 'Restar {label}',
  sumar: 'Sumar {label}',
  opcionesPrecio: {},
};

const pt: TextosWidget = {
  pasos: { alojamiento: 'Hospedagem', fechas: 'Datas', datos: 'Seus dados' },
  queReservar: 'O que você quer reservar?',
  unidades: {
    CAMPING: { label: 'Camping', descripcion: 'Monte sua barraca sob a copa da selva.' },
    MOTORHOME: { label: 'Motorhome', descripcion: 'Vaga com luz e água para o seu veículo.' },
    CABANA: { label: 'Cabana', descripcion: 'Conforto com teto em plena natureza.' },
    QUINCHOS: { label: 'Quincho', descripcion: 'Espaço com churrasqueira para o seu grupo.' },
  },
  porNoche: '/ noite',
  porDia: '/ dia',
  porNocheCadaUno: '/ noite cada',
  motorhomeIncluye: 'O valor do motorhome por noite inclui 2 pessoas.',
  acompanantes: 'Acompanhantes',
  capacidadCabana: 'Capacidade máxima de {n} pessoas.',
  quinchosNota: 'A entrada no parque por pessoa não está incluída.',
  continuar: 'Continuar',
  volver: 'Voltar',
  elegiDia: 'Escolha o dia',
  elegiFechas: 'Escolha suas datas',
  fecha: 'Data',
  entrada: 'Entrada',
  salida: 'Saída',
  formatoFecha: 'dd/mm/aaaa',
  rangoInvalido: 'A data de saída deve ser posterior à de entrada.',
  consultando: 'Consultando disponibilidade…',
  hayLugar: 'Há vaga para estas datas',
  sinLugar: 'Sem disponibilidade para estas datas',
  cabanaDisponible: 'A cabana está disponível',
  cabanaNoDisponible: 'A cabana não está disponível nestas datas',
  sinParcelas: 'Sem vagas disponíveis para estas datas.',
  tusDatos: 'Seus dados',
  nombrePlaceholder: 'Nome e sobrenome',
  dniPlaceholder: 'RG, documento ou passaporte',
  emailPlaceholder: 'E-mail',
  telefonoPlaceholder: 'Telefone',
  alojamiento: 'Hospedagem',
  noches: 'Noites',
  dias: 'Dias',
  total: 'Total',
  confirmar: 'Confirmar reserva',
  confirmando: 'Confirmando…',
  confirmadaTitulo: 'Reserva confirmada!',
  confirmadaTexto: 'Enviamos os detalhes e os dados para transferência no seu e-mail.',
  volverInicio: 'Voltar ao início',
  errorDisponibilidad: 'Não conseguimos consultar a disponibilidade. Tente novamente.',
  errorReserva: 'Não conseguimos confirmar a reserva',
  // Claves definidas en sql/003_precios_itemizados.sql.
  fotoAnterior: 'Foto anterior',
  fotoSiguiente: 'Próxima foto',
  irAFoto: 'Ir para a foto {n}',
  fotosProximamente: 'Fotos em breve',
  restar: 'Diminuir {label}',
  sumar: 'Aumentar {label}',
  opcionesPrecio: {
    CHICO_MOTORHOME: 'Motorhome pequeno (van, camper ou similar até 6,50 m)',
    GRANDE_MOTORHOME: 'Motorhome grande (motorhome ou veículo acima de 6,50 m)',
    REMOLQUE: 'Reboque (qualquer tipo de trailer)',
    ACOMPANANTE: 'Acompanhante',
    MENOR: 'Criança (de 3 a 7 anos)',
    MAYOR: 'A partir de 7 anos',
    FIJO: 'Cabana (preço fixo)',
    CHICO_QUINCHOS: 'Quincho pequeno (até 12 pessoas)',
    GRANDE_QUINCHOS: 'Quincho grande (até 25 pessoas)',
    ESPECIAL: 'Quincho especial (até 30 pessoas)',
    COMPARTIDO: 'Quincho compartilhado (até 50 pessoas)',
  },
};

const en: TextosWidget = {
  pasos: { alojamiento: 'Stay type', fechas: 'Dates', datos: 'Your details' },
  queReservar: 'What would you like to book?',
  unidades: {
    CAMPING: { label: 'Camping', descripcion: 'Pitch your tent under the rainforest canopy.' },
    MOTORHOME: {
      label: 'Motorhome',
      descripcion: 'A pitch with power and water for your vehicle.',
    },
    CABANA: { label: 'Cabin', descripcion: 'A roof over your head, deep in nature.' },
    QUINCHOS: { label: 'BBQ area', descripcion: 'A covered space with a barbecue for your group.' },
  },
  porNoche: '/ night',
  porDia: '/ day',
  porNocheCadaUno: '/ night each',
  motorhomeIncluye: 'The nightly motorhome rate includes 2 people.',
  acompanantes: 'Additional guests',
  capacidadCabana: 'Maximum capacity: {n} people.',
  quinchosNota: 'Per-person park admission is not included.',
  continuar: 'Continue',
  volver: 'Back',
  elegiDia: 'Choose your day',
  elegiFechas: 'Choose your dates',
  fecha: 'Date',
  entrada: 'Check-in',
  salida: 'Check-out',
  formatoFecha: 'dd/mm/yyyy',
  rangoInvalido: 'The check-out date must be after the check-in date.',
  consultando: 'Checking availability…',
  hayLugar: 'Available for these dates',
  sinLugar: 'No availability for these dates',
  cabanaDisponible: 'The cabin is available',
  cabanaNoDisponible: 'The cabin is not available on these dates',
  sinParcelas: 'No pitches available for these dates.',
  tusDatos: 'Your details',
  nombrePlaceholder: 'First and last name',
  dniPlaceholder: 'ID or passport number',
  emailPlaceholder: 'Email',
  telefonoPlaceholder: 'Phone',
  alojamiento: 'Stay type',
  noches: 'Nights',
  dias: 'Days',
  total: 'Total',
  confirmar: 'Confirm booking',
  confirmando: 'Confirming…',
  confirmadaTitulo: 'Booking confirmed!',
  confirmadaTexto: 'We have emailed you the details and the bank transfer information.',
  volverInicio: 'Back to home',
  errorDisponibilidad: 'We could not check availability. Please try again.',
  errorReserva: 'We could not confirm the booking',
  fotoAnterior: 'Previous photo',
  fotoSiguiente: 'Next photo',
  irAFoto: 'Go to photo {n}',
  fotosProximamente: 'Photos coming soon',
  restar: 'Decrease {label}',
  sumar: 'Increase {label}',
  opcionesPrecio: {
    CHICO_MOTORHOME: 'Small motorhome (van, camper or similar, up to 6.50 m)',
    GRANDE_MOTORHOME: 'Large motorhome (motorhome or vehicle over 6.50 m)',
    REMOLQUE: 'Trailer (any type)',
    ACOMPANANTE: 'Additional guest',
    MENOR: 'Child (3 to 7 years old)',
    MAYOR: 'Over 7 years old',
    FIJO: 'Cabin (flat rate)',
    CHICO_QUINCHOS: 'Small BBQ area (up to 12 people)',
    GRANDE_QUINCHOS: 'Large BBQ area (up to 25 people)',
    ESPECIAL: 'Special BBQ area (up to 30 people)',
    COMPARTIDO: 'Shared BBQ area (up to 50 people)',
  },
};

export const TEXTOS_WIDGET: Record<Idioma, TextosWidget> = { es, pt, en };
export const TEXTOS_WIDGET_ES = es;

/** Código de locale para formatear la moneda (siempre en ARS). */
export const LOCALE_MONEDA: Record<Idioma, string> = {
  es: 'es-AR',
  pt: 'pt-BR',
  en: 'en-US',
};
