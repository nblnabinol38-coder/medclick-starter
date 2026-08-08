"use client";

import {
  AlertTriangle,
  Ban,
  LoaderCircle,
  X,
} from "lucide-react";
import { useState } from "react";

type Props = {
  requestId: string;
  protocol?: string;
  disabled?: boolean;
  onCancelled?: () => void | Promise<void>;
};

export default function CancelRequestButton({
  requestId,
  protocol,
  disabled = false,
  onCancelled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  async function confirmCancel() {
    try {
      setWorking(true);
      setError("");
      setNeedsLogin(false);

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(
          requestId,
        )}/cancelar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-medclick-context": "admin",
          },
          body: JSON.stringify({
            reason:
              reason.trim() ||
              "Solicitação cancelada pelo atendimento.",
          }),
        },
      );

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          setNeedsLogin(true);
        }

        throw new Error(
          data.message ||
            "Não foi possível cancelar a solicitação.",
        );
      }

      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel(
          "medclick-admin",
        );

        channel.postMessage({
          type: "REQUESTS_CHANGED",
          requestId,
          at: Date.now(),
        });

        channel.close();
      }

      setOpen(false);
      setReason("");

      if (onCancelled) {
        await onCancelled();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao cancelar solicitação.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[11px] font-black text-red-700 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Ban size={14} />
        Cancelar solicitação
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section className="cancel-dialog w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,.3)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={21} />
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={working}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar"
              >
                <X size={17} />
              </button>
            </div>

            <h2 className="mt-4 text-xl font-black text-slate-950">
              Cancelar solicitação?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {protocol
                ? `A solicitação ${protocol} será marcada como cancelada e o paciente será avisado automaticamente.`
                : "A solicitação será marcada como cancelada e o paciente será avisado automaticamente."}
            </p>

            <label className="mt-5 block">
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Motivo
              </span>
              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                rows={3}
                maxLength={500}
                placeholder="Ex.: cancelamento solicitado pelo atendimento."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100/60"
              />
            </label>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
                {error}
              </div>
            )}

            {needsLogin && (
              <a
                href={`/admin/login?next=${encodeURIComponent(
                  window.location.pathname,
                )}`}
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-800 transition hover:bg-amber-100"
              >
                Entrar novamente no painel
              </a>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={working}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
              >
                Voltar
              </button>

              <button
                type="button"
                disabled={working}
                onClick={() => void confirmCancel()}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {working ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={15}
                  />
                ) : (
                  <Ban size={15} />
                )}
                Confirmar
              </button>
            </div>
          </section>

          <style jsx global>{`
            @keyframes cancelDialog {
              from {
                opacity: 0;
                transform: translateY(10px) scale(0.97);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            .cancel-dialog {
              animation: cancelDialog 280ms
                cubic-bezier(0.22, 1, 0.36, 1) both;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
