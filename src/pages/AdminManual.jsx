import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BookOpen, CheckCircle2, Clock, ExternalLink, FileText, Settings, ShoppingBag } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

const buyerSteps = [
  {
    title: "Explorar el catalogo",
    text: "La pagina principal muestra productos activos. El cliente puede filtrar por categorias, revisar ofertas, novedades, ordenar el catalogo y usar busqueda."
  },
  {
    title: "Revisar precio, stock y descripcion",
    text: "Para mantener la estetica editorial, parte de la informacion comercial aparece al pasar el cursor sobre la imagen o al entrar a la ficha de producto."
  },
  {
    title: "Ver detalles del producto",
    text: "La ficha de producto muestra galeria, descripcion extendida, talles o medidas, material, origen, color, cuidados, stock y precio."
  },
  {
    title: "Agregar productos al pedido",
    text: "El boton Agregar incorpora el producto al pedido. El comprador puede aumentar o disminuir cantidades antes de confirmar."
  },
  {
    title: "Completar checkout",
    text: "En /checkout se ingresan datos del comprador, modalidad de entrega, region, metodo de pago y cupon si corresponde."
  },
  {
    title: "Confirmar pedido",
    text: "En modo demo se simula el resultado. Con Mercado Pago activo, el comprador sera derivado al checkout seguro de Mercado Pago."
  }
];

const adminCards = [
  {
    icon: ShoppingBag,
    title: "Productos",
    text: "Crear, editar, subir imagenes, marcar oferta o novedad, asignar categoria, definir precios, stock, talles, medidas y datos tecnicos."
  },
  {
    icon: Settings,
    title: "Categorias",
    text: "Crear, modificar, dar de baja y reactivar categorias. Si una categoria tiene productos activos, primero se debe reasignar o dar de baja esos productos."
  },
  {
    icon: FileText,
    title: "Branding",
    text: "Cambiar logo, imagen Acerca de Nomade, datos de contacto, redes, politicas, banner operativo, IVA y tiempo de reserva."
  },
  {
    icon: BookOpen,
    title: "Pedidos historicos",
    text: "Revisar pedidos, filtrar por fecha, editar estado de pago y estado logistico, corregir datos operativos y mantener trazabilidad."
  }
];

const statusRows = [
  ["Catalogo, categorias, ofertas y novedades", "Disponible", "Disponible para productos activos con filtros dinamicos."],
  ["Checkout dedicado", "Disponible", "Permite confirmar pedidos en modo demo y calcular envio, tarjeta, IVA y cupon."],
  ["Mercado Pago Checkout Pro", "Parcial", "La base tecnica esta preparada. Falta configurar cuenta real, variables privadas, URLs de retorno y pruebas de webhook."],
  ["Notificaciones por email", "Parcial", "Preparadas via Resend. Falta configurar claves, remitente validado y destinatario interno en produccion."],
  ["Notificacion interna por WhatsApp", "Parcial", "Existe enlace de WhatsApp. Para envio automatico falta integrar WhatsApp Business API."],
  ["Control de stock y reservas", "Parcial", "El endpoint existe. En Vercel Hobby la liberacion automatica corre una vez al dia; cada hora requiere Pro o scheduler externo."],
  ["Estados de pago y logistica", "Disponible", "Se administran por separado desde pedidos historicos."],
  ["Pedidos historicos", "Disponible", "Permite revisar, editar, filtrar por fechas y mantener trazabilidad operativa."],
  ["Exportacion PDF y CSV", "Parcial", "PDF y CSV disponibles. Excel nativo XLSX queda como mejora futura."],
  ["SEO y datos estructurados", "Parcial", "Ficha de producto con datos estructurados. Falta completar meta tags por pagina y Open Graph."],
  ["Clientes y empresas", "Parcial", "Se derivan desde pedidos. Falta CRUD completo de clientes en Admin."],
  ["Accesibilidad", "Parcial", "Hay estructura basica. Falta auditoria formal de teclado, foco visible y contraste."]
];

export default function AdminManual() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <PageHeader backLabel="Volver a Admin" backTo="/admin" title="Manual de Usuario" />

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 lg:px-10">
        <div className="border border-[#CCC5BD] bg-white/45 p-6 md:p-10">
          <p className="font-sans text-[9pt] uppercase tracking-[0.18em] text-[#6B655F]">Manual operativo</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-tight md:text-6xl">
            Aplicacion SaaS NOMADE
          </h1>
          <p className="mt-6 max-w-3xl font-serif text-xl leading-8 text-[#5F5A55]">
            Guia didactica para operar el catalogo B2B, administrar productos,
            gestionar pedidos, mantener branding y preparar la operacion comercial
            antes de activar pagos reales.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ManualPill label="Comprador" />
            <ManualPill label="Backoffice" />
            <ManualPill label="Ventas" />
            <ManualPill label="Estado funcional" />
          </div>
        </div>

        <ManualSection
          eyebrow="Vista general"
          title="Que es NOMADE SaaS"
          status="Disponible"
          intro="NOMADE es una aplicacion e-commerce B2B de estilo editorial para vender productos curados. El comprador navega el catalogo, arma un pedido, selecciona retiro o envio, y confirma la compra. El administrador mantiene productos, categorias, branding, pedidos e indicadores de venta."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard title="Catalogo publico" text="Muestra productos activos, filtros por categoria, oferta y novedades, ordenamiento, busqueda, favoritos y fichas de detalle." />
            <InfoCard title="Checkout" text="Permite confirmar pedidos con datos del comprador, modalidad de entrega, region, cupon, metodo de pago y calculo de totales." />
            <InfoCard title="Backoffice" text="Centraliza la administracion de productos, categorias, branding, dashboard de ventas, pedidos historicos, cupones y auditoria." />
          </div>
        </ManualSection>

        <ManualSection
          eyebrow="Flujo del cliente"
          title="Como compra un cliente"
          status="Disponible"
          intro="El comprador no necesita entrar al modulo Admin. Toda la experiencia comienza en la pagina principal y termina en el checkout."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {buyerSteps.map((step, index) => (
              <div key={step.title} className="grid grid-cols-[44px_1fr] gap-4 border border-[#CCC5BD] bg-white/40 p-5">
                <div className="flex h-11 w-11 items-center justify-center bg-[#252321] font-sans text-[10pt] text-[#FAF9F6]">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-serif text-2xl">{step.title}</h3>
                  <p className="mt-2 font-serif text-lg leading-7 text-[#5F5A55]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ManualSection>

        <ManualSection
          eyebrow="Backoffice"
          title="Como administra el negocio"
          status="Parcial"
          intro="El modulo Admin esta pensado para el dueno o equipo operativo. Desde aqui se mantiene el contenido comercial y se revisa la informacion financiera de los pedidos."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {adminCards.map((card) => (
              <IconCard key={card.title} {...card} />
            ))}
          </div>
          <Notice tone="warning" title="Recomendacion operativa">
            Antes de modificar productos, categorias o pedidos reales, confirma que Supabase tenga aplicado el archivo
            <span className="mx-1 font-sans text-sm">supabase/schema.sql</span>
            actualizado.
          </Notice>
        </ManualSection>

        <ManualSection
          eyebrow="Operaciones frecuentes"
          title="Guia rapida de uso"
          status="Guia"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Checklist title="Alta de producto" items={["Entrar a /admin.", "Presionar Nuevo.", "Completar nombre, categoria, precios, stock y descripcion.", "Marcar oferta o novedad si corresponde.", "Subir imagen principal.", "Guardar y revisar en catalogo."]} />
            <Checklist title="Baja de producto" items={["Seleccionar producto.", "Presionar Dar de baja.", "Confirmar la accion.", "Verificar que deje de aparecer en catalogo.", "Revisar la seccion de productos dados de baja."]} />
            <Checklist title="Cambio de logo" items={["Entrar a Branding.", "Presionar Cambiar logo.", "Seleccionar imagen.", "Guardar branding.", "Verificar encabezado en home y paginas secundarias."]} />
            <Checklist title="Revision de ventas" items={["Entrar a Admin.", "Revisar Dashboard de Ventas.", "Usar filtros de fecha.", "Generar PDF o CSV.", "Contrastar ingresos con pedidos pagados."]} />
          </div>
        </ManualSection>

        <ManualSection
          eyebrow="Estado del producto"
          title="Funcionalidades listas y pendientes"
          status="Auditoria"
          intro="Esta tabla distingue lo que ya puede usarse de lo que esta preparado pero requiere configuracion externa, pruebas adicionales o una implementacion mas profunda."
        >
          <div className="overflow-x-auto border border-[#CCC5BD]">
            <table className="w-full min-w-[760px] border-collapse bg-white/50">
              <thead>
                <tr className="border-b border-[#CCC5BD] text-left font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
                  <th className="p-4">Modulo</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Detalle para usuario</th>
                </tr>
              </thead>
              <tbody>
                {statusRows.map(([module, status, detail]) => (
                  <tr key={module} className="border-b border-[#E5E2DE] last:border-0">
                    <td className="p-4 font-serif text-lg">{module}</td>
                    <td className="p-4"><StatusBadge status={status} /></td>
                    <td className="p-4 font-serif text-base leading-7 text-[#5F5A55]">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ManualSection>

        <ManualSection
          eyebrow="Checklist de publicacion"
          title="Antes de compartir el link"
          status="Practico"
        >
          <div className="grid gap-3">
            {[
              "Probar home, busqueda, favoritos, detalle de producto, contacto, acerca y politicas.",
              "Crear un producto de prueba, subir imagen y validar que aparezca en catalogo.",
              "Crear un pedido demo, revisar totales y comprobar que aparece en pedidos historicos.",
              "Probar filtros por fecha en ventas y exportar reporte PDF o CSV.",
              "Si se activara pago real, configurar Mercado Pago, Resend y variables privadas en Vercel."
            ].map((item, index) => (
              <div key={item} className="flex gap-4 border border-[#CCC5BD] bg-white/40 p-4">
                <CheckCircle2 className="mt-1 shrink-0 text-[#2F6B4F]" size={18} strokeWidth={1.7} />
                <p className="font-serif text-lg leading-7 text-[#5F5A55]">
                  <span className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#252321]">Paso {index + 1}: </span>
                  {item}
                </p>
              </div>
            ))}
          </div>
          <Notice tone="danger" title="No usar tarjetas reales hasta completar Mercado Pago">
            Mientras VITE_PAYMENT_MODE este en modo demo, los pedidos sirven para prueba operativa, no para cobro real.
          </Notice>
        </ManualSection>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/admin" className="inline-flex items-center gap-3 border border-[#252321] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6]">
            Volver a Admin
          </Link>
          <a href="/checkout" className="inline-flex items-center gap-3 border border-[#CCC5BD] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#5F5A55] transition hover:border-[#252321] hover:text-[#252321]">
            Ver checkout
            <ExternalLink size={14} strokeWidth={1.5} />
          </a>
        </div>
      </section>
    </main>
  );
}

function ManualSection({ eyebrow, title, status, intro, children }) {
  return (
    <section className="mt-10 border-t border-[#CCC5BD] pt-10">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="font-sans text-[9pt] uppercase tracking-[0.18em] text-[#6B655F]">{eyebrow}</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight">{title}</h2>
          {intro && <p className="mt-4 max-w-3xl font-serif text-lg leading-8 text-[#5F5A55]">{intro}</p>}
        </div>
        <StatusBadge status={status} />
      </div>
      {children}
    </section>
  );
}

function ManualPill({ label }) {
  return (
    <span className="border border-[#CCC5BD] bg-[#FAF9F6] px-4 py-2 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#5F5A55]">
      {label}
    </span>
  );
}

function InfoCard({ title, text }) {
  return (
    <article className="border border-[#CCC5BD] bg-white/40 p-5">
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="mt-3 font-serif text-lg leading-7 text-[#5F5A55]">{text}</p>
    </article>
  );
}

function IconCard({ icon: Icon, title, text }) {
  return (
    <article className="border border-[#CCC5BD] bg-white/40 p-5">
      <Icon size={20} strokeWidth={1.5} className="text-[#5F5A55]" />
      <h3 className="mt-4 font-serif text-2xl">{title}</h3>
      <p className="mt-3 font-serif text-lg leading-7 text-[#5F5A55]">{text}</p>
    </article>
  );
}

function Checklist({ title, items }) {
  return (
    <article className="border border-[#CCC5BD] bg-white/40 p-5">
      <h3 className="font-serif text-2xl">{title}</h3>
      <ol className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 font-serif text-lg leading-7 text-[#5F5A55]">
            <CheckCircle2 className="mt-1 shrink-0 text-[#2F6B4F]" size={17} strokeWidth={1.7} />
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function Notice({ tone = "warning", title, children }) {
  const Icon = tone === "danger" ? AlertTriangle : Clock;
  const classes = tone === "danger" ? "border-[#D9A6A0] bg-[#FFF1F0]" : "border-[#D8C7A2] bg-[#FFF8E8]";
  return (
    <div className={`mt-6 flex gap-4 border p-5 ${classes}`}>
      <Icon className="mt-1 shrink-0 text-[#5F5A55]" size={20} strokeWidth={1.7} />
      <div>
        <h3 className="font-serif text-xl">{title}</h3>
        <p className="mt-2 font-serif text-lg leading-7 text-[#5F5A55]">{children}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === "Disponible" || status === "Guia" || status === "Practico"
      ? "border-[#9DBAA4] bg-[#EEF7F1] text-[#2F6B4F]"
      : status === "Parcial" || status === "Auditoria"
        ? "border-[#D8C7A2] bg-[#FFF8E8] text-[#7A5B20]"
        : "border-[#D9A6A0] bg-[#FFF1F0] text-[#8A342C]";
  return (
    <span className={`inline-flex items-center justify-center border px-3 py-2 font-sans text-[8pt] uppercase tracking-[0.14em] ${tone}`}>
      {status}
    </span>
  );
}
