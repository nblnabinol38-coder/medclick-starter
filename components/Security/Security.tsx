import {
  FileLock2,
  HeartPulse,
  KeyRound,
  Scale,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

const securityItems = [
  {
    title: "Proteção de dados",
    description:
      "As informações do paciente são tratadas com controle de acesso e cuidado durante todo o atendimento.",
    icon: ShieldCheck,
  },
  {
    title: "Acesso restrito",
    description:
      "Somente usuários autorizados podem acessar solicitações, anexos, comprovantes e documentos.",
    icon: KeyRound,
  },
  {
    title: "Sigilo das informações",
    description:
      "Dados pessoais, sintomas, exames e documentos são tratados de forma confidencial.",
    icon: FileLock2,
  },
  {
    title: "Avaliação profissional",
    description:
      "A emissão de qualquer documento depende da avaliação e da decisão do médico responsável.",
    icon: HeartPulse,
  },
  {
    title: "Identificação do profissional",
    description:
      "Os documentos finais devem conter os dados e a identificação do profissional responsável.",
    icon: UserCheck,
  },
  {
    title: "Uso responsável",
    description:
      "A utilização e a aceitação dos documentos dependem das regras da instituição onde serão apresentados.",
    icon: Scale,
  },
];

export default function Security() {
  return (
    <section id="seguranca" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-700">
            Segurança e confiança
          </span>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Seus dados e documentos tratados com responsabilidade
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            O MedClick foi planejado para organizar o atendimento, proteger as
            informações do paciente e manter cada etapa registrada dentro da
            plataforma.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {securityItems.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-7 transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:bg-white hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                  <Icon size={28} aria-hidden="true" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl border border-amber-200 bg-amber-50 p-8">
          <h3 className="text-xl font-bold text-amber-900">
            Aviso importante
          </h3>

          <p className="mt-3 leading-7 text-amber-800">
            O preenchimento da solicitação não garante a emissão automática de
            atestado, receita ou laudo. A decisão depende da avaliação do
            profissional médico responsável e das informações apresentadas
            pelo paciente.
          </p>
        </div>
      </div>
    </section>
  );
}