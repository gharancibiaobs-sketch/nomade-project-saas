import React from "react";

export default function QuietLoader({ label = "Cargando" }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="flex items-center gap-4 text-[#999591]">
        <span className="h-px w-12 animate-breathe bg-[#999591]" />
        <span className="font-sans text-[9pt] uppercase tracking-[0.2em]">{label}</span>
        <span className="h-px w-12 animate-breathe bg-[#999591]" />
      </div>
    </div>
  );
}
