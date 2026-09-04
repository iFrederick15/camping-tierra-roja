// ── Site copy in English ──────────────────────────────────────────────────
//
// Written for international travellers planning a trip to Iguazú Falls, who
// search in English ("camping near Iguazu Falls", "campsite Puerto Iguazu",
// "RV park Iguazu"). Argentine terms that have no clean English equivalent
// (quincho) are kept and glossed the first time they appear.
//
// The shape of this object is validated against `es.ts` (type `Traducciones`).

import type { Traducciones } from './es';

export const en: Traducciones = {
  nav: {
    inicio: 'Home',
    camping: 'Camping',
    motorhome: 'RV & Motorhome',
    cabana: 'Cabin',
    parque: 'Pools',
    ubicacion: 'Location',
    galeria: 'Gallery',
    contacto: 'Contact',
    faq: 'FAQ',
    reservar: 'Book',
    menuAbrir: 'Open menu',
    menuCerrar: 'Close menu',
    navPrincipal: 'Main navigation',
    irAlContenido: 'Skip to main content',
    elegirIdioma: 'Choose language',
    idiomaActual: 'Current language',
  },

  hero: {
    kicker: 'Puerto Iguazú · Misiones · Argentina',
    tituloLinea1: 'Camping & Water Park',
    tituloMarca: 'Tierra Roja',
    subtitulo:
      'Camping pitches, motorhome hook-ups and a cabin for eight in Puerto Iguazú, about 20 minutes from Iguazú National Park. The pools open at the time are included with your stay.',
    ctaPrincipal: 'BOOK NOW',
    ctaSecundario: 'Ask on WhatsApp',
    elegiTuLugar: 'What would you like to book?',
    pruebaSocial: '{promedio} out of 5 on Google · {cantidad} reviews',
    aTiempo: '~20 min from the Falls',
    todoElAno: 'Open all year round',
  },

  alojamientos: {
    camping: { nombre: 'Camping', detalle: 'Your tent in the forest' },
    motorhome: { nombre: 'Motorhome', detalle: 'Pitch with power & water' },
    cabana: { nombre: 'Cabin', detalle: 'Sleeps up to 8' },
  },

  piscinas: {
    kicker: 'Water park',
    titulo: 'The three pools',
    subtitulo: 'Open all year. Access comes with any booking, at no extra charge.',
    incluido: 'Included with camping, motorhome and cabin bookings',
    lista: [
      {
        nombre: 'Main pool',
        descripcion:
          'The largest one, with a water curtain under the pergola, sun loungers and play features.',
        etiqueta: 'Water curtain and pergola',
      },
      {
        nombre: 'Water slides',
        descripcion: 'Three colourful slides with a pool of their own.',
        etiqueta: 'Where the children go',
      },
      {
        nombre: 'Adults-only pool',
        descripcion: 'A waterfall, set apart from the slides. No children.',
        etiqueta: 'Adults only',
      },
    ],
  },

  camping: {
    kicker: 'Where to stay',
    titulo: 'Camping in the rainforest',
    descripcion:
      'A large area among the trees to pitch your tent, with natural shade. Toilets and hot showers, covered barbecue areas and access to all three pools.',
    lista: [
      'Spacious pitches among the trees',
      'Toilets and hot showers',
      'Covered BBQ areas (quinchos)',
      'Pets welcome',
    ],
    cta: 'Book a camping pitch',
    motorhomeTitulo: 'Motorhome & RV area',
    motorhomeDescripcion:
      'Pitches with full water and electricity hook-ups, your own barbecue and 24-hour security for your motorhome or caravan, with access to every facility on site.',
    motorhomeLista: [
      'Water and electricity hook-ups',
      'Private barbecue',
      '24-hour security',
      'Rate includes 2 people',
    ],
    motorhomeCta: 'Book a motorhome pitch',
  },

  cabana: {
    kicker: 'Where to stay',
    titulo: 'Our cabin',
    cita: 'One cabin on the whole site, sleeping up to eight.',
    nombre: 'Cabin',
    capacidad: 'Sleeps up to 8 people',
    amenities: [
      '3 bedrooms',
      'Air conditioning',
      'Wi-Fi included',
      'TV with DirecTV',
      'Access to the pools',
      'Private BBQ area',
    ],
    cta: 'Book the cabin',
  },

  precios: {
    kicker: 'Rates',
    titulo: 'Rates from',
    subtitulo:
      'Reference rates per night. The total depends on your dates and how many people are travelling; the booking form works it out before you confirm.',
    desde: 'From',
    porNoche: '/ night',
    consultar: 'Ask for a rate',
    consultarDetalle: 'Message us on WhatsApp and we will send you the current rate.',
    sinPrecios:
      'We are updating this season’s rates. Ask for the exact price on WhatsApp, or use the booking search: it shows your total before you confirm.',
    notaCamping: 'Per person, per night.',
    notaMotorhome: 'Per vehicle, per night, including 2 people.',
    notaCabana: 'Flat rate per night, up to 8 people.',
    incluye: 'Every stay includes access to all three pools.',
    verDisponibilidad: 'Check availability',
    vigencia: 'Rates valid for: {vigencia}',
  },

  ubicacion: {
    kicker: 'Location',
    titulo: 'Your base for exploring Iguazú',
    subtitulo:
      'Tierra Roja is in Puerto Iguazú, about 20 minutes from Iguazú National Park and from the town centre. Foz do Iguaçu and the Three Borders Landmark are also within reach.',
    minutos: '{minutos} min by car',
    sinConfirmar: 'Ask us about travel time',
    puntos: {
      cataratas: {
        nombre: 'Iguazú Falls',
        detalle: 'Iguazú National Park, Argentine side.',
      },
      centro: {
        nombre: 'Downtown Puerto Iguazú',
        detalle: 'Restaurants, supermarkets and the bus terminal.',
      },
      brasil: {
        nombre: 'Brazilian border',
        detalle: 'Tancredo Neves International Bridge.',
      },
      foz: {
        nombre: 'Foz do Iguaçu',
        detalle: 'The Brazilian side of the Falls and Parque das Aves.',
      },
      aeropuerto: {
        nombre: 'Puerto Iguazú Airport (IGR)',
        detalle: 'Direct flights from Buenos Aires.',
      },
      tresFronteras: {
        nombre: 'Three Borders Landmark',
        detalle: 'The viewpoint over the Paraná and Iguazú rivers.',
      },
    },
    direccionTitulo: 'Getting here',
    comoLlegar: 'Open in Google Maps',
    mapaTitulo: 'Location of Camping Tierra Roja in Puerto Iguazú',
    cta: 'Book my stay',
    atractivos: {
      titulo: 'Every attraction in Iguazú',
      subtitulo:
        'The official Atractivos Iguazú (ACATI) guide lists {total} things to do in and around town. Tierra Roja is number 26 on the map.',
      filtrarPor: 'Filter attractions by category',
      todas: 'All',
      categorias: {
        natural: 'Nature',
        cultural: 'Culture',
        aventura: 'Adventure',
        recreativo: 'Leisure',
        compras: 'Shopping',
      },
      numeroMapa: 'No. {numero} on the map',
      aqui: 'You are here',
      conteo: '{n} attractions shown',
      fuente:
        'Data and logos from the Atractivos Iguazú (ACATI) guide, updated 29/06/2026. Each logo belongs to its operator.',
      verGuia: 'View the official guide',
    },
  },

  resenas: {
    kicker: 'Reviews',
    titulo: 'What our guests say',
    subtitulo: 'Posted on Google by people who stayed here, unedited.',
    promedio: '{promedio} out of 5',
    cantidad: 'based on {cantidad} published reviews',
    estrellas: '{n} out of 5 stars',
    anterior: 'Previous review',
    siguiente: 'Next review',
    irA: 'Go to review {n}',
    fuente: 'Google reviews, shown in the language they were written in.',
    verTodas: 'See the Google profile',
  },

  faq: {
    kicker: 'Before you come',
    titulo: 'Frequently asked questions',
    subtitulo:
      'The things guests ask us most before booking. Still not sure about something? Message us on WhatsApp.',
    ctaTexto: 'Didn’t find your answer?',
    ctaBoton: 'Ask on WhatsApp',
    items: [
      {
        q: 'Where is Camping Tierra Roja?',
        a: 'We are at Barrio Los Yerbales 2000 Ha, Puerto Iguazú, in the province of Misiones, Argentina — a rainforest area a few minutes from the town centre and from the road to the Falls.',
      },
      {
        q: 'Is it close to Iguazú Falls?',
        a: 'Yes. The campsite is about a 20-minute drive from Iguazú National Park (the Argentine side of the Falls) and about 20 minutes from downtown Puerto Iguazú.',
      },
      {
        q: 'Do you accept motorhomes and caravans?',
        a: 'Yes. We have a dedicated motorhome area with full water and electricity hook-ups, a private barbecue and 24-hour security. The nightly rate covers 2 people; additional travellers are added as companions when you book.',
      },
      {
        q: 'Do you have cabins?',
        a: 'Yes, we have one cabin for up to 8 guests, with 3 bedrooms, air conditioning, Wi-Fi, TV with DirecTV, its own covered barbecue area and access to the pools.',
      },
      {
        q: 'Is the water park included?',
        a: 'Yes: guests staying at the campsite, in the motorhome area or in the cabin have access to all three pools. The relaxation pool is an adults-only space, with no access for children.',
      },
      {
        q: 'Can I visit just for the day?',
        a: 'The covered barbecue areas (quinchos) can be booked for day use. [COMPLETAR: confirm whether there is a day pass to the water park without staying overnight, its price and opening hours.]',
      },
      {
        q: 'Can I book online?',
        a: 'Yes. On the booking page you choose your accommodation type and dates and confirm instantly, with no account needed. To secure the booking a deposit is paid by bank transfer within the deadline given in the confirmation email; the balance is paid on arrival.',
      },
      {
        q: 'Are pets allowed?',
        a: 'Yes, pets are welcome as long as the grounds are kept clean. Owners are responsible for picking up and disposing of their pet’s waste.',
      },
      {
        q: 'What does the campsite include?',
        a: 'Spacious pitches among the trees, toilets and hot showers, covered barbecue areas, football and volleyball courts, access to all three pools and a first-aid kit. There is no on-site medical service.',
      },
      {
        q: 'What are the opening hours?',
        a: 'Tierra Roja is open all year round. A stay runs from your arrival day until 10:00 the following morning. Arrivals between 00:00 and 06:00 are charged half a night, valid until 10:00 that same day. Quiet hours across the site run from 00:00 to 07:00.',
      },
      {
        q: 'How do I get here from Brazil or Foz do Iguaçu?',
        a: 'You cross the Tancredo Neves International Bridge into Puerto Iguazú and continue to the campsite. Entering Argentina requires a national ID card or passport. [COMPLETAR: approximate driving time from downtown Foz do Iguaçu and from the border crossing.]',
      },
      {
        q: 'How do I pay?',
        a: 'The deposit is paid by bank transfer, using the details sent in your booking confirmation email. The balance is paid on arrival. [COMPLETAR: confirm which payment methods are accepted at reception — cash in pesos, Brazilian reais, cards.]',
      },
    ],
  },

  ctaFinal: {
    titulo: 'Check availability and book',
    subtitulo:
      'The booking form shows what is free for your dates and the total before you confirm. Or message us on WhatsApp.',
    boton: 'BOOK NOW',
    secundario: 'Check availability on WhatsApp',
    sinRegistro: 'No account needed: your booking is confirmed straight away.',
  },

  footer: {
    descripcion:
      'Camping and water park in Puerto Iguazú, Misiones. Your rainforest base for visiting Iguazú Falls.',
    explorar: 'Explore',
    alojamiento: 'Where to stay',
    informacion: 'Information',
    contacto: 'Contact',
    idioma: 'Language',
    ctaTitulo: 'Coming to Iguazú?',
    ctaTexto: 'Check availability and book in minutes.',
    cta: 'Book now',
    seguinos: 'Follow us',
    derechos: '© {ano} Tierra Roja – Camping & Water Park. Puerto Iguazú, Misiones, Argentina.',
    legalesSoloEs: 'Legal texts and the park rules are available in Spanish.',
    normas: 'Park rules',
    terminos: 'Terms & Conditions',
    privacidad: 'Privacy Policy',
  },

  whatsapp: {
    aria: 'Chat on WhatsApp',
    burbuja: 'Questions? Chat with us',
    cerrarBurbuja: 'Close message',
  },

  galeria: {
    titulo: 'Our',
    tituloDestacado: 'Gallery',
    subtitulo:
      'Photos of the grounds, the pools, the motorhome area, the cabin, the barbecue shelters and the sports pitches.',
    metaTitulo: 'Photo gallery — Camping Tierra Roja, Puerto Iguazú',
    metaDescripcion:
      'Real photos of the campsite, motorhome area, cabin and three pools at Tierra Roja in Puerto Iguazú, near Iguazú Falls.',
    categorias: {
      todas: 'All',
      general: 'The grounds',
      piscinas: 'Pools',
      camping: 'Camping',
      motorhome: 'Motorhome',
      cabanas: 'Cabin',
      quinchos: 'BBQ areas',
      actividades: 'Sports',
    },
    fotos: [
      'Aerial view of Camping Tierra Roja surrounded by the Misiones rainforest, in Puerto Iguazú',
      'Camping pitches among the trees, with natural shade all day',
      'Main pool with a water curtain under the pergola',
      'Cabin for 8 guests with its own covered barbecue area',
      'Motorhome area with plenty of room to manoeuvre',
      'Pool with three colourful water slides for the whole family',
      'Relaxation pool with a waterfall, an adults-only space',
      'Motorhome pitches with water and electricity hook-ups',
      'Individual barbecues in the motorhome area',
      'Covered barbecue area (quincho) for groups',
      'Sports courts on site, surrounded by greenery',
      'Outdoor football pitch',
      'Volleyball court for group games',
    ],
    filtrarPor: 'Filter photos by category',
    ampliar: 'Enlarge photo: {titulo}',
    cerrar: 'Close',
    fotoAnterior: 'Previous photo',
    fotoSiguiente: 'Next photo',
    contador: 'Photo {actual} of {total}',
    sinResultados: 'No photos in this category yet.',
    ctaTitulo: 'Book your spot',
    ctaTexto: 'Camping, motorhome or cabin, with all three pools included.',
    ctaBoton: 'Book now',
  },

  contacto: {
    metaTitulo: 'Contact & directions — Camping Tierra Roja, Puerto Iguazú',
    metaDescripcion:
      'Phone, WhatsApp, email and map for Camping Tierra Roja in Puerto Iguazú, about 20 minutes from Iguazú Falls.',
    tituloDestacado: 'Contact',
    titulo: 'and how to find us',
    intro:
      'Camping Tierra Roja is at {direccion}, about 20 minutes from Iguazú Falls and from downtown Puerto Iguazú. We are open every day of the year. For availability and bookings, message us on WhatsApp or fill in the form and we will reply within 24 hours.',
    formTitulo: 'Send us a message',
    nombre: 'Full name',
    nombrePlaceholder: 'Jane Smith',
    email: 'Email',
    emailPlaceholder: 'jane@example.com',
    tipoConsulta: 'What is it about?',
    opciones: {
      general: 'General information',
      camping: 'Camping',
      motorhome: 'Motorhome',
      parque: 'Water park',
      cabana: 'Cabin',
      quinchos: 'BBQ areas',
    },
    mensaje: 'Message',
    mensajePlaceholder: 'How can we help?',
    enviar: 'Send message',
    enviando: 'Sending…',
    ok: 'Thanks! We got your message and will reply within 24 hours.',
    error: 'We could not send your message. Please try WhatsApp.',
    datosTitulo: 'Contact details',
    ubicacionLabel: 'Address',
    telefonoLabel: 'Phone',
    emailLabel: 'Email',
    whatsappBoton: 'Chat on WhatsApp',
    respuestaRapida: 'We reply on WhatsApp the same day.',
    fotoPie: 'Barrio Los Yerbales, Puerto Iguazú.',
    mapaTitulo: 'Find us on the map',
    mapaTexto: 'About 20 minutes from Iguazú Falls and from the centre of Puerto Iguazú.',
    reservaAtajo: 'Already know your dates?',
    reservaAtajoBoton: 'Book now',
  },

  reservar: {
    metaTitulo: 'Book — Camping Tierra Roja, Puerto Iguazú',
    metaDescripcion:
      'Book online at Camping Tierra Roja, Puerto Iguazú: camping, motorhome, BBQ areas or the cabin. Real availability and instant confirmation.',
    titulo: 'Book your spot',
    subtitulo: 'Pick your dates and confirm straight away. No account needed.',
    beneficios: ['Real availability', 'Instant confirmation', 'No booking fee'],
    queReservarTitulo: 'What you can book',
    queReservar: [
      { titulo: 'Camping', texto: 'tent pitches with access to the pools and the bathrooms.' },
      {
        titulo: 'Motorhome',
        texto:
          'a pitch with full hook-ups and 24-hour security. The nightly rate covers 2 people; add anyone else under “Additional guests” when booking.',
      },
      { titulo: 'BBQ areas', texto: 'covered barbecue areas (quinchos) for day use.' },
      {
        titulo: 'Cabin',
        texto: 'a cabin for up to 8 guests with air conditioning, Wi-Fi and its own BBQ area.',
      },
    ],
    comoFuncionaTitulo: 'How booking works',
    comoFunciona:
      'Choose your accommodation type and dates in the search above and confirm instantly, with no account needed. To secure the booking, a deposit is paid by bank transfer within the deadline given in the confirmation email; the balance is paid on arrival. A stay runs from your arrival until 10:00 the next morning. Full details are in the {terminos} and the {normas}.',
    ayudaTitulo: 'Would you rather we helped?',
    ayudaTexto: 'Message us on WhatsApp and we will put your booking together with you.',
    ayudaBoton: 'Chat on WhatsApp',
  },

  meta: {
    titulo: 'Camping Tierra Roja | Campsite & Water Park in Puerto Iguazú',
    descripcion:
      'Camping, motorhome pitches and a cabin with a water park in Puerto Iguazú, 20 minutes from Iguazú Falls. Three pools, BBQ areas and online booking.',
    ogAlt: 'Aerial view of Tierra Roja campsite and water park in the Misiones rainforest',
    schemaDescripcion:
      'Campsite and water park in Puerto Iguazú, Misiones, about 20 minutes from Iguazú Falls. Tent pitches, a motorhome area with hook-ups, a cabin for 8 people, three pools and covered barbecue areas.',
  },
};
