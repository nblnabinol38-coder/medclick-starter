import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label="MedClick - Página inicial"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition duration-300 group-hover:scale-105">
            M+
          </span>
          <div>
            <strong className="block text-lg font-black tracking-tight text-slate-950">
              Med<span className="text-teal-600">Click</span>
            </strong>
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:block">
              Tele Saúde
            </span>
          </div>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-7 text-sm font-semibold text-slate-700 lg:flex"
        >
          <a
            href="#como-funciona"
            className="transition hover:text-teal-600"
          >
            Como funciona
          </a>

          <a
            href="#documentos"
            className="transition hover:text-teal-600"
          >
            Documentos
          </a>

          <a
            href="#precos"
            className="transition hover:text-teal-600"
          >
            Preços
          </a>

          <a
            href="#seguranca"
            className="transition hover:text-teal-600"
          >
            Segurança
          </a>

          <a
            href="#contato"
            className="transition hover:text-teal-600"
          >
            Contato
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl border border-teal-600 px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:-translate-y-0.5 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:inline-flex"
          >
            Entrar
          </Link>

          <Link
            href="/cadastro"
            className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
          >
            Criar conta
          </Link>

          <Link
            href="/solicitar"
            className="inline-flex rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:px-5"
          >
            Solicitar atendimento
          </Link>
        </div>
      </div>
    </header>
  );
}
