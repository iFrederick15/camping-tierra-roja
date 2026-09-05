// ── Textos do site em português (pt-BR) ───────────────────────────────────
//
// O público brasileiro é o segundo maior para Puerto Iguazú: chega de carro
// por Foz do Iguaçu e pesquisa em português ("camping em Puerto Iguazú",
// "camping perto das Cataratas", "motorhome em Puerto Iguazú"). Por isso a
// versão em português não é uma tradução literal: fala de Foz, da fronteira
// e do lado argentino das Cataratas.
//
// A forma deste objeto é validada contra `es.ts` (tipo `Traducciones`).

import type { Traducciones } from './es';

export const pt: Traducciones = {
  nav: {
    inicio: 'Início',
    camping: 'Camping',
    motorhome: 'Motorhome',
    cabana: 'Cabana',
    parque: 'Piscinas',
    ubicacion: 'Localização',
    galeria: 'Galeria',
    contacto: 'Contato',
    faq: 'Dúvidas',
    reservar: 'Reservar',
    menuAbrir: 'Abrir menu',
    menuCerrar: 'Fechar menu',
    navPrincipal: 'Navegação principal',
    irAlContenido: 'Ir para o conteúdo principal',
    elegirIdioma: 'Escolher idioma',
    idiomaActual: 'Idioma atual',
  },

  hero: {
    kicker: 'Puerto Iguazú · Misiones · Argentina',
    tituloLinea1: 'Camping e Parque Aquático',
    tituloMarca: 'Tierra Roja',
    subtitulo:
      'Camping, vagas para motorhome e uma cabana para oito pessoas em Puerto Iguazú, a cerca de 20 minutos do Parque Nacional Iguazú. As piscinas habilitadas estão incluídas na hospedagem.',
    ctaPrincipal: 'RESERVAR AGORA',
    ctaSecundario: 'Falar no WhatsApp',
    elegiTuLugar: 'O que você quer reservar?',
    pruebaSocial: '{promedio} de 5 no Google · {cantidad} avaliações',
    aTiempo: 'A ~20 min das Cataratas',
    todoElAno: 'Aberto o ano todo',
  },

  alojamientos: {
    camping: { nombre: 'Camping', detalle: 'Sua barraca na selva' },
    motorhome: { nombre: 'Motorhome', detalle: 'Vaga com água e luz' },
    cabana: { nombre: 'Cabana', detalle: 'Até 8 pessoas' },
  },

  piscinas: {
    kicker: 'Parque aquático',
    titulo: 'As três piscinas',
    subtitulo: 'Abertas o ano todo. O acesso entra com qualquer hospedagem, não se paga à parte.',
    incluido: 'Incluídas no camping, no motorhome e na cabana',
    lista: [
      {
        nombre: 'Piscina principal',
        descripcion:
          'A maior delas, com cortina de água sob a pérgola, espreguiçadeiras e brinquedos.',
        etiqueta: 'Cortina de água e pérgola',
      },
      {
        nombre: 'Toboáguas',
        descripcion: 'Três toboáguas coloridos sobre a própria piscina.',
        etiqueta: 'Área das crianças',
      },
      {
        nombre: 'Piscina de adultos',
        descripcion: 'Com cascata, afastada da área dos toboáguas. Sem acesso para crianças.',
        etiqueta: 'Somente adultos',
      },
    ],
  },

  camping: {
    kicker: 'Hospedagem',
    titulo: 'Camping na selva',
    descripcion:
      'Área ampla entre as árvores para montar a barraca, com sombra natural. Banheiros e chuveiros com água quente, quinchos com churrasqueira e acesso às três piscinas.',
    lista: [
      'Vagas amplas entre as árvores',
      'Banheiros e chuveiros com água quente',
      'Quinchos com churrasqueira',
      'Aceitamos pets',
    ],
    cta: 'Reservar camping',
    motorhomeTitulo: 'Área para motorhome',
    motorhomeDescripcion:
      'Vagas com ligação completa de água e luz, churrasqueira individual e segurança 24 h para o seu motorhome ou trailer, com acesso a toda a estrutura do camping.',
    motorhomeLista: [
      'Ligação de água e luz',
      'Churrasqueira individual',
      'Segurança 24 horas',
      'Inclui 2 pessoas por noite',
    ],
    motorhomeCta: 'Reservar motorhome',
  },

  cabana: {
    kicker: 'Hospedagem',
    titulo: 'Nossa cabana',
    cita: 'Uma única cabana em todo o camping, para até oito pessoas.',
    nombre: 'Cabana',
    capacidad: 'Capacidade para 8 pessoas',
    amenities: [
      '3 quartos',
      'Ar-condicionado',
      'Wi-Fi incluído',
      'TV com DirecTV',
      'Acesso às piscinas',
      'Quincho com churrasqueira',
    ],
    cta: 'Reservar cabana',
  },

  precios: {
    kicker: 'Tarifas',
    titulo: 'Preços a partir de',
    subtitulo:
      'Valores de referência por noite. O total depende das datas e de quantas pessoas viajam; o buscador calcula antes de você confirmar.',
    desde: 'A partir de',
    porNoche: '/ noite',
    consultar: 'Consultar preço',
    consultarDetalle: 'Fale com a gente no WhatsApp e passamos a tarifa atual.',
    sinPrecios:
      'Estamos atualizando as tarifas da temporada. Consulte o valor exato no WhatsApp ou direto no buscador de reservas: ele mostra o total antes de confirmar.',
    notaCamping: 'Por pessoa e por noite.',
    notaMotorhome: 'Por veículo e por noite, inclui 2 pessoas.',
    notaCabana: 'Preço fixo por noite, até 8 pessoas.',
    incluye: 'Todas as hospedagens incluem acesso às três piscinas.',
    verDisponibilidad: 'Ver disponibilidade',
    vigencia: 'Tarifas vigentes: {vigencia}',
  },

  ubicacion: {
    kicker: 'Localização',
    titulo: 'Sua base para descobrir Iguaçu',
    subtitulo:
      'O Tierra Roja fica em Puerto Iguazú, a cerca de 20 minutos do Parque Nacional Iguazú e do centro da cidade. Do camping também se chega a Foz do Iguaçu e ao Marco das Três Fronteiras.',
    minutos: '{minutos} min de carro',
    sinConfirmar: 'Consulte o tempo de viagem',
    puntos: {
      cataratas: {
        nombre: 'Cataratas do Iguaçu',
        detalle: 'Parque Nacional Iguazú, lado argentino.',
      },
      centro: {
        nombre: 'Centro de Puerto Iguazú',
        detalle: 'Restaurantes, supermercados e rodoviária.',
      },
      brasil: {
        nombre: 'Fronteira com o Brasil',
        detalle: 'Ponte Internacional Tancredo Neves.',
      },
      foz: {
        nombre: 'Foz do Iguaçu',
        detalle: 'Cataratas do lado brasileiro e Parque das Aves.',
      },
      aeropuerto: {
        nombre: 'Aeroporto de Puerto Iguazú (IGR)',
        detalle: 'Voos diretos de Buenos Aires.',
      },
      tresFronteras: {
        nombre: 'Marco das Três Fronteiras',
        detalle: 'O mirante sobre os rios Paraná e Iguaçu.',
      },
    },
    direccionTitulo: 'Como chegar',
    comoLlegar: 'Abrir no Google Maps',
    mapaTitulo: 'Localização do Camping Tierra Roja em Puerto Iguazú',
    cta: 'Reservar minha hospedagem',
    atractivos: {
      listaEtiqueta: 'Distâncias e atrativos de Iguaçu',
      categorias: {
        natural: 'Natureza',
        cultural: 'Cultura',
        aventura: 'Aventura',
        recreativo: 'Lazer',
        compras: 'Compras',
      },
      numeroMapa: 'N.º {numero} do mapa',
      sitioWeb: 'Site',
      abreSitio: 'Abrir o site de {nombre} em uma nova aba',
      aqui: 'Você está aqui',
      verTodos: 'Ver os {total} atrativos de Iguaçu',
      verTodosDetalle:
        'O guia completo de Puerto Iguazú: as fichas do descritivo oficial e o mapa da cidade para ver e baixar.',
    },
  },

  resenas: {
    kicker: 'Avaliações',
    titulo: 'O que dizem nossos hóspedes',
    subtitulo: 'Publicadas no Google por quem se hospedou, sem edição.',
    promedio: '{promedio} de 5',
    cantidad: 'com base em {cantidad} avaliações publicadas',
    estrellas: '{n} de 5 estrelas',
    anterior: 'Avaliação anterior',
    siguiente: 'Próxima avaliação',
    irA: 'Ir para a avaliação {n}',
    fuente: 'Avaliações do Google, reproduzidas no idioma original.',
    verTodas: 'Ver o perfil no Google',
  },

  faq: {
    kicker: 'Antes de vir',
    titulo: 'Perguntas frequentes',
    subtitulo:
      'O que mais nos perguntam antes de reservar. Ficou outra dúvida? Fale com a gente no WhatsApp.',
    ctaTexto: 'Não encontrou sua resposta?',
    ctaBoton: 'Perguntar no WhatsApp',
    items: [
      {
        q: 'Onde fica o Camping Tierra Roja?',
        a: 'Ficamos no Barrio Los Yerbales 2000 Ha, em Puerto Iguazú, província de Misiones, Argentina. É uma área de selva a poucos minutos do centro da cidade e do acesso às Cataratas.',
      },
      {
        q: 'O camping fica perto das Cataratas do Iguaçu?',
        a: 'Sim. O camping fica a cerca de 20 minutos de carro do Parque Nacional Iguazú (lado argentino) e a cerca de 20 minutos do centro de Puerto Iguazú.',
      },
      {
        q: 'Aceitam motorhome e trailer?',
        a: 'Sim. Temos uma área exclusiva de vagas para motorhome com ligação completa de água e luz, churrasqueira individual e segurança 24 horas. O valor por noite inclui 2 pessoas; se forem mais, elas são adicionadas como acompanhantes na hora de reservar.',
      },
      {
        q: 'Vocês têm cabanas?',
        a: 'Sim, temos uma cabana para até 8 pessoas, com 3 quartos, ar-condicionado, Wi-Fi, TV com DirecTV, quincho com churrasqueira próprio e acesso às piscinas.',
      },
      {
        q: 'O parque aquático está incluído?',
        a: 'Sim: quem se hospeda no camping, na área de motorhome ou na cabana tem acesso às três piscinas do parque aquático. A piscina de relaxamento é um espaço pensado para adultos, sem acesso para crianças.',
      },
      {
        q: 'Dá para entrar só por um dia?',
        a: 'Sim. Você pode pagar a entrada do camping para passar o dia, usar as churrasqueiras e ter acesso às piscinas habilitadas. Caso queira um quincho, é preciso reservá-lo pelo botão "Reservar".',
      },
      {
        q: 'Dá para reservar online?',
        a: 'Sim. Na página de reservas você escolhe o tipo de hospedagem e as datas e confirma na hora, sem precisar criar cadastro. Para garantir a reserva é paga uma entrada por transferência dentro do prazo indicado no e-mail de confirmação; o saldo é pago na chegada.',
      },
      {
        q: 'Aceitam pets?',
        a: 'Sim, aceitamos animais de estimação desde que a limpeza do local seja mantida. Os tutores são responsáveis por recolher e descartar corretamente os resíduos.',
      },
      {
        q: 'Quais serviços o camping oferece?',
        a: 'Vagas amplas entre as árvores, banheiros e chuveiros com água quente, quinchos com churrasqueira, quadras de futebol e vôlei, acesso às três piscinas e kit de primeiros socorros. O camping não conta com serviço médico.',
      },
      {
        q: 'Quais são os horários?',
        a: 'O Tierra Roja funciona o ano todo. Uma diária vai do dia da entrada até as 10h do dia seguinte. Entradas entre 00h e 06h pagam meia diária, válida até as 10h do mesmo dia. O horário de silêncio em todo o camping vai das 00h às 07h.',
      },
      {
        q: 'Como chegar do Brasil ou de Foz do Iguaçu?',
        a: 'A travessia é pela Ponte Internacional Tancredo Neves até Puerto Iguazú, e de lá se chega ao camping. Para entrar na Argentina é preciso documento de identidade (RG), cédula ou passaporte.',
      },
      {
        q: 'Como é feito o pagamento?',
        a: 'A reserva é paga por transferência bancária, com os dados que chegam no e-mail de confirmação da reserva.',
      },
    ],
  },

  ctaFinal: {
    titulo: 'Ver disponibilidade e reservar',
    subtitulo:
      'O buscador mostra as vagas livres para as suas datas e o total antes de você confirmar. Se preferir, fale com a gente no WhatsApp.',
    boton: 'RESERVAR AGORA',
    secundario: 'Consultar disponibilidade no WhatsApp',
    sinRegistro: 'Não é preciso cadastro: a reserva é confirmada na hora.',
  },

  footer: {
    descripcion:
      'Camping e parque aquático em Puerto Iguazú, Misiones. Sua base na selva para visitar as Cataratas do Iguaçu.',
    explorar: 'Explorar',
    alojamiento: 'Hospedagem',
    informacion: 'Informações',
    contacto: 'Contato',
    idioma: 'Idioma',
    ctaTitulo: 'Vem para Iguaçu?',
    ctaTexto: 'Consulte a disponibilidade e reserve em minutos.',
    cta: 'Reservar agora',
    seguinos: 'Siga a gente',
    derechos:
      '© {ano} Tierra Roja – Camping e Parque Aquático. Puerto Iguazú, Misiones, Argentina.',
    legalesSoloEs: 'Os textos legais e o regulamento estão disponíveis em espanhol.',
    normas: 'Regulamento do parque',
    terminos: 'Termos e Condições',
    privacidad: 'Política de Privacidade',
  },

  whatsapp: {
    aria: 'Falar no WhatsApp',
    burbuja: 'Dúvidas? Fale com a gente',
    cerrarBurbuja: 'Fechar mensagem',
  },

  atractivos: {
    metaTitulo: 'O que fazer em Puerto Iguazú — Guia de atrativos | Tierra Roja',
    metaDescripcion:
      'Os {total} atrativos de Puerto Iguazú do descritivo oficial Atractivos Iguazú (ACATI), com o mapa da cidade para ver e baixar. O Camping Tierra Roja é o número 26 do mapa.',
    kicker: 'Guia de Iguaçu',
    titulo: 'O que fazer em',
    tituloDestacado: 'Puerto Iguazú',
    intro:
      'Cataratas, selva, aventura e compras: isto é tudo o que há para fazer em volta do camping, tal como aparece no descritivo oficial da cidade. O Tierra Roja é o número 26 do mapa, então daqui você tem cada atrativo à mão.',
    filtrarPor: 'Filtrar atrativos por categoria',
    todas: 'Todos',
    contador: '{cantidad} atrativos',
    sinResultados: 'Não há atrativos nesta categoria.',
    folletoTitulo: 'O folheto oficial',
    folletoTexto:
      'As duas faces do descritivo impresso que a cidade distribui: as fichas dos prestadores e o mapa com a localização de cada um. Baixe antes de viajar e leve no celular.',
    paginas: {
      descriptivo: 'Descritivo de atrativos',
      mapa: 'Mapa de Puerto Iguazú',
    },
    verGrande: 'Ver em tamanho completo',
    descargarPdf: 'Baixar o folheto (PDF)',
    verGuia: 'Ver o guia oficial',
    fuente:
      'Descritivo e mapa Atractivos Iguazú, editado pela ACATI (Asociación Civil Atractivos Turísticos de Iguazú), atualização de {edicion}. Reproduzido como guia para nossos hóspedes; cada logo e cada serviço pertencem ao seu prestador.',
    volver: 'Voltar à localização',
    ctaTitulo: 'Sua base para conhecer tudo isso',
    ctaTexto: 'Camping, motorhome ou chalé a 20 minutos das Cataratas, com as piscinas incluídas.',
    ctaBoton: 'Reservar agora',
  },

  galeria: {
    titulo: 'Nossa',
    tituloDestacado: 'Galeria',
    subtitulo:
      'Fotos do camping, das piscinas, da área de motorhome, da cabana, dos quinchos e das quadras.',
    metaTitulo: 'Galeria de fotos — Camping Tierra Roja, Puerto Iguazú',
    metaDescripcion:
      'Fotos reais do camping, da área de motorhome, da cabana e das três piscinas do Tierra Roja, em Puerto Iguazú, perto das Cataratas do Iguaçu.',
    categorias: {
      todas: 'Todas',
      general: 'O camping',
      piscinas: 'Piscinas',
      camping: 'Camping',
      motorhome: 'Motorhome',
      cabanas: 'Cabana',
      quinchos: 'Quinchos',
      actividades: 'Esportes',
    },
    fotos: [
      'Vista aérea do Camping Tierra Roja cercado pela selva missioneira, em Puerto Iguazú',
      'Vagas de camping entre as árvores, com sombra natural o dia todo',
      'Piscina principal com cortina de água sob a pérgola',
      'Cabana para 8 pessoas com quincho e churrasqueira próprios',
      'Área de motorhome com espaço amplo para manobrar',
      'Piscina com três toboáguas coloridos para a família toda',
      'Piscina de relaxamento com cascata, espaço para adultos',
      'Vagas para motorhome com ligação de água e luz',
      'Churrasqueiras individuais na área de motorhome',
      'Quincho coberto com churrasqueira para grupos',
      'Quadras esportivas do camping, entre a vegetação',
      'Campo de futebol ao ar livre',
      'Quadra de vôlei para jogar em grupo',
    ],
    filtrarPor: 'Filtrar fotos por categoria',
    ampliar: 'Ampliar foto: {titulo}',
    cerrar: 'Fechar',
    fotoAnterior: 'Foto anterior',
    fotoSiguiente: 'Próxima foto',
    contador: 'Foto {actual} de {total}',
    sinResultados: 'Ainda não há fotos nesta categoria.',
    ctaTitulo: 'Reserve o seu lugar',
    ctaTexto: 'Camping, motorhome ou cabana, com as três piscinas incluídas.',
    ctaBoton: 'Reservar agora',
  },

  contacto: {
    metaTitulo: 'Contato e como chegar — Camping Tierra Roja, Puerto Iguazú',
    metaDescripcion:
      'Telefone, WhatsApp, e-mail e mapa do Camping Tierra Roja em Puerto Iguazú, a cerca de 20 minutos das Cataratas do Iguaçu.',
    tituloDestacado: 'Contato',
    titulo: 'e como chegar',
    intro:
      'O Camping Tierra Roja fica em {direccion}, a cerca de 20 minutos das Cataratas do Iguaçu e do centro de Puerto Iguazú. Atendemos todos os dias do ano. Para consultar disponibilidade e reservar, fale com a gente no WhatsApp ou preencha o formulário: respondemos em até 24 horas.',
    formTitulo: 'Envie sua mensagem',
    nombre: 'Nome completo',
    nombrePlaceholder: 'João Silva',
    email: 'E-mail',
    emailPlaceholder: 'joao@exemplo.com',
    tipoConsulta: 'Tipo de consulta',
    opciones: {
      general: 'Informações gerais',
      camping: 'Camping',
      motorhome: 'Motorhome',
      parque: 'Parque aquático',
      cabana: 'Cabana',
      quinchos: 'Quinchos',
    },
    mensaje: 'Mensagem',
    mensajePlaceholder: 'Como podemos ajudar?',
    enviar: 'Enviar mensagem',
    enviando: 'Enviando…',
    ok: 'Pronto! Recebemos sua mensagem e respondemos em até 24 horas.',
    error: 'Não conseguimos enviar sua mensagem. Tente pelo WhatsApp.',
    datosTitulo: 'Dados de contato',
    ubicacionLabel: 'Localização',
    telefonoLabel: 'Telefone',
    emailLabel: 'E-mail',
    whatsappBoton: 'Falar no WhatsApp',
    respuestaRapida: 'Respondemos no WhatsApp no mesmo dia.',
    fotoPie: 'Barrio Los Yerbales, Puerto Iguazú.',
    mapaTitulo: 'Encontre-nos no mapa',
    mapaTexto: 'A cerca de 20 minutos das Cataratas do Iguaçu e do centro de Puerto Iguazú.',
    reservaAtajo: 'Já sabe as datas?',
    reservaAtajoBoton: 'Reservar agora',
  },

  reservar: {
    metaTitulo: 'Reservar — Camping Tierra Roja, Puerto Iguazú',
    metaDescripcion:
      'Reserve online no Camping Tierra Roja, Puerto Iguazú: camping, motorhome, quinchos ou cabana. Disponibilidade real e confirmação imediata.',
    titulo: 'Reserve seu lugar',
    subtitulo: 'Escolha as datas e confirme na hora. Não é preciso cadastro.',
    beneficios: ['Disponibilidade real', 'Confirmação imediata', 'Sem taxa de reserva'],
    queReservarTitulo: 'O que você pode reservar',
    queReservar: [
      {
        titulo: 'Camping',
        texto: 'vagas para barraca com acesso às piscinas e aos banheiros.',
      },
      {
        titulo: 'Motorhome',
        texto:
          'vaga com ligação completa e segurança 24 h. O valor por noite inclui 2 pessoas; se forem mais, adicione em «Acompanhantes» ao reservar.',
      },
      { titulo: 'Quinchos', texto: 'quinchos com churrasqueira para passar o dia.' },
      {
        titulo: 'Cabana',
        texto: 'cabana para até 8 pessoas com ar-condicionado, Wi-Fi e quincho próprio.',
      },
    ],
    comoFuncionaTitulo: 'Como funciona a reserva',
    comoFunciona:
      'Escolha o tipo de hospedagem e as datas no buscador acima e confirme na hora, sem precisar de cadastro. Para garantir a reserva é paga uma entrada por transferência dentro do prazo indicado no e-mail de confirmação; o saldo é pago na chegada. A diária vai da entrada até as 10h do dia seguinte. Veja o detalhe completo nos {terminos} e no {normas}.',
    ayudaTitulo: 'Prefere que a gente ajude?',
    ayudaTexto: 'Fale no WhatsApp e montamos sua reserva juntos.',
    ayudaBoton: 'Falar no WhatsApp',
  },

  meta: {
    titulo: 'Camping Tierra Roja | Camping e Parque Aquático em Puerto Iguazú',
    descripcion:
      'Camping, motorhome e cabana com parque aquático em Puerto Iguazú, a 20 minutos das Cataratas do Iguaçu e pertinho de Foz do Iguaçu. Três piscinas e reserva online.',
    ogAlt: 'Vista aérea do camping e parque aquático Tierra Roja na selva missioneira',
    schemaDescripcion:
      'Camping e parque aquático em Puerto Iguazú, Misiones, a cerca de 20 minutos das Cataratas do Iguaçu. Vagas de camping, área de motorhome com ligações, cabana para 8 pessoas, três piscinas e quinchos com churrasqueira.',
  },
};
