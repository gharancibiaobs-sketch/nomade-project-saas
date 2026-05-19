export const demoCategorias = [
  { id: 1, nombre: "Objetos", activo: true },
  { id: 2, nombre: "Textiles", activo: true },
  { id: 3, nombre: "Iluminacion", activo: true }
];

export const demoProductos = [
  {
    id: "demo-1",
    nombre: "Cuenco Mineral",
    slug: "cuenco-mineral",
    sku: "NOM-CUE-001",
    descripcion: "Pieza de mesa en ceramica reactiva, seleccionada para hoteles boutique y concept stores.",
    precio_original: 128,
    precio_oferta: 104,
    stock_quantity: 42,
    categoria_id: 1,
    activo: true,
    es_oferta: true,
    es_novedad: true,
    talles: "",
    medidas: "18 x 18 cm",
    material: "Ceramica reactiva",
    origen: "Chile",
    color: "Mineral",
    peso: "0.8 kg",
    cuidados: "Limpiar con pano suave. Evitar abrasivos.",
    tiempo_despacho: "3 a 5 dias habiles",
    imagenes: [
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85"
    ]
  },
  {
    id: "demo-2",
    nombre: "Manta Atacama",
    slug: "manta-atacama",
    sku: "NOM-MAN-002",
    descripcion: "Textil liviano de trama abierta, ideal para suites, vitrinas y ambientaciones calmas.",
    precio_original: 220,
    precio_oferta: null,
    stock_quantity: 18,
    categoria_id: 2,
    activo: true,
    es_oferta: false,
    es_novedad: false,
    talles: "S/M/L",
    medidas: "130 x 180 cm",
    material: "Algodon",
    origen: "Chile",
    color: "Crudo",
    peso: "1.1 kg",
    cuidados: "Lavado frio y secado a la sombra.",
    tiempo_despacho: "3 a 5 dias habiles",
    imagenes: [
      "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=900&q=85"
    ]
  },
  {
    id: "demo-3",
    nombre: "Lampara Bruma",
    slug: "lampara-bruma",
    sku: "NOM-LAM-003",
    descripcion: "Luminaria de sobremesa con pantalla textil y base artesanal de baja temperatura.",
    precio_original: 310,
    precio_oferta: 279,
    stock_quantity: 11,
    categoria_id: 3,
    activo: true,
    es_oferta: true,
    es_novedad: true,
    talles: "",
    medidas: "32 x 46 cm",
    material: "Textil y base artesanal",
    origen: "Chile",
    color: "Blanco calido",
    peso: "1.6 kg",
    cuidados: "Limpiar pantalla con plumero seco.",
    tiempo_despacho: "5 a 7 dias habiles",
    imagenes: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85"
    ]
  }
];

export const demoLogo = "";

export const demoBranding = {
  contact_heading: "Contactanos cuando quieras",
  contact_whatsapp: "+56 9 1234 5678",
  contact_mail: "hola@nomadeproject.cl",
  social_heading: "Siguenos en:",
  social_instagram: "https://instagram.com/nomadeproject",
  social_facebook: "https://facebook.com/nomadeproject",
  about_title: "Acerca de Nomade",
  about_content:
    "Nomade nace como una seleccion de objetos con oficio, materia y pausa. Cada pieza se elige para acompanar proyectos que buscan belleza cotidiana sin exceso.",
  about_image:
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85",
  tax_condition: "exento",
  tax_percent: "19",
  status_banner: "Despachos coordinados dentro de 3 a 5 dias habiles",
  reservation_minutes: "60",
  policy_returns: "Los cambios se coordinan caso a caso dentro de los primeros 10 dias desde la recepcion del pedido.",
  policy_shipping: "El retiro en tienda no tiene costo. Los envios a domicilio se cotizan segun region y disponibilidad logistica.",
  policy_terms: "Las compras B2B quedan sujetas a disponibilidad de stock, confirmacion de pago y coordinacion de entrega.",
  policy_privacy: "Los datos de clientes se utilizan solo para gestionar pedidos, pagos, despachos y comunicaciones comerciales relacionadas.",
  policy_faq: "Para pedidos especiales, cotizaciones o dudas sobre medidas, contactanos antes de confirmar la compra."
};
