"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  HeartPulse,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

type LoginResponse = {
  success: boolean;
  code?:
    | "INVALID_CREDENTIALS"
    | "PENDING_APPROVAL"
    | "REJECTED"
    | "INACTIVE"
    | "FORBIDDEN_ROLE"
    | "SERVER_ERROR";
  message?: string;
  redirectTo?: string;
  user?: {
    role?: string;
  };
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session?context=admin", {
          cache: "no-store",
        });

        if (!active) return;

        if (response.ok) {
          router.replace("/admin");
          return;
        }
      } catch {
        // Sem sessão administrativa: permanece na tela de login.
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          context: "admin",
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          response.status === 404
            ? "A API de login não foi encontrada."
            : `O servidor respondeu em formato inesperado (${response.status}).`,
        );
      }

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Não foi possível entrar no painel.");
      }

      if (data.user?.role !== "ADMIN" && data.user?.role !== "DOCTOR") {
        throw new Error("Esta conta não possui acesso administrativo.");
      }

      router.replace(data.redirectTo ?? "/admin");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao realizar login administrativo.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06111d] text-white">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
          <LoaderCircle className="animate-spin" size={20} />
          Verificando acesso...
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06111d] px-4 py-8 text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <section className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b1b2b]/95 p-6 shadow-2xl sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-950/40">
            <HeartPulse size={24} />
          </span>
          <div>
            <strong className="block text-xl font-black">MedClick</strong>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
              Painel administrativo
            </span>
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
            <ShieldCheck size={13} />
            Área restrita
          </div>
          <h1 className="text-3xl font-black tracking-tight">Acesso administrativo</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Entre com uma conta de administrador ou médico autorizada.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                placeholder="admin@medclick.com"
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/[0.06]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
              Senha
            </label>
            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                placeholder="Sua senha"
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:bg-white/[0.06]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-xs font-semibold leading-5 text-red-200">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-sm font-black text-white shadow-lg shadow-cyan-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {loading ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">
          O acesso ao painel é restrito a usuários autorizados.
        </p>
      </section>
    </main>
  );
}
