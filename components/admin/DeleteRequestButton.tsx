"use client";

import {
  AlertTriangle,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

type Props = {
  requestId: string;
  protocol: string;
};

export default function DeleteRequestButton({
  requestId,
  protocol,
}: Props) {
  const router = useRouter();
  const [open, setOpen] =
    useState(false);
  const [confirmText, setConfirmText] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  const confirmed =
    confirmText.trim() === protocol;

  async function removeRequest() {
    if (!confirmed || loading) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/solicitacoes/${encodeURIComponent(
          requestId,
        )}`,
        {
          method: "DELETE",
        },
      );

      const contentType =
        response.headers.get(
          "content-type",
        ) ?? "";

      if (
        !contentType.includes(
          "application/json",
        )
      ) {
        throw new Error(
          `Resposta inválida do servidor (${response.status}).`,
        );
      }

      const result =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Não foi possível excluir a solicitação.",
        );
      }

      if (
        typeof BroadcastChannel !==
        "undefined"
      ) {
        const channel =
          new BroadcastChannel(
            "saudeclick-realtime",
          );

        channel.postMessage({
          type: "request-deleted",
          requestId,
          at: Date.now(),
        });

        channel.close();
      }

      router.replace("/admin");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao excluir solicitação.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setConfirmText("");
          setOpen(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[10px] font-black text-red-300 transition hover:-translate-y-0.5 hover:border-red-400/50 hover:bg-red-500/15 hover:shadow-lg hover:shadow-red-950/20"
      >
        <Trash2 size={14} />
        Excluir solicitação
      </button>

      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md overflow-hidden rounded-[26px] border border-red-400/20 bg-[#07111f] shadow-[0_30px_110px_rgba(0,0,0,.65)]">
            <div className="flex items-start justify-between border-b border-white/8 p-5">
              <div className="flex gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/12 text-red-300 ring-1 ring-red-400/20">
                  <AlertTriangle size={21} />
                </span>

                <div>
                  <span className="text-[9px] font-black uppercase tracking-[.16em] text-red-300">
                    Exclusão permanente
                  </span>
                  <h3 className="mt-1 text-lg font-black text-white">
                    Excluir solicitação?
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-[11px] leading-5 text-slate-400">
                Esta ação remove definitivamente a solicitação e os registros vinculados do banco. Para confirmar, digite o protocolo abaixo.
              </p>

              <div className="mt-4 rounded-xl border border-red-400/15 bg-red-500/7 px-3 py-2 text-center font-mono text-xs font-black text-red-200">
                {protocol}
              </div>

              <label className="mt-4 block text-[9px] font-black uppercase tracking-[.12em] text-slate-400">
                Digite o protocolo
              </label>

              <input
                value={confirmText}
                onChange={(event) =>
                  setConfirmText(
                    event.target.value,
                  )
                }
                placeholder={protocol}
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#040b14] px-3 text-xs font-semibold text-white outline-none transition focus:border-red-400/40 focus:ring-4 focus:ring-red-500/5"
              />

              {error && (
                <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-[10px] font-semibold text-red-200">
                  {error}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-black text-slate-300 transition hover:bg-white/8"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  disabled={
                    !confirmed ||
                    loading
                  }
                  onClick={() =>
                    void removeRequest()
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-[10px] font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {loading ? (
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={14} />
                  )}

                  {loading
                    ? "Excluindo..."
                    : "Excluir definitivamente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
