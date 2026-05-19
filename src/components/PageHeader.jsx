import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { readDemoLogo } from "../lib/demoStore.js";
import { hasSupabaseConfig, supabase } from "../lib/supabase.js";

export default function PageHeader({ backLabel = "Volver al catalogo", backTo = "/", title }) {
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    async function loadLogo() {
      if (!hasSupabaseConfig) {
        setLogoUrl(readDemoLogo());
        return;
      }

      const { data } = await supabase.from("configuracion_sitio").select("valor").eq("clave", "logo_url").single();
      setLogoUrl(data?.valor ?? "");
    }

    loadLogo();

    const syncDemoLogo = (event) => setLogoUrl(event.detail ?? readDemoLogo());
    window.addEventListener("nomade-logo-updated", syncDemoLogo);
    return () => window.removeEventListener("nomade-logo-updated", syncDemoLogo);
  }, []);

  return (
    <header className="border-b border-[#CCC5BD] bg-[#FAF9F6]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 md:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <Link to="/" className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Nomade Project"
                className="h-auto max-h-20 max-w-[64vw] object-contain md:max-h-24 md:max-w-[520px]"
              />
            ) : (
              <span className="font-serif text-4xl text-[#252321]">Nomade Project</span>
            )}
          </Link>
          {title && <h1 className="font-serif text-3xl text-[#252321]">{title}</h1>}
        </div>

        <Link
          to={backTo}
          className="inline-flex w-fit items-center gap-3 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] hover:text-[#252321]"
        >
          <ArrowLeft size={15} strokeWidth={1.5} />
          {backLabel}
        </Link>
      </div>
    </header>
  );
}
