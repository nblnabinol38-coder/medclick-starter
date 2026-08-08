"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";

const WHATSAPP_NUMBER = "5511926029855";

const DEFAULT_MESSAGE =
  "Olá! Preciso de ajuda com uma solicitação no MedClick.";

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  function openWhatsApp() {
    const encodedMessage = encodeURIComponent(DEFAULT_MESSAGE);

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function toggleHelpBox() {
    setIsOpen((currentValue) => !currentValue);
  }

  function closeHelpBox() {
    setIsOpen(false);
  }

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          aria-label="Atendimento pelo WhatsApp"
          className="mb-4 w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 bg-teal-600 px-5 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                <MessageCircle size={25} aria-hidden="true" />
              </span>

              <div>
                <h2 className="font-bold">Atendimento MedClick</h2>

                <div className="mt-1 flex items-center gap-2 text-sm text-teal-50">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full bg-emerald-300"
                  />

                  Atendimento pelo WhatsApp
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={closeHelpBox}
              aria-label="Fechar atendimento"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="bg-slate-50 p-5">
            <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-900">
                Olá! Como podemos ajudar?
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tire dúvidas sobre solicitações, documentos, pagamentos ou
                acompanhamento do atendimento.
              </p>
            </div>

            <button
              type="button"
              onClick={openWhatsApp}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-4 font-bold text-white transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              <MessageCircle size={21} aria-hidden="true" />
              Conversar no WhatsApp
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              O WhatsApp será aberto em uma nova janela.
            </p>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={toggleHelpBox}
        aria-label={
          isOpen
            ? "Fechar atendimento pelo WhatsApp"
            : "Abrir atendimento pelo WhatsApp"
        }
        aria-expanded={isOpen}
        className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-emerald-200"
      >
        {isOpen ? (
          <X size={22} aria-hidden="true" />
        ) : (
          <MessageCircle size={22} aria-hidden="true" />
        )}

        <span>Ajuda</span>
      </button>
    </div>
  );
}