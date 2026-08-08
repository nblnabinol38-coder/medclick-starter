"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock3,
  HeartPulse,
  LoaderCircle,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";

type ApprovalResponse = {
  success: boolean;
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "NO_PENDING_SESSION"
    | "NOT_FOUND"
    | "ERROR";
  redirectTo?: string;
  user?: {
    name: string;
  };
};

export default function AguardandoLiberacaoPage() {
  return (
    <Suspense fallback={<WaitingPageFallback />}>
      <AguardandoLiberacaoContent />
    </Suspense>
  );
}

function AguardandoLiberacaoContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [status, setStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "NO_SESSION"
  >("PENDING");
  const [approvedName, setApprovedName] = useState("");
  const redirectStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function checkApproval() {
      try {
        const response = await fetch(
          "/api/auth/approval-status",
          { cache: "no-store" },
        );

        const data =
          (await response.json()) as ApprovalResponse;

        if (cancelled) return;

        if (
          response.status === 401 ||
          data.status === "NO_PENDING_SESSION"
        ) {
          setStatus("NO_SESSION");
          return;
        }

        if (data.status === "REJECTED") {
          setStatus("REJECTED");
          return;
        }

        if (
          data.status === "APPROVED" &&
          data.redirectTo &&
          !redirectStarted.current
        ) {
          redirectStarted.current = true;
          setApprovedName(data.user?.name ?? "");
          setStatus("APPROVED");

          window.setTimeout(() => {
            router.replace(data.redirectTo!);
            router.refresh();
          }, 2200);
        }
      } catch {
        // tenta novamente no próximo ciclo
      }
    }

    void checkApproval();

    const interval = window.setInterval(() => {
      void checkApproval();
    }, 2000);

    const focusHandler = () => {
      void checkApproval();
    };

    window.addEventListener("focus", focusHandler);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", focusHandler);
    };
  }, [router]);

  if (status === "APPROVED") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f9fc] px-4 py-8">
        <div className="approval-burst approval-burst-a" />
        <div className="approval-burst approval-burst-b" />

        <section className="approval-card relative w-full max-w-lg overflow-hidden rounded-[30px] border border-emerald-200 bg-white p-7 text-center shadow-[0_28px_90px_rgba(16,185,129,0.16)] sm:p-10">
          <div className="approval-ring mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CheckCircle2 size={52} />
          </div>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
            <Sparkles size={13} />
            Acesso liberado
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
            Tudo certo
            {approvedName
              ? `, ${approvedName.split(" ")[0]}`
              : ""}
            !
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Sua conta foi aprovada. Estamos entrando automaticamente na sua área.
          </p>

          <div className="mx-auto mt-7 max-w-sm overflow-hidden rounded-full bg-slate-100 p-1">
            <div className="approved-progress h-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400">
            <LoaderCircle
              className="animate-spin"
              size={13}
            />
            Abrindo sua conta...
          </div>
        </section>

        <WaitingStyles />
      </main>
    );
  }

  if (status === "REJECTED") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f9fc] px-4">
        <section className="waiting-enter w-full max-w-lg rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-xl">
          <ShieldCheck
            className="mx-auto text-red-500"
            size={48}
          />
          <h1 className="mt-5 text-2xl font-black">
            Cadastro não liberado
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            O acesso não foi aprovado. Se precisar de ajuda, utilize somente o canal de suporte.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white"
          >
            Voltar ao início
          </Link>
        </section>
        <WaitingStyles />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f9fc] px-4 py-8">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />

      <section className="waiting-enter relative w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.11)] sm:p-9">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-teal-200">
          <HeartPulse size={22} />
        </div>

        <div className="relative mx-auto mt-7 flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-50 text-amber-600 ring-1 ring-amber-100">
          <Clock3
            className="waiting-clock"
            size={39}
          />
          <Sparkles
            className="waiting-sparkle absolute -right-2 -top-2 text-cyan-500"
            size={21}
          />
        </div>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-700">
          <LoaderCircle
            className="animate-spin"
            size={13}
          />
          Aguardando liberação
        </span>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Cadastro recebido com sucesso
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Pode manter esta página aberta. Assim que o administrador liberar sua conta, o acesso será feito automaticamente.
        </p>

        {email && (
          <div className="mx-auto mt-6 flex max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
              <Mail size={15} />
            </span>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Conta cadastrada
              </span>
              <strong className="block truncate text-[11px] text-slate-800">
                {email}
              </strong>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <StatusBox title="Cadastro enviado" state="done" />
          <StatusBox
            title="Análise administrativa"
            state="active"
          />
          <StatusBox
            title="Acesso automático"
            state="waiting"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-full bg-slate-100 p-1">
          <div className="waiting-progress h-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500" />
        </div>

        <div className="mt-6 rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-left">
          <div className="flex gap-2">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-cyan-700"
              size={16}
            />
            <p className="text-[10.5px] leading-5 text-cyan-800">
              A página verifica sua liberação automaticamente a cada poucos segundos. Não é necessário atualizar.
            </p>
          </div>
        </div>

        {status === "NO_SESSION" && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-[10.5px] leading-5 text-amber-800">
            Para um cadastro antigo, entre uma vez com seu e-mail e senha. Se ainda estiver pendente, esta tela passará a acompanhar a liberação automaticamente.
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black text-slate-600"
          >
            Voltar ao início
          </Link>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-[10px] font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            <MessageCircle size={14} />
            Suporte via WhatsApp
          </button>
        </div>
      </section>

      <WaitingStyles />
    </main>
  );
}


function WaitingPageFallback() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f9fc] px-4 py-8">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.11)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-teal-200">
          <HeartPulse size={22} />
        </div>

        <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-amber-50 text-amber-600 ring-1 ring-amber-100">
          <LoaderCircle className="animate-spin" size={34} />
        </div>

        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
          Carregando seu cadastro
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
          Estamos preparando o acompanhamento da liberação da sua conta.
        </p>
      </section>

      <WaitingStyles />
    </main>
  );
}

function StatusBox({
  title,
  state,
}: {
  title: string;
  state: "done" | "active" | "waiting";
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        state === "done"
          ? "border-emerald-200 bg-emerald-50"
          : state === "active"
            ? "border-amber-200 bg-amber-50"
            : "border-slate-200 bg-slate-50"
      }`}
    >
      <span
        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${
          state === "done"
            ? "bg-emerald-500 text-white"
            : state === "active"
              ? "bg-amber-500 text-white"
              : "bg-slate-200 text-slate-400"
        }`}
      >
        {state === "done" ? (
          <Check size={12} />
        ) : state === "active" ? (
          <LoaderCircle
            className="animate-spin"
            size={12}
          />
        ) : (
          <Clock3 size={12} />
        )}
      </span>
      <strong className="mt-2 block text-[9px] text-slate-700">
        {title}
      </strong>
    </div>
  );
}

function WaitingStyles() {
  return (
    <style jsx global>{`
      @keyframes waitingEnter {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes waitingClock {
        0%,
        100% {
          transform: rotate(-4deg) scale(1);
        }
        50% {
          transform: rotate(4deg) scale(1.05);
        }
      }

      @keyframes waitingSparkle {
        0%,
        100% {
          opacity: 0.35;
          transform: scale(0.8) rotate(0);
        }
        50% {
          opacity: 1;
          transform: scale(1.2) rotate(18deg);
        }
      }

      @keyframes waitingProgress {
        from {
          transform: translateX(-125%);
        }
        to {
          transform: translateX(250%);
        }
      }

      @keyframes approvalCard {
        from {
          opacity: 0;
          transform: translateY(14px) scale(0.94);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes approvalRing {
        0% {
          transform: scale(0.6);
          opacity: 0;
        }
        65% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes approvedProgress {
        from {
          width: 0%;
        }
        to {
          width: 100%;
        }
      }

      @keyframes burst {
        0% {
          transform: scale(0.4);
          opacity: 0;
        }
        50% {
          opacity: 0.8;
        }
        100% {
          transform: scale(1.6);
          opacity: 0;
        }
      }

      .waiting-enter {
        animation: waitingEnter 520ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .waiting-clock {
        animation: waitingClock 1.8s ease-in-out infinite;
      }

      .waiting-sparkle {
        animation: waitingSparkle 1.45s ease-in-out infinite;
      }

      .waiting-progress {
        width: 42%;
        animation: waitingProgress 1.7s ease-in-out infinite;
      }

      .approval-card {
        animation: approvalCard 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .approval-ring {
        animation: approvalRing 650ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .approved-progress {
        animation: approvedProgress 2s ease-in-out forwards;
      }

      .approval-burst {
        position: absolute;
        width: 280px;
        height: 280px;
        border-radius: 9999px;
        border: 2px solid rgba(16, 185, 129, 0.16);
        animation: burst 1.8s ease-out infinite;
      }

      .approval-burst-a {
        left: 8%;
        top: 12%;
      }

      .approval-burst-b {
        right: 8%;
        bottom: 12%;
        animation-delay: 500ms;
      }

      @media (prefers-reduced-motion: reduce) {
        .waiting-enter,
        .waiting-clock,
        .waiting-sparkle,
        .waiting-progress,
        .approval-card,
        .approval-ring,
        .approved-progress,
        .approval-burst {
          animation: none !important;
        }
      }
    `}</style>
  );
}
