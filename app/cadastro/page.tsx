"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  HeartPulse,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ApiResponse = {
  success: boolean;
  message?: string;
};

export default function CadastroPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Não foi possível realizar o cadastro.",
        );
      }

      router.push(
        `/cadastro/aguardando?email=${encodeURIComponent(
          email,
        )}`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao criar a conta.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f9fc] px-4 py-6 text-slate-900 sm:py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
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
                  Área do paciente
                </span>
              </div>
            </div>

            <div className="mt-16 max-w-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black text-cyan-100 ring-1 ring-white/10">
                <Sparkles size={13} />
                Cadastro seguro
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight">
                Sua conta,
                <br />
                seu atendimento,
                <br />
                tudo em um só lugar.
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                Após o cadastro, sua conta passa por uma
                liberação manual antes do primeiro acesso.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Benefit text="Conta liberada manualmente" />
            <Benefit text="Acompanhamento pelo próprio site" />
            <Benefit text="Dados protegidos e acesso individual" />
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
                  Criar conta
                </span>
              </div>
            </div>

            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-700">
              Novo usuário
            </span>
            <h2 className="mt-1 text-3xl font-black tracking-tight">
              Criar minha conta
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Preencha seus dados. O acesso será liberado
              pelo administrador após a análise do cadastro.
            </p>

            <form
              onSubmit={submit}
              className="mt-7 space-y-4"
            >
              <Field
                icon={UserRound}
                label="Nome completo"
                value={name}
                type="text"
                autoComplete="name"
                placeholder="Digite seu nome completo"
                onChange={setName}
              />

              <Field
                icon={Mail}
                label="E-mail"
                value={email}
                type="email"
                autoComplete="email"
                placeholder="seuemail@exemplo.com"
                onChange={setEmail}
              />

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
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-11 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <Field
                icon={ShieldCheck}
                label="Confirmar senha"
                value={confirmPassword}
                type="password"
                autoComplete="new-password"
                placeholder="Digite novamente"
                onChange={setConfirmPassword}
              />

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
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
                    Enviando cadastro...
                  </>
                ) : (
                  <>
                    Criar conta
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-1 text-[11px] text-slate-500">
              Já possui cadastro?
              <Link
                href="/"
                className="font-black text-teal-700 hover:text-teal-800"
              >
                Entrar
              </Link>
            </div>
          </div>
        </section>
      </div>

      <CadastroStyles />
    </main>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  type,
  placeholder,
  autoComplete,
  onChange,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-black text-slate-600">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
        />
      </div>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-200">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20">
        <Check size={12} />
      </span>
      {text}
    </div>
  );
}

function CadastroStyles() {
  return (
    <style jsx global>{`
      @keyframes cadastroEnter {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.99);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      main > div.relative {
        animation: cadastroEnter 520ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      @media (prefers-reduced-motion: reduce) {
        main > div.relative {
          animation: none !important;
        }
      }
    `}</style>
  );
}
