// ── Atractivos de Puerto Iguazú ───────────────────────────────────────────
//
// Fuente: el descriptivo y mapa "Atractivos Iguazú" que edita la ACATI
// (Asociación Civil Atractivos Turísticos de Iguazú), actualización del
// 29/06/2026. Cada ficha conserva el número con el que aparece en el mapa
// impreso, así el huésped que tiene el folleto en la mano encuentra lo mismo
// en la web. El número 31 no existe en esa edición del descriptivo.
//
// Tierra Roja es el atractivo N.º 26 del mapa: por eso la ficha propia se
// marca con `nuestro: true` y la sección la destaca en vez de esconderla.
//
// DECISIONES DE CONTENIDO (para no romperlas sin querer):
//
//   • No se copian teléfonos, mails ni sitios de cada prestador. Son datos de
//     terceros que cambian seguido y quedarían desactualizados en silencio;
//     la web enlaza una sola vez a la guía oficial (`GUIA_OFICIAL`), que es
//     la que se mantiene. Si algún día se quieren los enlaces, hay que
//     verificarlos uno por uno contra el folleto vigente.
//   • Los logos salen del mismo descriptivo: se recortaron de la página 1 del
//     PDF oficial y se sirven en WebP desde /images/atractivos (unos 5 KB cada
//     uno). El archivo se llama como el número del mapa: 26.webp es Tierra
//     Roja. Son marcas de cada prestador, se usan para identificar su ficha
//     dentro de la guía; si alguno pide que se saque, se borra el archivo y
//     se marca la ficha con `sinLogo: true` (la tarjeta vuelve al número).
//   • Las categorías son las cinco de la leyenda del mapa. La asignación de
//     cada atractivo se hizo por la actividad que describe su propia ficha.
//   • Las descripciones son un resumen de la ficha del folleto, no texto
//     inventado: si un dato no está en el descriptivo, no está acá.
//
// Los textos viven en este archivo y no en `src/i18n/` a propósito: son 34
// fichas × 3 idiomas de contenido de catálogo, no copy de interfaz, y meterlas
// en los diccionarios los volvería inmanejables. El mismo criterio que
// `src/i18n/reservar-widget.ts`, pero al revés: acá el dato viaja con su
// traducción. Los rótulos de la sección (título, categorías, filtros) sí
// están en `src/i18n/` como todo el resto.

import type { Idioma } from '../i18n/config';

export type CategoriaAtractivo = 'natural' | 'cultural' | 'aventura' | 'recreativo' | 'compras';

export interface Atractivo {
  /** Número con el que figura en el mapa impreso de Atractivos Iguazú. */
  numero: number;
  nombre: string;
  categoria: CategoriaAtractivo;
  descripcion: Record<Idioma, string>;
  /** Tierra Roja: la ficha propia dentro de la guía. */
  nuestro?: boolean;
  /**
   * Sin logo: la tarjeta cae al número del mapa. Se marca acá cuando el
   * folleto no trae logo o cuando el prestador pide que no se publique;
   * hay que borrar además `public/images/atractivos/NN.webp`.
   */
  sinLogo?: boolean;
}

/** Categorías de la leyenda del mapa, con su icono de Material Symbols. */
export const CATEGORIAS_ATRACTIVOS: { id: CategoriaAtractivo; icono: string }[] = [
  { id: 'natural', icono: 'forest' },
  { id: 'cultural', icono: 'museum' },
  { id: 'aventura', icono: 'kayaking' },
  { id: 'recreativo', icono: 'local_activity' },
  { id: 'compras', icono: 'shopping_bag' },
];

export const GUIA_OFICIAL = 'https://www.atractivosiguazu.com';

/**
 * Logo de la ficha, recortado del descriptivo oficial. El archivo lleva el
 * número del mapa con dos dígitos: `/images/atractivos/26.webp` es Tierra Roja.
 */
export function logoDeAtractivo(numero: number): string {
  return `/images/atractivos/${String(numero).padStart(2, '0')}.webp`;
}

export const ATRACTIVOS: Atractivo[] = [
  {
    numero: 1,
    nombre: 'Iguazú Argentina',
    categoria: 'natural',
    descripcion: {
      es: 'Concesionaria del Área Cataratas: Tren Ecológico de la Selva, senderos, gastronomía y los paseos de atardecer y luna llena.',
      pt: 'Concessionária da Área das Cataratas: Trem Ecológico da Selva, trilhas, gastronomia e os passeios de pôr do sol e lua cheia.',
      en: 'Concession operator inside the falls area: jungle eco-train, trails, restaurants and the sunset and full-moon walks.',
    },
  },
  {
    numero: 2,
    nombre: 'Iguazú Jungle',
    categoria: 'aventura',
    descripcion: {
      es: 'Excursiones en lancha bajo los saltos, dentro del Parque Nacional: Gran Aventura y Paseo Ecológico.',
      pt: 'Passeios de lancha sob as quedas, dentro do Parque Nacional: Gran Aventura e Passeio Ecológico.',
      en: 'Boat rides under the falls inside the national park: the Gran Aventura and the Ecological Tour.',
    },
  },
  {
    numero: 3,
    nombre: 'Museo Imágenes de la Selva',
    categoria: 'cultural',
    descripcion: {
      es: 'Esculturas talladas en madera nativa por el artista pionero Rodolfo Allou, sobre la ruta 12 km 5.',
      pt: 'Esculturas talhadas em madeira nativa pelo artista pioneiro Rodolfo Allou, na rodovia 12 km 5.',
      en: 'Sculptures carved in native wood by pioneer artist Rodolfo Allou, on Route 12 at km 5.',
    },
  },
  {
    numero: 4,
    nombre: 'Patrimonio Histórico Municipal',
    categoria: 'cultural',
    descripcion: {
      es: 'Sala de exposición permanente sobre la historia de Puerto Iguazú y las costumbres de sus pioneros.',
      pt: 'Sala de exposição permanente sobre a história de Puerto Iguazú e os costumes de seus pioneiros.',
      en: 'Permanent exhibition on the history of Puerto Iguazú and the customs of its early settlers.',
    },
  },
  {
    numero: 5,
    nombre: 'Fly Park Iguazú',
    categoria: 'aventura',
    descripcion: {
      es: 'Parque aéreo con 72 juegos en altura, tirolesas y una caída libre controlada. Ruta 12 km 4,4.',
      pt: 'Parque aéreo com 72 brinquedos em altura, tirolesas e uma queda livre controlada. Rodovia 12 km 4,4.',
      en: 'Aerial adventure park with 72 high-ropes elements, ziplines and a controlled free fall. Route 12, km 4.4.',
    },
  },
  {
    numero: 6,
    nombre: 'Orquidario del Indio Solitario',
    categoria: 'natural',
    descripcion: {
      es: 'Vivero especializado con 80 variedades de orquídeas.',
      pt: 'Viveiro especializado com 80 variedades de orquídeas.',
      en: 'Specialist nursery with 80 varieties of orchids.',
    },
  },
  {
    numero: 7,
    nombre: 'Balsa Iguazú',
    categoria: 'aventura',
    descripcion: {
      es: 'Balsa que cruza el río Paraná hasta la costa paraguaya, con ruta asfaltada hasta Ciudad del Este.',
      pt: 'Balsa que cruza o rio Paraná até a costa paraguaia, com estrada asfaltada até Ciudad del Este.',
      en: 'Ferry across the Paraná river to the Paraguayan shore, with a paved road on to Ciudad del Este.',
    },
  },
  {
    numero: 8,
    nombre: 'Balsa Aventura',
    categoria: 'aventura',
    descripcion: {
      es: 'Paseos náuticos por el río Iguazú frente al Parque Nacional y a las Tres Fronteras.',
      pt: 'Passeios náuticos pelo rio Iguaçu em frente ao Parque Nacional e às Três Fronteiras.',
      en: 'Boat trips on the Iguazú river along the national park and the three-border area.',
    },
  },
  {
    numero: 9,
    nombre: 'Cruceros Iguazú',
    categoria: 'aventura',
    descripcion: {
      es: 'Catamarán para 300 pasajeros con salidas diurnas y nocturnas, gastronomía y música en vivo.',
      pt: 'Catamarã para 300 passageiros com saídas diurnas e noturnas, gastronomia e música ao vivo.',
      en: 'A 300-passenger catamaran with day and night departures, dining and live music.',
    },
  },
  {
    numero: 10,
    nombre: 'Iguazú Kayak',
    categoria: 'aventura',
    descripcion: {
      es: 'Travesías en kayak por los ríos Iguazú y Paraná con guías, de 8 a 20 h.',
      pt: 'Travessias de caiaque pelos rios Iguaçu e Paraná com guias, das 8h às 20h.',
      en: 'Guided kayak trips on the Iguazú and Paraná rivers, 8 am to 8 pm.',
    },
  },
  {
    numero: 11,
    nombre: 'Casa Museo Marta Schwarz',
    categoria: 'cultural',
    descripcion: {
      es: 'Edificio declarado patrimonio provincial, con el acervo personal de la pionera Marta Schwarz.',
      pt: 'Edifício declarado patrimônio provincial, com o acervo pessoal da pioneira Marta Schwarz.',
      en: 'A provincial heritage building holding the personal archive of pioneer Marta Schwarz.',
    },
  },
  {
    numero: 12,
    nombre: 'Jardín de los Colibríes',
    categoria: 'natural',
    descripcion: {
      es: 'Jardín de avistaje de flora y fauna autóctona, con colibríes en libertad. Se visita con reserva.',
      pt: 'Jardim de observação de flora e fauna nativas, com beija-flores em liberdade. Visita com reserva.',
      en: 'A garden for watching native plants and wildlife, with free-flying hummingbirds. Visits by booking.',
    },
  },
  {
    numero: 13,
    nombre: 'Duty Free Shop Puerto Iguazú',
    categoria: 'compras',
    descripcion: {
      es: 'Paseo de compras temático libre de impuestos, en el piso de frontera de la ruta 12.',
      pt: 'Centro de compras temático livre de impostos, no piso de fronteira da rodovia 12.',
      en: 'Themed tax-free shopping complex at the border crossing on Route 12.',
    },
  },
  {
    numero: 14,
    nombre: "Turismo Mby'a",
    categoria: 'cultural',
    descripcion: {
      es: 'Turismo comunitario en la selva Yriapú: recorridos guaraníes, coros infantiles y feria de artesanos.',
      pt: 'Turismo comunitário na selva Yriapú: percursos guaranis, coros infantis e feira de artesãos.',
      en: 'Community tourism in the Yriapú forest: Guaraní-led walks, children’s choirs and a craft fair.',
    },
  },
  {
    numero: 15,
    nombre: 'Cabalgata Ecológica del Indio Solitario',
    categoria: 'aventura',
    descripcion: {
      es: 'Escuela de manejo de caballos y cabalgatas por la selva, en la ruta 12 km 4,5.',
      pt: 'Escola de manejo de cavalos e cavalgadas pela selva, na rodovia 12 km 4,5.',
      en: 'Horsemanship school and guided rides through the jungle, on Route 12 at km 4.5.',
    },
  },
  {
    numero: 16,
    nombre: 'Yerba Mate Club',
    categoria: 'compras',
    descripcion: {
      es: 'Matebar y tienda especializada en yerba, con degustaciones y catas. Entrada libre, todos los días.',
      pt: 'Matebar e loja especializada em erva-mate, com degustações. Entrada gratuita, todos os dias.',
      en: 'Mate bar and specialist shop with tastings. Free entry, open daily.',
    },
  },
  {
    numero: 17,
    nombre: "La Aldea Fortín M'Bororé",
    categoria: 'cultural',
    descripcion: {
      es: 'Aldea guaraní que muestra la historia y las costumbres de una cultura milenaria, con feria de artesanías.',
      pt: 'Aldeia guarani que mostra a história e os costumes de uma cultura milenar, com feira de artesanato.',
      en: 'A Guaraní village showing the history and customs of a millennia-old culture, with a craft fair.',
    },
  },
  {
    numero: 18,
    nombre: 'La Aripuca',
    categoria: 'cultural',
    descripcion: {
      es: 'Gran construcción de madera recuperada en homenaje a la selva misionera, con artesanías y restaurante.',
      pt: 'Grande construção de madeira recuperada em homenagem à selva missioneira, com artesanato e restaurante.',
      en: 'A huge structure built from reclaimed timber in tribute to the Misiones rainforest, with crafts and a restaurant.',
    },
  },
  {
    numero: 19,
    nombre: 'Jardín Botánico Panambí',
    categoria: 'natural',
    descripcion: {
      es: 'Senderos en la Mata Atlántica con flora regional, laguna de aves y mariposario. De 9 a 17.30 h.',
      pt: 'Trilhas na Mata Atlântica com flora regional, lagoa de aves e borboletário. Das 9h às 17h30.',
      en: 'Atlantic-forest trails with regional flora, a bird lagoon and a butterfly house. 9 am to 5.30 pm.',
    },
  },
  {
    numero: 20,
    nombre: 'Yabuticaba Mercado de la Selva',
    categoria: 'compras',
    descripcion: {
      es: 'Mercado gourmet con productos locales, restaurante, cervecería, pizzería y heladería. De 16 a 24 h.',
      pt: 'Mercado gourmet com produtos locais, restaurante, cervejaria, pizzaria e sorveteria. Das 16h às 24h.',
      en: 'Gourmet market with local produce, restaurant, brewery, pizzeria and ice-cream shop. 4 pm to midnight.',
    },
  },
  {
    numero: 21,
    nombre: 'Ice Bar Iguazú',
    categoria: 'recreativo',
    descripcion: {
      es: 'Bar de hielo en plena selva: del calor de afuera al clima helado del interior. Ruta 12 km 4,5.',
      pt: 'Bar de gelo em plena selva: do calor de fora ao clima gelado de dentro. Rodovia 12 km 4,5.',
      en: 'An ice bar in the middle of the jungle: from the outside heat to a sub-zero room. Route 12, km 4.5.',
    },
  },
  {
    numero: 22,
    nombre: 'La Casa de Botellas',
    categoria: 'cultural',
    descripcion: {
      es: 'Casa construida con envases reciclados, una técnica única en el mundo. De 9 a 18.30 h.',
      pt: 'Casa construída com embalagens recicladas, técnica única no mundo. Das 9h às 18h30.',
      en: 'A house built from recycled packaging, a technique unique in the world. 9 am to 6.30 pm.',
    },
  },
  {
    numero: 23,
    nombre: 'Güirá Oga',
    categoria: 'natural',
    descripcion: {
      es: 'Centro de rescate y rehabilitación de fauna silvestre, en la ruta 12 km 5.',
      pt: 'Centro de resgate e reabilitação de fauna silvestre, na rodovia 12 km 5.',
      en: 'Wildlife rescue and rehabilitation centre, on Route 12 at km 5.',
    },
  },
  {
    numero: 24,
    nombre: 'Jungle Fly',
    categoria: 'aventura',
    descripcion: {
      es: 'Rappel, canopy, puente colgante y caminatas entre arroyos y cascadas de la selva.',
      pt: 'Rapel, canopy, ponte suspensa e caminhadas entre córregos e cachoeiras da selva.',
      en: 'Abseiling, canopy tours, a hanging bridge and walks among jungle streams and waterfalls.',
    },
  },
  {
    numero: 25,
    nombre: 'Museo Guaraní',
    categoria: 'cultural',
    descripcion: {
      es: 'Objetos de la cultura guaraní y de las misiones jesuíticas, con una proyección panorámica.',
      pt: 'Objetos da cultura guarani e das missões jesuíticas, com uma projeção panorâmica.',
      en: 'Guaraní and Jesuit-mission artefacts, with a panoramic film about the 17th and 18th centuries.',
    },
  },
  {
    numero: 26,
    nombre: 'Tierra Roja Parque Acuático',
    categoria: 'recreativo',
    nuestro: true,
    descripcion: {
      es: 'Somos nosotros: piscinas con toboganes, quinchos y parrillas, canchas, camping, motorhome y cabaña.',
      pt: 'Somos nós: piscinas com toboáguas, quinchos e churrasqueiras, quadras, camping, motorhome e cabana.',
      en: 'That’s us: pools with slides, barbecue shelters, sports courts, camping, motorhome sites and a cabin.',
    },
  },
  {
    numero: 27,
    nombre: 'Iguazú Bike Tours',
    categoria: 'aventura',
    descripcion: {
      es: 'Salidas guiadas en bicicleta por la región de las Cataratas, con guías profesionales.',
      pt: 'Saídas guiadas de bicicleta pela região das Cataratas, com guias profissionais.',
      en: 'Guided bike rides around the falls region with professional guides.',
    },
  },
  {
    numero: 28,
    nombre: 'Hi Bike',
    categoria: 'aventura',
    descripcion: {
      es: 'Alquiler de bicicletas, también eléctricas, con circuitos libres o guiados y entrega en el alojamiento.',
      pt: 'Aluguel de bicicletas, inclusive elétricas, com circuitos livres ou guiados e entrega na hospedagem.',
      en: 'Bike hire, e-bikes included, with self-guided or guided routes and delivery to your lodging.',
    },
  },
  {
    numero: 29,
    nombre: 'Beer Tour Holy',
    categoria: 'recreativo',
    descripcion: {
      es: 'Visita a la fábrica de cerveza Holy con degustación; dura unos 50 minutos.',
      pt: 'Visita à fábrica de cerveja Holy com degustação; dura cerca de 50 minutos.',
      en: 'A tour of the Holy brewery with tasting; about 50 minutes.',
    },
  },
  {
    numero: 30,
    nombre: 'City Center Iguazú',
    categoria: 'recreativo',
    descripcion: {
      es: 'Centro de entretenimiento con slots, resto bar y música en vivo, a pasos de la aduana. Desde las 10 h.',
      pt: 'Centro de entretenimento com slots, resto bar e música ao vivo, a poucos passos da aduana. A partir das 10h.',
      en: 'Entertainment centre with slots, a resto-bar and live music, steps from customs. From 10 am.',
    },
  },
  {
    numero: 32,
    nombre: 'Madero Tango',
    categoria: 'recreativo',
    descripcion: {
      es: 'Cena de gastronomía argentina y show de tango y folklore, de martes a domingo de 19.30 a 23.30 h.',
      pt: 'Jantar de gastronomia argentina e show de tango e folclore, de terça a domingo, das 19h30 às 23h30.',
      en: 'Argentine dinner with a tango and folk show, Tuesday to Sunday, 7.30 pm to 11.30 pm.',
    },
  },
  {
    numero: 33,
    nombre: 'Tirolesa Iguazú',
    categoria: 'aventura',
    descripcion: {
      es: 'Dos tramos de tirolesa a 10 m de altura y casi 200 m de largo, con rappel aéreo asistido y transporte.',
      pt: 'Dois trechos de tirolesa a 10 m de altura e quase 200 m, com rapel aéreo assistido e transporte.',
      en: 'Two zipline sections 10 m up and nearly 200 m long, with assisted aerial abseiling and transfers.',
    },
  },
  {
    numero: 34,
    nombre: 'Monte Nayib',
    categoria: 'natural',
    descripcion: {
      es: 'Senderos y paisajes del monte misionero, en un predio de 2.000 hectáreas. Horarios a coordinar.',
      pt: 'Trilhas e paisagens do mato missioneiro, numa área de 2.000 hectares. Horários a combinar.',
      en: 'Trails and landscapes of the Misiones bush across 2,000 hectares. Visiting hours by arrangement.',
    },
  },
  {
    numero: 35,
    nombre: 'Iguazú Drift',
    categoria: 'aventura',
    descripcion: {
      es: 'Navegación guiada en canoa por el río Iguazú, con clases para quienes no tienen experiencia.',
      pt: 'Navegação guiada de canoa pelo rio Iguaçu, com aulas para quem não tem experiência.',
      en: 'Guided canoe trips on the Iguazú river, with lessons for first-timers.',
    },
  },
];
