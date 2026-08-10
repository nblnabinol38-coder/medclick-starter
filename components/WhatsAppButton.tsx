"use client";

import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const WHATSAPP_NUMBER = "5511918622785";

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const hidden = useMemo(() => {
    if (!pathname) return false;
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }, [pathname]);

  if (hidden) return null;

  const message = "Olá! Preciso de ajuda com uma solicitação no MedClick.";
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <div
      className="fixed right-4 z-[9999] flex flex-col items-end gap-3 sm:right-6"
      style={{
        bottom:
          "max(18px, calc(env(safe-area-inset-bottom, 0px) + 18px))",
      }}
    >
      {open && (
        <div className="w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-[24px] border border-white/10 bg-[#081a25]/95 shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl animate-[medclickHelpIn_.22s_ease-out]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <MessageCircle size={21} />
              </span>

              <div>
                <strong className="block text-sm font-black text-white">
                  Atendimento MedClick
                </strong>
                <span className="mt-0.5 block text-[11px] font-semibold text-emerald-300">
                  Suporte pelo WhatsApp
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar ajuda"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            <p className="text-sm font-bold text-white">
              Olá! Como podemos ajudar?
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-300">
              Tire dúvidas sobre sua solicitação, pagamento,
              acompanhamento ou documento.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.98]"
            >
              <MessageCircle size={19} />
              Conversar no WhatsApp
            </a>

            <p className="mt-3 text-center text-[10px] font-medium text-slate-500">
              O WhatsApp só será aberto quando você tocar no botão acima.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Fechar ajuda" : "Abrir ajuda"}
        className="group relative isolate flex min-h-14 items-center gap-2.5 overflow-visible rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 px-5 py-3.5 font-black text-white shadow-[0_12px_35px_rgba(16,185,129,0.38)] ring-1 ring-white/20 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(16,185,129,0.48)] active:translate-y-0 active:scale-95"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 -z-10 rounded-full bg-emerald-400/25 blur-md animate-pulse"
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,.22)_48%,transparent_72%)] bg-[length:220%_100%] animate-[medclickHelpShine_3.6s_linear_infinite]"
        />

        <MessageCircle
          size={23}
          className="relative shrink-0 transition-transform duration-300 group-hover:rotate-[-7deg] group-hover:scale-110"
        />

        <span className="relative text-base sm:text-[17px]">Ajuda</span>

        <span
          aria-hidden="true"
          className="absolute right-0 top-0 h-3.5 w-3.5 translate-x-1/4 -translate-y-1/4 rounded-full bg-white shadow-[0_0_0_4px_rgba(16,185,129,.32)]"
        />
      </button>

      <style jsx global>{`
        @keyframes medclickHelpShine {
          0% {
            background-position: 180% 0;
          }
          100% {
            background-position: -120% 0;
          }
        }

        @keyframes medclickHelpIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}