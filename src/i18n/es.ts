// ── Textos del sitio en español (idioma principal y forma de referencia) ──
//
// Convención de estilo: español neutro / panhispánico (tuteo, sin voseo).
// Ver `cambios-espanol-neutro.md` en la raíz del repo: fue una decisión
// explícita para que el sitio funcione igual para un argentino, un chileno o
// un español. NO reintroducir "reservá / consultá / tenés".
//
// Este objeto define la FORMA que deben cumplir `pt.ts` y `en.ts`
// (`Traducciones = typeof es`), así que si agregas una clave acá, TypeScript
// te va a exigir agregarla también en los otros idiomas.
//
// ⚠️ Los textos marcados con `[COMPLETAR: …]` son placeholders: hay un dato
// del negocio que todavía no está confirmado. Ver el resumen de entrega.

export const es = {
  // ── Navegación ────────────────────────────────────────────────────────
  nav: {
    inicio: 'Inicio',
    camping: 'Camping',
    motorhome: 'Motorhome',
    cabana: 'Cabaña',
    parque: 'Piscinas',
    ubicacion: 'Ubicación',
    galeria: 'Galería',
    contacto: 'Contacto',
    faq: 'Preguntas',
    reservar: 'Reservar',
    menuAbrir: 'Abrir menú',
    menuCerrar: 'Cerrar menú',
    navPrincipal: 'Navegación principal',
    irAlContenido: 'Ir al contenido principal',
    elegirIdioma: 'Elegir idioma',
    idiomaActual: 'Idioma actual',
  },

  // ── Hero ──────────────────────────────────────────────────────────────
  hero: {
    kicker: 'Puerto Iguazú · Misiones · Argentina',
    tituloLinea1: 'Camping y Parque Acuático',
    tituloMarca: 'Tierra Roja',
    subtitulo:
      'Camping, parcelas para motorhome y una cabaña para ocho personas en Puerto Iguazú, a unos 20 minutos del Parque Nacional Iguazú. Las piscinas habilitadas están incluidas en la estadía.',
    ctaPrincipal: 'RESERVAR AHORA',
    ctaSecundario: 'Consultar por WhatsApp',
    elegiTuLugar: '¿Qué quieres reservar?',
    pruebaSocial: '{promedio} de 5 en Google · {cantidad} reseñas',
    aTiempo: 'A ~20 min de las Cataratas',
    todoElAno: 'Abierto todo el año',
  },

  // ── Atajos a los tres tipos de alojamiento ────────────────────────────
  alojamientos: {
    camping: { nombre: 'Camping', detalle: 'Tu carpa bajo la selva' },
    motorhome: { nombre: 'Motorhome', detalle: 'Parcela con luz y agua' },
    cabana: { nombre: 'Cabaña', detalle: 'Hasta 8 personas' },
  },

  // ── Parque acuático ───────────────────────────────────────────────────
  piscinas: {
    kicker: 'Parque acuático',
    titulo: 'Nuestras Piscinas',
    subtitulo: 'Diseñadas para refrescar el alma y encender la diversión.',
    incluido: 'Incluidas en la reserva de camping, motorhome y la cabaña',
    lista: [
      {
        nombre: 'Diversión',
        descripcion:
          'Piscina principal con cortina de agua bajo la pérgola, sillas reclinables y juegos',
        etiqueta: 'Cortina de agua y pérgola',
      },
      {
        nombre: 'Familiar',
        descripcion: 'Tres toboganes de colores para vivir la mejor aventura acuática en familia.',
        etiqueta: 'Aventura Familiar',
      },
      {
        nombre: 'Relax',
        descripcion:
          'Cascada de agua y un ambiente especial para la desconexión total. Un espacio pensado para adultos, sin acceso para niños',
        etiqueta: 'Solo adultos',
      },
    ],
  },

  // ── Camping + Motorhome ───────────────────────────────────────────────
  camping: {
    kicker: 'Alojamiento',
    titulo: 'Camping en la selva',
    descripcion:
      'Zona amplia entre los árboles para armar la carpa, con sombra natural. Baños y duchas con agua caliente, quinchos con parrilla y acceso a las tres piscinas.',
    lista: [
      'Parcelas amplias entre los árboles',
      'Baños y duchas con agua caliente',
      'Quinchos con parrilla',
      'Se aceptan mascotas',
    ],
    cta: 'Reservar camping',
    motorhomeTitulo: 'Espacio motorhome',
    motorhomeDescripcion:
      'Parcelas con conexiones completas de agua y luz, parrilla propia y seguridad 24 hs para tu casa rodante, con acceso a todas las instalaciones del camping.',
    motorhomeLista: [
      'Conexiones de agua y luz',
      'Parrilla individual',
      'Seguridad 24 hs',
      'Incluye 2 personas por noche',
    ],
    motorhomeCta: 'Reservar motorhome',
  },

  // ── Cabaña ────────────────────────────────────────────────────────────
  cabana: {
    kicker: 'Alojamiento',
    titulo: 'Nuestra cabaña',
    cita: 'El confort de un hotel, la esencia de la selva.',
    nombre: 'Cabaña',
    capacidad: 'Capacidad para 8 personas',
    amenities: [
      '3 habitaciones',
      'Aire acondicionado',
      'Wi-Fi incluido',
      'TV con DirecTV',
      'Acceso a las piscinas',
      'Quincho con parrilla',
    ],
    cta: 'Reservar cabaña',
  },

  // ── Precios ───────────────────────────────────────────────────────────
  precios: {
    kicker: 'Tarifas',
    titulo: 'Precios desde',
    subtitulo:
      'Valores de referencia por noche. El total depende de las fechas y de cuántas personas viajan; el buscador lo calcula antes de que confirmes.',
    desde: 'Desde',
    porNoche: '/ noche',
    consultar: 'Consultar precio',
    consultarDetalle: 'Escríbenos por WhatsApp y te pasamos la tarifa vigente.',
    sinPrecios:
      'Estamos actualizando las tarifas de la temporada. Consulta el valor exacto por WhatsApp o directamente en el buscador de reservas: te muestra el total antes de confirmar.',
    notaCamping: 'Por persona y por noche.',
    notaMotorhome: 'Por vehículo y por noche, incluye 2 personas.',
    notaCabana: 'Precio fijo por noche, hasta 8 personas.',
    incluye: 'Todas las estadías incluyen acceso a las tres piscinas.',
    verDisponibilidad: 'Ver disponibilidad',
    vigencia: 'Tarifas vigentes: {vigencia}',
  },

  // ── Ubicación / Iguazú ────────────────────────────────────────────────
  ubicacion: {
    kicker: 'Ubicación',
    titulo: 'Tu base para descubrir Iguazú',
    subtitulo:
      'Tierra Roja está en Puerto Iguazú, a unos 20 minutos del Parque Nacional Iguazú y del centro de la ciudad. Desde el camping también se cruza a Foz do Iguaçu y al Hito Tres Fronteras.',
    minutos: '{minutos} min en auto',
    sinConfirmar: 'Consulta el tiempo de viaje',
    puntos: {
      cataratas: {
        nombre: 'Cataratas del Iguazú',
        detalle: 'El Parque Nacional Iguazú, lado argentino.',
      },
      centro: {
        nombre: 'Centro de Puerto Iguazú',
        detalle: 'Restaurantes, supermercados y terminal de ómnibus.',
      },
      brasil: {
        nombre: 'Frontera con Brasil',
        detalle: 'Paso internacional Tancredo Neves.',
      },
      foz: {
        nombre: 'Foz do Iguaçu',
        detalle: 'Cataratas del lado brasileño y Parque das Aves.',
      },
      aeropuerto: {
        nombre: 'Aeropuerto de Puerto Iguazú (IGR)',
        detalle: 'Vuelos directos desde Buenos Aires.',
      },
      tresFronteras: {
        nombre: 'Hito Tres Fronteras',
        detalle: 'El mirador sobre los ríos Paraná e Iguazú.',
      },
    },
    direccionTitulo: 'Cómo llegar',
    comoLlegar: 'Abrir en Google Maps',
    mapaTitulo: 'Ubicación de Camping Tierra Roja en Puerto Iguazú',
    cta: 'Reservar mi estadía',
    atractivos: {
      titulo: 'Todos los atractivos de Iguazú',
      subtitulo:
        'El descriptivo oficial de Atractivos Iguazú (ACATI) reúne {total} propuestas en la ciudad y sus alrededores. Tierra Roja es el número 26 del mapa.',
      filtrarPor: 'Filtrar atractivos por categoría',
      todas: 'Todos',
      categorias: {
        natural: 'Naturaleza',
        cultural: 'Cultura',
        aventura: 'Aventura',
        recreativo: 'Recreativo',
        compras: 'Compras',
      },
      numeroMapa: 'N.º {numero} del mapa',
      aqui: 'Estás aquí',
      conteo: '{n} atractivos a la vista',
      fuente:
        'Datos y logos del descriptivo Atractivos Iguazú (ACATI), actualizado el 29/06/2026. Cada logo pertenece a su prestador.',
      verGuia: 'Ver la guía oficial',
    },
  },

  // ── Reseñas ───────────────────────────────────────────────────────────
  resenas: {
    kicker: 'Opiniones',
    titulo: 'Lo que dicen nuestros huéspedes',
    subtitulo: 'Publicadas en Google por quienes se alojaron, sin editar.',
    promedio: '{promedio} de 5',
    cantidad: 'según {cantidad} reseñas publicadas',
    estrellas: '{n} de 5 estrellas',
    anterior: 'Reseña anterior',
    siguiente: 'Reseña siguiente',
    irA: 'Ir a la reseña {n}',
    fuente: 'Reseñas de Google, reproducidas en su idioma original.',
    verTodas: 'Ver el perfil en Google',
  },

  // ── FAQ ───────────────────────────────────────────────────────────────
  faq: {
    kicker: 'Antes de venir',
    titulo: 'Preguntas frecuentes',
    subtitulo:
      'Lo que más nos consultan antes de reservar. ¿Te quedó otra duda? Escríbenos por WhatsApp.',
    ctaTexto: '¿No encontraste tu respuesta?',
    ctaBoton: 'Preguntar por WhatsApp',
    items: [
      {
        q: '¿Dónde está Camping Tierra Roja?',
        a: 'Estamos en Barrio Los Yerbales 2000 Ha, Puerto Iguazú, provincia de Misiones, Argentina. Es una zona de selva a pocos minutos del centro de la ciudad y del acceso a las Cataratas.',
      },
      {
        q: '¿Está cerca de las Cataratas del Iguazú?',
        a: 'Sí. El camping está a unos 20 minutos en auto del Parque Nacional Iguazú (lado argentino) y a unos 20 minutos del centro de Puerto Iguazú.',
      },
      {
        q: '¿Aceptan motorhomes y casas rodantes?',
        a: 'Sí. Tenemos un sector exclusivo de parcelas para motorhome con conexiones completas de agua y luz, parrilla individual y seguridad las 24 horas. El valor por noche incluye 2 personas; si viajan más, se suman como acompañantes al reservar.',
      },
      {
        q: '¿Tienen cabañas?',
        a: 'Sí, contamos con una cabaña para hasta 8 personas, con 3 habitaciones, aire acondicionado, Wi-Fi, TV con DirecTV, quincho con parrilla propio y acceso a las piscinas.',
      },
      {
        q: '¿El parque acuático está incluido?',
        a: 'Sí: quienes se alojan en el camping, en el sector motorhome o en la cabaña tienen acceso a las tres piscinas del parque acuático. La piscina de relax es un espacio pensado para adultos, sin acceso para niños.',
      },
      {
        q: '¿Se puede entrar solo por el día?',
        a: 'Los quinchos con parrilla se pueden reservar para pasar el día. [COMPLETAR: confirmar si existe una entrada por día al parque acuático sin alojarse, su precio y su horario.]',
      },
      {
        q: '¿Se puede reservar online?',
        a: 'Sí. En la página de reservas eliges el tipo de alojamiento y las fechas, y confirmas al instante, sin necesidad de registrarte. Para dejar la reserva firme se abona una seña por transferencia dentro del plazo indicado en el correo de confirmación; el saldo se paga al ingresar.',
      },
      {
        q: '¿Aceptan mascotas?',
        a: 'Sí, se aceptan mascotas siempre que se mantenga la limpieza del predio. Los dueños son responsables de recoger y disponer correctamente sus residuos.',
      },
      {
        q: '¿Qué servicios incluye el camping?',
        a: 'Parcelas amplias entre los árboles, baños y duchas con agua caliente, quinchos con parrilla, canchas de fútbol y vóley, acceso a las tres piscinas y botiquín de primeros auxilios. El camping no cuenta con servicio médico.',
      },
      {
        q: '¿Cuáles son los horarios?',
        a: 'Tierra Roja opera todo el año. Una estadía va desde el día de ingreso hasta las 10:00 hs del día siguiente. Los ingresos entre las 00:00 y las 06:00 hs abonan media estadía, válida hasta las 10:00 hs de ese mismo día. El horario de descanso, con silencio en todo el predio, va de 00:00 a 07:00 hs.',
      },
      {
        q: '¿Cómo llego desde Brasil o desde Foz do Iguaçu?',
        a: 'Se cruza por el Puente Internacional Tancredo Neves hasta Puerto Iguazú y desde allí se llega al camping. Para ingresar a la Argentina hace falta documento de identidad, cédula o pasaporte. [COMPLETAR: tiempo de viaje aproximado desde el centro de Foz do Iguaçu y desde el paso fronterizo.]',
      },
      {
        q: '¿Cómo se paga?',
        a: 'La seña se abona por transferencia bancaria, con los datos que llegan en el correo de confirmación de la reserva. El saldo se paga al ingresar al predio. [COMPLETAR: confirmar qué medios de pago se aceptan en recepción — efectivo en pesos, reales, tarjetas.]',
      },
    ],
  },

  // ── Banda CTA de cierre ───────────────────────────────────────────────
  ctaFinal: {
    titulo: 'Ver disponibilidad y reservar',
    subtitulo:
      'El buscador muestra los lugares libres para tus fechas y el total antes de confirmar. Si prefieres, escríbenos por WhatsApp.',
    boton: 'RESERVAR AHORA',
    secundario: 'Consultar disponibilidad por WhatsApp',
    sinRegistro: 'No hace falta registrarse: la reserva se confirma en el momento.',
  },

  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    descripcion:
      'Camping y parque acuático en Puerto Iguazú, Misiones. Tu base en la selva para visitar las Cataratas del Iguazú.',
    explorar: 'Explorar',
    alojamiento: 'Alojamiento',
    informacion: 'Información',
    contacto: 'Contacto',
    idioma: 'Idioma',
    ctaTitulo: '¿Vienes a Iguazú?',
    ctaTexto: 'Consulta disponibilidad y reserva en minutos.',
    cta: 'Reservar ahora',
    seguinos: 'Síguenos en redes',
    derechos:
      '© {ano} Tierra Roja – Camping y Parque Acuático. Puerto Iguazú, Misiones, Argentina.',
    legalesSoloEs: 'Los textos legales y el reglamento están disponibles en español.',
    normas: 'Normas del Parque',
    terminos: 'Términos y Condiciones',
    privacidad: 'Política de Privacidad',
  },

  // ── WhatsApp flotante ─────────────────────────────────────────────────
  whatsapp: {
    aria: 'Consultar por WhatsApp',
    burbuja: '¿Consultas? Escríbenos',
    cerrarBurbuja: 'Cerrar mensaje',
  },

  // ── Página de galería ─────────────────────────────────────────────────
  galeria: {
    titulo: 'Nuestra',
    tituloDestacado: 'Galería',
    subtitulo:
      'Fotos del predio, las piscinas, el sector de motorhome, la cabaña, los quinchos y las canchas.',
    metaTitulo: 'Galería de fotos — Camping Tierra Roja, Puerto Iguazú',
    metaDescripcion:
      'Fotos reales del camping, el sector motorhome, la cabaña y las tres piscinas de Tierra Roja, en Puerto Iguazú, cerca de las Cataratas del Iguazú.',
    categorias: {
      todas: 'Todas',
      general: 'El predio',
      piscinas: 'Piscinas',
      camping: 'Camping',
      motorhome: 'Motorhome',
      cabanas: 'Cabaña',
      quinchos: 'Quinchos',
      actividades: 'Deportes',
    },
    fotos: [
      'Vista aérea del predio de Camping Tierra Roja rodeado de selva misionera, en Puerto Iguazú',
      'Parcelas de camping entre los árboles, con sombra natural todo el día',
      'Piscina principal con cortina de agua bajo la pérgola',
      'Cabaña para 8 personas con quincho y parrilla propios',
      'Sector de motorhome con espacio amplio para maniobrar',
      'Piscina con tres toboganes de colores para toda la familia',
      'Piscina de relax con cascada de agua, espacio para adultos',
      'Parcelas para motorhome con conexiones de agua y luz',
      'Parrillas individuales en el sector de motorhome',
      'Quincho techado con parrilla para reuniones',
      'Canchas deportivas del predio, entre la vegetación',
      'Cancha de fútbol al aire libre',
      'Cancha de vóley para jugar en grupo',
    ],
    filtrarPor: 'Filtrar fotos por categoría',
    ampliar: 'Ampliar foto: {titulo}',
    cerrar: 'Cerrar',
    fotoAnterior: 'Foto anterior',
    fotoSiguiente: 'Foto siguiente',
    contador: 'Foto {actual} de {total}',
    sinResultados: 'No hay fotos en esta categoría todavía.',
    ctaTitulo: 'Reserva tu lugar',
    ctaTexto: 'Camping, motorhome o cabaña, con las tres piscinas incluidas.',
    ctaBoton: 'Reservar ahora',
  },

  // ── Página de contacto ────────────────────────────────────────────────
  contacto: {
    metaTitulo: 'Contacto y cómo llegar — Camping Tierra Roja, Puerto Iguazú',
    metaDescripcion:
      'Teléfono, WhatsApp, email y mapa de Camping Tierra Roja en Puerto Iguazú, a unos 20 minutos de las Cataratas del Iguazú.',
    tituloDestacado: 'Contacto',
    titulo: 'y cómo llegar',
    intro:
      'Camping Tierra Roja está en {direccion}, a unos 20 minutos de las Cataratas del Iguazú y del centro de Puerto Iguazú. Atendemos todos los días del año. Para consultas de disponibilidad y reservas, escríbenos por WhatsApp o completa el formulario y te respondemos dentro de las 24 horas.',
    formTitulo: 'Envíanos tu mensaje',
    nombre: 'Nombre completo',
    nombrePlaceholder: 'Pedro Pérez',
    email: 'Email',
    emailPlaceholder: 'pedro@ejemplo.com',
    tipoConsulta: 'Tipo de consulta',
    opciones: {
      general: 'Información general',
      camping: 'Camping',
      motorhome: 'Motorhome',
      parque: 'Parque acuático',
      cabana: 'Cabaña',
      quinchos: 'Quinchos',
    },
    mensaje: 'Mensaje',
    mensajePlaceholder: '¿Cómo podemos ayudarte?',
    enviar: 'Enviar mensaje',
    enviando: 'Enviando…',
    ok: '¡Listo! Recibimos tu mensaje y te respondemos dentro de las 24 horas.',
    error: 'No pudimos enviar tu mensaje. Prueba por WhatsApp.',
    datosTitulo: 'Datos de contacto',
    ubicacionLabel: 'Ubicación',
    telefonoLabel: 'Teléfono',
    emailLabel: 'Email',
    whatsappBoton: 'Hablar por WhatsApp',
    respuestaRapida: 'Respondemos por WhatsApp en el día.',
    fotoPie: 'Barrio Los Yerbales, Puerto Iguazú.',
    mapaTitulo: 'Encuéntranos en el mapa',
    mapaTexto: 'A unos 20 minutos de las Cataratas del Iguazú y del centro de Puerto Iguazú.',
    reservaAtajo: '¿Ya sabes las fechas?',
    reservaAtajoBoton: 'Reservar ahora',
  },

  // ── Página de reservas (marco alrededor del widget) ───────────────────
  reservar: {
    metaTitulo: 'Reservar — Camping Tierra Roja, Puerto Iguazú',
    metaDescripcion:
      'Reserva online tu lugar en Camping Tierra Roja, Puerto Iguazú: camping, motorhome, quinchos o cabaña. Disponibilidad real y confirmación inmediata.',
    titulo: 'Reserva tu lugar',
    subtitulo: 'Elige las fechas y confirma al instante. No hace falta registrarse.',
    beneficios: ['Disponibilidad real', 'Confirmación inmediata', 'Sin costo de gestión'],
    queReservarTitulo: 'Qué puedes reservar',
    queReservar: [
      {
        titulo: 'Camping',
        texto: 'parcelas para carpa con acceso a las piscinas y a los sanitarios.',
      },
      {
        titulo: 'Motorhome',
        texto:
          'espacio con conexiones completas y seguridad 24 hs. El valor por noche incluye 2 personas; si son más, súmalas en «Acompañantes» al reservar.',
      },
      { titulo: 'Quinchos', texto: 'quinchos con parrilla para pasar el día.' },
      {
        titulo: 'Cabaña',
        texto: 'cabaña para hasta 8 personas con aire acondicionado, Wi-Fi y quincho propio.',
      },
    ],
    comoFuncionaTitulo: 'Cómo funciona la reserva',
    comoFunciona:
      'Elige el tipo de unidad y las fechas en el buscador de arriba y confirma al instante, sin necesidad de registro. Para dejar la reserva firme se abona una seña por transferencia dentro del plazo indicado en el correo de confirmación; el saldo se paga al ingresar. La estadía se cuenta desde el ingreso hasta las 10:00 hs del día siguiente. Puedes ver el detalle completo en los {terminos} y en las {normas}.',
    ayudaTitulo: '¿Prefieres que te ayudemos?',
    ayudaTexto: 'Escríbenos por WhatsApp y armamos tu reserva juntos.',
    ayudaBoton: 'Escribir por WhatsApp',
  },

  // ── Metadatos por defecto ─────────────────────────────────────────────
  meta: {
    titulo: 'Camping Tierra Roja | Camping y Parque Acuático en Puerto Iguazú',
    descripcion:
      'Camping, motorhome y cabaña con parque acuático en Puerto Iguazú, a 20 minutos de las Cataratas del Iguazú. Tres piscinas, quinchos con parrilla y reserva online.',
    ogAlt: 'Vista aérea del camping y parque acuático Tierra Roja en la selva misionera',
    schemaDescripcion:
      'Camping y parque acuático en Puerto Iguazú, Misiones, a unos 20 minutos de las Cataratas del Iguazú. Parcelas de camping, sector motorhome con conexiones, cabaña para 8 personas, tres piscinas y quinchos con parrilla.',
  },
};

export type Traducciones = typeof es;
