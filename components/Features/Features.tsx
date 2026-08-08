import Link from "next/link";
import {
  FileCheck2,
  ClipboardPlus,
  FileText,
  ShieldCheck,
  Clock3,
  Headphones,
} from "lucide-react";

const features = [
  {
    title: "Atestado médico",
    description:
      "Solicite seu atestado médico online com processo simples, rápido e acompanhamento durante o atendimento.",
    icon: FileCheck2,
  },
  {
    title: "Receita médica",
    description:
      "Solicite receitas médicas conforme avaliação profissional e receba seu documento de forma digital.",
    icon: ClipboardPlus,
  },
  {
    title: "Laudos e documentos",
    description:
      "Solicite laudos e outros documentos médicos disponíveis na plataforma com segurança e praticidade.",
    icon: FileText,
  },
];

export default function Features() {
  return (
    <section
      id="documentos"
      className="border-t border-slate-200 bg-slate-50 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-700">
            Nossos serviços
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Documentos médicos de forma simples e segura
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Escolha o documento que precisa e envie sua solicitação pela
            plataforma para iniciar o atendimento.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                  <Icon size={28} aria-hidden="true" />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {feature.description}
                </p>

                <Link
                  href="/solicitar"
                  className="mt-7 inline-flex font-semibold text-teal-700 transition hover:text-teal-800"
                >
                  Solicitar agora →
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6">
            <ShieldCheck
              className="mt-1 shrink-0 text-teal-600"
              size={28}
              aria-hidden="true"
            />

            <div>
              <h3 className="font-bold text-slate-900">
                Processo seguro
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Seus dados são tratados com cuidado durante todo o processo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6">
            <Clock3
              className="mt-1 shrink-0 text-teal-600"
              size={28}
              aria-hidden="true"
            />

            <div>
              <h3 className="font-bold text-slate-900">
                Atendimento ágil
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Acompanhe o andamento da sua solicitação durante cada etapa.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6">
            <Headphones
              className="mt-1 shrink-0 text-teal-600"
              size={28}
              aria-hidden="true"
            />

            <div>
              <h3 className="font-bold text-slate-900">
                Suporte durante o processo
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Conte com suporte para acompanhar sua solicitação quando
                precisar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}