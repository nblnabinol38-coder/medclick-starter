"use client";

import {
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

type Props = {
  message?: string;
  compact?: boolean;
};

export default function WhatsAppUltraButton({
  message =
    "Olá! Preciso de suporte no SaudeClick.",
  compact = false,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const number =
    process.env
      .NEXT_PUBLIC_WHATSAPP_NUMBER ??
    "";

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => setOpen(true),
        5000,
      );

    return () =>
      window.clearTimeout(timer);
  }, []);

  const href = number
    ? `https://wa.me/${number.replace(
        /\D/g,
        "",
      )}?text=${encodeURIComponent(
        message,
      )}`
    : "#";

  function handleClick(
    event:
      React.MouseEvent<HTMLAnchorElement>,
  ) {
    if (!number) {
      event.preventDefault();
      window.alert(
        "Configure NEXT_PUBLIC_WHATSAPP_NUMBER no arquivo .env.",
      );
    }
  }

  return (
    <div
      className={`fixed z-[90] ${
        compact
          ? "bottom-4 right-4"
          : "bottom-5 right-5 sm:bottom-7 sm:right-7"
      }`}
    >
      {open && (
        <div className="wa-pop mb-3 w-[270px] rounded-[24px] border border-emerald-100 bg-white p-4 shadow-[0_24px_70px_rgba(16,185,129,.24)]">
          <div className="flex items-start gap-3">
            <span className="wa-avatar relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200">
              <MessageCircle size={21} />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </span>

            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[.12em] text-emerald-700">
                <Sparkles size={11} />
                Suporte SaudeClick
              </span>
              <strong className="mt-1 block text-xs text-slate-950">
                Precisa de ajuda?
              </strong>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                O atendimento continua pelo site. O WhatsApp fica disponível somente para suporte.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
              aria-label="Fechar"
            >
              <X size={13} />
            </button>
          </div>

          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={handleClick}
            className="wa-cta mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-[11px] font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <MessageCircle size={15} />
            Abrir suporte no WhatsApp
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="wa-float group relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-emerald-500 via-green-500 to-green-600 text-white shadow-[0_18px_48px_rgba(16,185,129,.42)] transition duration-300 hover:-translate-y-1 hover:scale-105"
        aria-label="Suporte no WhatsApp"
      >
        <span className="wa-ring absolute inset-0 rounded-[22px] border-2 border-emerald-400/50" />
        <span className="wa-ring wa-ring-2 absolute inset-0 rounded-[22px] border-2 border-emerald-400/30" />
        <MessageCircle
          size={29}
          className="relative z-10 transition group-hover:rotate-[-8deg] group-hover:scale-110"
        />
        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-300 shadow-sm" />
      </button>

      <style jsx>{`
        @keyframes waRing {
          0% {
            transform: scale(0.88);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.55);
            opacity: 0;
          }
        }

        @keyframes waFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes waPop {
          from {
            opacity: 0;
            transform: translateY(10px)
              scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        @keyframes waShine {
          from {
            transform: translateX(-130%);
          }
          to {
            transform: translateX(150%);
          }
        }

        .wa-float {
          animation: waFloat 2.6s
            ease-in-out infinite;
        }

        .wa-ring {
          animation: waRing 1.9s
            ease-out infinite;
        }

        .wa-ring-2 {
          animation-delay: 0.8s;
        }

        .wa-pop {
          animation: waPop 280ms
            cubic-bezier(.22,1,.36,1)
            both;
        }

        .wa-avatar {
          animation: waFloat 2.8s
            ease-in-out infinite;
        }

        .wa-cta {
          position: relative;
          overflow: hidden;
        }

        .wa-cta::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 45%;
          background:
            linear-gradient(
              110deg,
              transparent,
              rgba(255,255,255,.35),
              transparent
            );
          animation: waShine 2.8s
            ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
