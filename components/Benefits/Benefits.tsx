import {
  Clock3,
  FileCheck2,
  Headphones,
  ShieldCheck,
} from "lucide-react";

const benefits = [
  {
    title: "Atendimento ágil",
    description:
      "Solicite seu atendimento e acompanhe cada etapa diretamente pela plataforma.",
    icon: Clock3,
  },
  {
    title: "Dados protegidos",
    description:
      "Informações pessoais e documentos tratados com controle de acesso e confidencialidade.",
    icon: ShieldCheck,
  },
  {
    title: "Fluxo organizado",
    description:
      "Prévia, confirmação, pagamento e entrega do documento em uma sequência simples.",
    icon: FileCheck2,
  },
  {
    title: "Suporte pelo WhatsApp",
    description:
      "Ajuda disponível durante o processo para orientar o paciente quando necessário.",
    icon: Headphones,
  },
];

export default function Benefits() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-700">
              Experiência MedClick
            </span>

            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Um atendimento digital simples, seguro e bem organizado
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              O paciente acompanha sua solicitação desde o cadastro até a
              disponibilização do documento final, com informações claras em
              todas as etapas.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-7 transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:bg-white hover:shadow-lg"
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                    <Icon size={26} aria-hidden="true" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}