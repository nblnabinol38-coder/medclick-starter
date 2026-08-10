import Link from "next/link";
import { Menu, ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="mc-header sticky top-0 z-50 border-b border-white/10 bg-[#06131d]/90 backdrop-blur-2xl">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="MedClick - Página inicial">
          <span className="mc-logo-mark">M+</span>
          <div className="min-w-0">
            <strong className="block truncate text-xl font-black tracking-tight text-white sm:text-2xl">
              Med<span className="text-teal-400">Click</span>
            </strong>
            <span className="hidden items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:flex">
              <ShieldCheck size={10} /> Área segura
            </span>
          </div>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-7 text-sm font-semibold text-slate-300 lg:flex">
          <a href="#como-funciona" className="transition hover:text-teal-300">Como funciona</a>
          <a href="#documentos" className="transition hover:text-teal-300">Documentos</a>
          <a href="#seguranca" className="transition hover:text-teal-300">Segurança</a>
          <Link href="/login" className="transition hover:text-teal-300">Entrar</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="hidden rounded-xl border border-teal-400/40 px-4 py-2.5 text-sm font-bold text-teal-200 transition hover:bg-teal-400/10 sm:inline-flex">
            Entrar
          </Link>
          <Link href="/solicitar" className="mc-header-cta">Solicitar atendimento</Link>
          <span className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-300 md:flex lg:hidden">
            <Menu size={21} />
          </span>
        </div>
      </div>
    </header>
  );
}
