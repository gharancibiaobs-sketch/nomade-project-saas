import React from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

const resultContent = {
  exito: {
    eyebrow: "Pago aprobado",
    title: "Tu pedido fue recibido",
    text: "Registramos el pago correctamente. Nos pondremos en contacto para coordinar la entrega.",
    icon: CheckCircle2
  },
  pendiente: {
    eyebrow: "Pago pendiente",
    title: "Tu pedido esta en revision",
    text: "El pago aun no fue confirmado. Te avisaremos cuando el estado cambie.",
    icon: Clock
  },
  error: {
    eyebrow: "Pago no completado",
    title: "No pudimos confirmar el pago",
    text: "Puedes volver al catalogo e intentar nuevamente o contactarnos para recibir ayuda.",
    icon: XCircle
  }
};

export default function PaymentResult() {
  const { status } = useParams();
  const content = resultContent[status] ?? resultContent.pendiente;
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <PageHeader backLabel="Catalogo" />
      <section className="mx-auto mt-14 max-w-2xl border border-[#CCC5BD] p-8 md:p-12">
        <Icon size={34} strokeWidth={1.4} />
        <p className="mt-8 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
          {content.eyebrow}
        </p>
        <h1 className="mt-5 font-serif text-3xl leading-tight md:text-5xl">{content.title}</h1>
        <p className="mt-6 font-serif text-xl leading-9 text-[#5F5A55]">{content.text}</p>
        <Link
          to="/"
          className="mt-8 inline-flex border border-[#252321] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6]"
        >
          Volver al catalogo
        </Link>
      </section>
    </main>
  );
}
