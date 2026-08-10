"use client";

import { MessageCircle, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { supportWhatsAppUrl } from "@/lib/support";

type Props = {
  message?: string;
  compact?: boolean;
};


export default function WhatsAppUltraButton({
  message = "Olá! Preciso de suporte no MedClick.",
  compact = false,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const href = supportWhatsAppUrl(message);

  // O painel administrativo não exibe o botão de ajuda.
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      className={`fixed z-[9999] ${
        compact
          ? "bottom-3 right-3 sm:bottom-4 sm:right-4"
          : "bottom-3 right-3 sm:bottom-7 sm:right-7"
      }`}
    >
      {open && (
        <div className="wa-pop mb-3 w-[290px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[26px] border border-emerald-100 bg-white p-4 shadow-[0_24px_70px_rgba(16,185,129,.28)]">
          <div className="flex items-start gap-3">
            <span className="wa-avatar relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200">
              <MessageCircle size={21} />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </span>

            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[.12em] text-emerald-700">
                <Sparkles size={11} />
                Suporte MedClick
              </span>
              <strong className="mt-1 block text-xs text-slate-950">
                Precisa de ajuda?
              </strong>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Fale com nosso suporte pelo WhatsApp para dúvidas sobre cadastro,
                solicitações, pagamentos ou acompanhamento.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
              aria-label="Fechar ajuda"
            >
              <X size={13} />
            </button>
          </div>

          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="wa-cta mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-[11px] font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <MessageCircle size={15} />
            Conversar no WhatsApp
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="wa-float group relative flex min-h-12 sm:min-h-14 items-center justify-center gap-2 overflow-visible rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-green-600 px-4 sm:px-5 font-black text-white shadow-[0_18px_48px_rgba(16,185,129,.42)] transition duration-300 hover:-translate-y-1 hover:scale-105"
        aria-label={open ? "Fechar ajuda" : "Abrir ajuda"}
        aria-expanded={open}
      >
        <span className="wa-ring absolute inset-0 rounded-full border-2 border-emerald-400/50" />
        <span className="wa-ring wa-ring-2 absolute inset-0 rounded-full border-2 border-emerald-400/30" />
        {open ? (
          <X size={22} className="relative z-10" />
        ) : (
          <MessageCircle
            size={22}
            className="relative z-10 transition group-hover:rotate-[-8deg] group-hover:scale-110"
          />
        )}
        <span className="relative z-10">Ajuda</span>
        {!open && (
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-300 shadow-sm" />
        )}
      </button>

      <style jsx>{`
        @keyframes waRing {
          0% { transform: scale(0.92); opacity: 0.78; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes waFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes waPop {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes waShine {
          0% { transform: translateX(-160%); }
          55%, 100% { transform: translateX(220%); }
        }
        @keyframes waGlow {
          0%, 100% { box-shadow: 0 18px 48px rgba(16,185,129,.34); }
          50% { box-shadow: 0 20px 58px rgba(16,185,129,.58); }
        }
        .wa-float {
          animation: waFloat 2.7s ease-in-out infinite, waGlow 2.7s ease-in-out infinite;
        }
        .wa-ring { animation: waRing 1.9s ease-out infinite; pointer-events: none; }
        .wa-ring-2 { animation-delay: .8s; }
        .wa-pop { animation: waPop 280ms cubic-bezier(.22,1,.36,1) both; }
        .wa-avatar { animation: waFloat 2.8s ease-in-out infinite; }
        .wa-cta { position: relative; overflow: hidden; }
        .wa-cta::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 42%;
          background: linear-gradient(110deg, transparent, rgba(255,255,255,.4), transparent);
          animation: waShine 2.8s ease-in-out infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .wa-float, .wa-ring, .wa-avatar, .wa-cta::after, .wa-pop { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
