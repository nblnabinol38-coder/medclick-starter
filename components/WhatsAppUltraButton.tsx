"use client";

import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  message?: string;
  compact?: boolean;
};

const DEFAULT_WHATSAPP_NUMBER = "5511918622785";

export default function WhatsAppUltraButton({
  message = "Olá! Preciso de suporte no MedClick.",
  compact = false,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const hidden = useMemo(() => {
    if (!pathname) return false;
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }, [pathname]);

  if (hidden) return null;

  const configuredNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ||
    DEFAULT_WHATSAPP_NUMBER;

  const href = `https://wa.me/${configuredNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div
      data-medclick-help="fixed"
      className="fixed right-4 z-[99999] flex flex-col items-end gap-3 sm:right-6"
      style={{
        position: "fixed",
        right: compact ? "16px" : undefined,
        bottom:
          "max(18px, calc(env(safe-area-inset-bottom, 0px) + 18px))",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        isolation: "isolate",
      }}
    >
      {open && (
        <section
          role="dialog"
          aria-label="Atendimento MedClick"
          className="w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-[24px] border border-white/10 bg-[#071824]/95 shadow-[0_24px_80px_rgba(0,0,0,.42)] backdrop-blur-xl"
        >
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <MessageCircle size={21} />
              </span>

              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-white">
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95"
            >
              <X size={18} />
            </button>
          </header>

          <div className="p-5">
            <p className="text-sm font-black text-white">
              Olá! Como podemos ajudar?
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              Tire dúvidas sobre sua solicitação, pagamento, acompanhamento ou documento.
            </p>

            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 active:scale-[.98]"
            >
              <MessageCircle size={19} />
              Conversar no WhatsApp
            </a>

            <p className="mt-3 text-center text-[10px] font-medium text-slate-500">
              O WhatsApp só abre quando você tocar no botão acima.
            </p>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Fechar ajuda" : "Abrir ajuda"}
        className={`group relative isolate flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 font-black text-white ring-1 ring-white/20 transition duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 ${
          compact
            ? "min-h-12 px-4 py-3 text-sm"
            : "min-h-14 px-5 py-3.5 text-base sm:text-[17px]"
        }`}
        style={{
          boxShadow: "0 14px 38px rgba(16,185,129,.38)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2 -z-10 rounded-full bg-emerald-400/20 blur-xl animate-pulse"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,.22)_48%,transparent_72%)] bg-[length:220%_100%] animate-[medclickHelpShine_3.6s_linear_infinite]"
        />
        <MessageCircle
          size={compact ? 20 : 23}
          className="relative shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
        />
        <span className="relative">Ajuda</span>
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 h-3 w-3 rounded-full bg-white shadow-[0_0_0_4px_rgba(16,185,129,.32)]"
        />
      </button>

      <style jsx global>{`
        @keyframes medclickHelpShine {
          0% { background-position: 180% 0; }
          100% { background-position: -120% 0; }
        }

        [data-medclick-help="fixed"] {
          position: fixed !important;
          z-index: 99999 !important;
          max-width: calc(100vw - 24px);
          pointer-events: auto;
        }

        @media (max-width: 640px) {
          [data-medclick-help="fixed"] {
            right: 14px !important;
            bottom: max(14px, calc(env(safe-area-inset-bottom, 0px) + 14px)) !important;
          }
        }
      `}</style>
    </div>
  );
}
