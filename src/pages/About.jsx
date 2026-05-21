import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import QuietLoader from "../components/QuietLoader.jsx";
import { loadBranding } from "../lib/branding.js";

export default function About() {
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    loadBranding().then(setBranding);
  }, []);

  if (!branding) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
        <QuietLoader label="Cargando historia" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <PageHeader backLabel="Volver al catalogo" />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-10 md:py-14 lg:grid-cols-[0.95fr_1fr] lg:items-center">
        <div className="group overflow-hidden bg-[#F0EEE9]">
          <img
            src={branding.about_image}
            alt={branding.about_title}
            className="aspect-[4/5] w-full object-cover grayscale-[0.08] transition duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-[1.04] group-hover:grayscale-0"
          />
        </div>
        <div>
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Acerca de Nomade
          </p>
          <h1 className="mt-5 font-serif text-4xl leading-tight md:text-6xl">
            {branding.about_title}
          </h1>
          <p className="mt-8 whitespace-pre-line font-serif text-xl leading-9 text-[#5F5A55]">
            {branding.about_content}
          </p>
        </div>
      </section>
    </main>
  );
}
