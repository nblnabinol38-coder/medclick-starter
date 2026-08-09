import Link from "next/link";
import {
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { SUPPORT_WHATSAPP_DISPLAY, supportWhatsAppUrl } from "@/lib/support";

const whatsappUrl = supportWhatsAppUrl(
  "Olá! Estou acessando o MedClick e preciso de ajuda com meu atendimento.",
);

export default function Footer() {
  return (
    <footer id="contato" className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-2xl font-extrabold text-white"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500 text-white">
              <Stethoscope size={24} aria-hidden="true" />
            </span>

            <span>
              Med<span className="text-teal-400">Click</span>
            </span>
          </Link>

          <p className="mt-5 max-w-sm leading-7 text-slate-400">
            Atendimento médico digital com acompanhamento organizado, suporte
            ao paciente e acesso seguro aos documentos.
          </p>

          <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck size={18} className="text-teal-400" aria-hidden="true" />
            <span>Proteção de dados e acesso controlado</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Navegação</h3>

          <nav className="mt-5 flex flex-col gap-3 text-sm">
            <a href="#como-funciona" className="transition hover:text-teal-400">
              Como funciona
            </a>

            <a href="#documentos" className="transition hover:text-teal-400">
              Documentos
            </a>

            <a href="#precos" className="transition hover:text-teal-400">
              Preços
            </a>

            <a href="#seguranca" className="transition hover:text-teal-400">
              Segurança
            </a>
          </nav>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Acesso rápido</h3>

          <div className="mt-5 flex flex-col gap-3 text-sm">
            <Link href="/solicitar" className="transition hover:text-teal-400">
              Solicitar atendimento
            </Link>

            <Link href="/paciente" className="transition hover:text-teal-400">
              Área do paciente
            </Link>

            <Link href="/admin" className="transition hover:text-teal-400">
              Painel administrativo
            </Link>

            <Link
              href="/politica-de-privacidade"
              className="transition hover:text-teal-400"
            >
              Política de privacidade
            </Link>

            <Link href="/termos-de-uso" className="transition hover:text-teal-400">
              Termos de uso
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Contato</h3>

          <div className="mt-5 space-y-4 text-sm">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 transition hover:text-teal-400"
            >
              <MessageCircle
                size={20}
                className="mt-0.5 shrink-0 text-teal-400"
                aria-hidden="true"
              />

              <span>
                WhatsApp
                <br />
                {SUPPORT_WHATSAPP_DISPLAY}
              </span>
            </a>

            <div className="flex items-start gap-3">
              <Mail
                size={20}
                className="mt-0.5 shrink-0 text-teal-400"
                aria-hidden="true"
              />

              <span>
                Suporte digital
                <br />
                Atendimento pela plataforma
              </span>
            </div>

            <div className="flex items-start gap-3">
              <MapPin
                size={20}
                className="mt-0.5 shrink-0 text-teal-400"
                aria-hidden="true"
              />

              <span>
                Atendimento online
                <br />
                Disponível em todo o Brasil
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-center text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} MedClick. Todos os direitos reservados.</p>

          <p>
            A emissão de documentos depende da avaliação do médico responsável.
          </p>
        </div>
      </div>
    </footer>
  );
}