"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  Eye,
  EyeOff,
  HeartPulse,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useState } from "react";

type LoginResponse = {
  success: boolean;
  code?:
    | "INVALID_CREDENTIALS"
    | "PENDING_APPROVAL"
    | "REJECTED"
    | "INACTIVE"
    | "SERVER_ERROR";
  message?: string;
  redirectTo?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<
    "FORM" | "PENDING" | "BLOCKED"
  >("FORM");

  async function submit(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const contentType =
        response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          response.status === 404
            ? "A API de login não foi encontrada. Verifique app/api/auth/login/route.ts."
            : `O servidor respondeu em formato inesperado (${response.status}).`,
        );
      }

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success) {
        if (data.code === "PENDING_APPROVAL") {
          router.replace(
            `/cadastro/aguardando?email=${encodeURIComponent(email)}`,
          );
          return;
        }

        if (
          data.code === "REJECTED" ||
          data.code === "INACTIVE"
        ) {
          setState("BLOCKED");
          setError(
            data.message ??
              "Este acesso não está disponível.",
          );
          return;
        }

        throw new Error(
          data.message ?? "Não foi possível entrar.",
        );
      }

      router.replace(data.redirectTo ?? "/paciente");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao realizar login.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (state === "PENDING") {
    return (
      <StatusScreen
        tone="amber"
        icon={Clock3}
        title="Cadastro aguardando liberação"
        description="Seu cadastro foi recebido e ainda precisa ser liberado pelo administrador. Assim que a aprovação for concluída, você poderá acessar normalmente."
        actionLabel="Voltar ao início"
        actionHref="/"
      />
    );
  }

  if (state === "BLOCKED") {
    return (
      <StatusScreen
        tone="red"
        icon={ShieldCheck}
        title="Acesso indisponível"
        description={
          error ||
          "Este cadastro não está disponível para acesso."
        }
        actionLabel="Voltar ao início"
        actionHref="/"
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f9fc] px-4 py-6 text-slate-900 sm:py-10">
      <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />

      <div className="login-enter relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-[linear-gradient(145deg,#071b32,#0b3152_60%,#0d5362)] p-9 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg">
                <HeartPulse size={22} />
              </span>
              <div>
                <strong className="block text-xl font-black">
                  MedClick
                </strong>
                <span className="text-[10px] uppercase tracking-[0.15em] text-cyan-200">
                  Área segura
                </span>
              </div>
            </div>

            <div className="mt-16 max-w-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black text-cyan-100 ring-1 ring-white/10">
                <Sparkles size={13} />
                Acesso individual
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight">
                Acompanhe tudo
                <br />
                pelo próprio site.
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                Entre para visualizar sua solicitação,
                acompanhar a prévia, pagamento e documento
                final em um único lugar.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-emerald-300"
                size={18}
              />
              <p className="text-xs leading-5 text-slate-300">
                Somente contas aprovadas manualmente pelo
                administrador conseguem entrar.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center p-5 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                <HeartPulse size={20} />
              </span>
              <div>
                <strong className="block text-lg font-black">
                  MedClick
                </strong>
                <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-teal-700">
                  Acesso
                </span>
              </div>
            </div>

            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-700">
              Área do paciente
            </span>
            <h2 className="mt-1 text-3xl font-black tracking-tight">
              Entrar na minha conta
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use o e-mail e a senha cadastrados.
            </p>

            <form
              onSubmit={submit}
              className="mt-7 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-[10px] font-black text-slate-600">
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="seuemail@exemplo.com"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black text-slate-600">
                  Senha
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Digite sua senha"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-11 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-5 text-red-700">
                  <AlertCircle
                    className="mt-0.5 shrink-0"
                    size={14}
                  />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/25 disabled:translate-y-0 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      className="animate-spin"
                      size={17}
                    />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-2 text-[11px] text-slate-500 sm:flex-row sm:justify-center">
              <span>Ainda não possui conta?</span>
              <Link
                href="/cadastro"
                className="font-black text-teal-700 hover:text-teal-800"
              >
                Criar cadastro
              </Link>
            </div>
          </div>
        </section>
      </div>

      <LoginStyles />
    </main>
  );
}

function StatusScreen({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  tone,
}: {
  icon: typeof Clock3;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  tone: "amber" | "red";
}) {
  const toneClasses =
    tone === "amber"
      ? "bg-amber-50 text-amber-600 ring-amber-100"
      : "bg-red-50 text-red-600 ring-red-100";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f9fc] px-4 py-8">
      <section className="login-enter w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-[0_24px_70px_rgba(15,23,42,0.11)] sm:p-9">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] ring-1 ${toneClasses}`}
        >
          <Icon
            className={
              tone === "amber"
                ? "status-float"
                : undefined
            }
            size={38}
          />
        </div>

        <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>

        <Link
          href={actionHref}
          className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          {actionLabel}
        </Link>
      </section>

      <LoginStyles />
    </main>
  );
}

function LoginStyles() {
  return (
    <style jsx global>{`
      @keyframes loginEnter {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.99);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes statusFloat {
        0%,
        100% {
          transform: translateY(0) rotate(-3deg);
        }
        50% {
          transform: translateY(-4px) rotate(3deg);
        }
      }

      .login-enter {
        animation: loginEnter 520ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .status-float {
        animation: statusFloat 1.8s ease-in-out
          infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .login-enter,
        .status-float {
          animation: none !important;
        }
      }
    `}</style>
  );
}
