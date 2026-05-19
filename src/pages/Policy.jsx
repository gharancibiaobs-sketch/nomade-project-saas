import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import QuietLoader from "../components/QuietLoader.jsx";
import { loadBranding } from "../lib/branding.js";

const policyMap = {
  cambios: ["Cambios y devoluciones", "policy_returns"],
  despacho: ["Despacho y retiro", "policy_shipping"],
  terminos: ["Terminos y condiciones", "policy_terms"],
  privacidad: ["Politica de privacidad", "policy_privacy"],
  faq: ["Preguntas frecuentes", "policy_faq"]
};

export default function Policy() {
  const { tipo } = useParams();
  const [branding, setBranding] = useState(null);
  const [title, key] = policyMap[tipo] ?? policyMap.terminos;

  useEffect(() => {
    loadBranding().then(setBranding);
  }, []);

  if (!branding) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
        <QuietLoader label="Cargando politica" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <PageHeader backLabel="Volver al catalogo" title={title} />
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-10">
        <p className="whitespace-pre-line font-serif text-xl leading-9 text-[#5F5A55]">
          {branding[key] || "Contenido pendiente de editar desde Admin / Branding."}
        </p>
      </article>
    </main>
  );
}
