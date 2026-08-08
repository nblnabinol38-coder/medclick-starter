import Link from "next/link";
import { BadgeCheck, FileText, ReceiptText, Stethoscope } from "lucide-react";

const pricingCards = [
  {
    title: "Atestado médico",
    description:
      "Escolha o período solicitado. A emissão depende da avaliação médica.",
    icon: Stethoscope,
    highlight: true,
    options: [
      {
        label: "1 a 3 dias",
        price: "R$ 60,00",
      },
      {
        label: "4 a 7 dias",
        price: "R$ 80,00",
      },
      {
        label: "8 a 14 dias",
        price: "R$ 120,00",
      },
    ],
  },
  {
    title: "Receita médica",
    description:
      "Solicitação de receita mediante avaliação do profissional responsável.",
    icon: ReceiptText,
    highlight: false,
    options: [
      {
        label: "Valor único",
        price: "R$ 100,00",
      },
    ],
  },
  {
    title: "Laudo médico",
    description:
      "Laudo para finalidades como INSS, afastamento, aposentadoria e outras.",
    icon: FileText,
    highlight: false,
    options: [
      {
        label: "Valor único",
        price: "R$ 280,00",
      },
    ],
  },
];

export default function Pricing() {
  return (
    <section id="precos" className="bg-slate-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-teal-500/15 px-4 py-2 text-sm font-semibold text-teal-300">
            Valores dos serviços
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl">
            Escolha o documento que você precisa
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Os valores são apresentados antes do envio da solicitação. A
            emissão do documento depende da análise do profissional médico.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {pricingCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className={`relative rounded-3xl border p-8 ${
                  card.highlight
                    ? "border-teal-400 bg-teal-500/10 shadow-2xl shadow-teal-950/30"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                {card.highlight && (
                  <span className="absolute right-6 top-6 rounded-full bg-teal-400 px-3 py-1 text-xs font-bold text-slate-950">
                    Mais solicitado
                  </span>
                )}

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300">
                  <Icon size={28} aria-hidden="true" />
                </div>

                <h3 className="mt-6 text-2xl font-bold">{card.title}</h3>

                <p className="mt-4 min-h-20 leading-7 text-slate-300">
                  {card.description}
                </p>

                <div className="mt-8 space-y-4">
                  {card.options.map((option) => (
                    <div
                      key={`${card.title}-${option.label}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <BadgeCheck
                          className="shrink-0 text-teal-300"
                          size={20}
                          aria-hidden="true"
                        />

                        <span className="text-sm font-semibold text-slate-200">
                          {option.label}
                        </span>
                      </div>

                      <strong className="text-lg text-white">
                        {option.price}
                      </strong>
                    </div>
                  ))}
                </div>

                <Link
                  href="/solicitar"
                  className="mt-8 inline-flex w-full justify-center rounded-xl bg-teal-500 px-6 py-4 font-semibold text-white transition hover:bg-teal-400 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Solicitar atendimento
                </Link>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-4xl text-center text-sm leading-6 text-slate-400">
          O pagamento não garante a emissão automática de atestado, receita ou
          laudo. Todo documento depende da avaliação e da decisão do médico
          responsável.
        </p>
      </div>
    </section>
  );
}