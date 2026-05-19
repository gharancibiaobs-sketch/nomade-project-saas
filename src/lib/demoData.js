export const demoCategorias = [
  { id: 1, nombre: "Objetos", activo: true },
  { id: 2, nombre: "Textiles", activo: true },
  { id: 3, nombre: "Iluminacion", activo: true }
];

export const demoProductos = [
  {
    id: "demo-1",
    nombre: "Cuenco Mineral",
    descripcion: "Pieza de mesa en ceramica reactiva, seleccionada para hoteles boutique y concept stores.",
    precio_original: 128,
    precio_oferta: 104,
    stock_quantity: 42,
    categoria_id: 1,
    activo: true,
    talles: "",
    medidas: "18 x 18 cm",
    imagenes: [
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85"
    ]
  },
  {
    id: "demo-2",
    nombre: "Manta Atacama",
    descripcion: "Textil liviano de trama abierta, ideal para suites, vitrinas y ambientaciones calmas.",
    precio_original: 220,
    precio_oferta: null,
    stock_quantity: 18,
    categoria_id: 2,
    activo: true,
    talles: "S/M/L",
    medidas: "130 x 180 cm",
    imagenes: [
      "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=900&q=85"
    ]
  },
  {
    id: "demo-3",
    nombre: "Lampara Bruma",
    descripcion: "Luminaria de sobremesa con pantalla textil y base artesanal de baja temperatura.",
    precio_original: 310,
    precio_oferta: 279,
    stock_quantity: 11,
    categoria_id: 3,
    activo: true,
    talles: "",
    medidas: "32 x 46 cm",
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
  tax_percent: "19"
};
