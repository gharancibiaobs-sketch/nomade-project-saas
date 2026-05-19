import React, { useEffect, useState } from "react";
import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import QuietLoader from "../components/QuietLoader.jsx";
import { loadBranding } from "../lib/branding.js";

export default function Contact() {
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    loadBranding().then(setBranding);
  }, []);

  if (!branding) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
        <QuietLoader label="Cargando contacto" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <PageHeader backLabel="Volver al catalogo" />
      <section className="mx-auto max-w-4xl px-5 py-16 md:px-10">
        <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">Contacto</p>
        <h1 className="mt-5 font-serif text-5xl leading-tight md:text-7xl">
          {branding.contact_heading}
        </h1>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <ContactLink icon={<MessageCircle size={22} strokeWidth={1.5} />} label="Whatsapp" value={branding.contact_whatsapp} href={`https://wa.me/${cleanPhone(branding.contact_whatsapp)}`} />
          <ContactLink icon={<Mail size={22} strokeWidth={1.5} />} label="Mail" value={branding.contact_mail} href={`mailto:${branding.contact_mail}`} />
        </div>

        <div className="mt-16 border-t border-[#CCC5BD] pt-10">
          <p className="font-serif text-3xl">{branding.social_heading}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <SocialLink icon={<Instagram size={18} strokeWidth={1.5} />} label="Instagram" href={branding.social_instagram} />
            <SocialLink icon={<Facebook size={18} strokeWidth={1.5} />} label="Facebook" href={branding.social_facebook} />
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactLink({ icon, label, value, href }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="border border-[#CCC5BD] p-6 transition hover:border-[#252321]">
      <span className="text-[#252321]">{icon}</span>
      <span className="mt-6 block font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">{label}</span>
      <span className="mt-3 block break-words font-serif text-2xl">{value}</span>
    </a>
  );
}

function SocialLink({ icon, label, href }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 border border-[#252321] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6]">
      {icon}
      {label}
    </a>
  );
}

function cleanPhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}
