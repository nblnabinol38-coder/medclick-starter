import Link from "next/link";

import Header from "@/components/Header/Header";
import Features from "@/components/Features/Features";
import Benefits from "@/components/Benefits/Benefits";
import Pricing from "@/components/Pricing/Pricing";
import Security from "@/components/Security/Security";
import Footer from "@/components/Footer/Footer";

const serviceSteps = [
  "Cadastro",
  "Análise médica",
  "Prévia",
  "Pagamento",
  "Documento final",
];

export default function Home() {
  return (
    <>
      <Header />

      <main className="bg-slate-50">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-slate-100"
          />

          <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
            <span className="rounded-full bg-teal-100 px-5 py-2 text-sm font-semibold text-teal-700 shadow-sm sm:text-base">
              Atendimento médico 100% online
            </span>

            <h1 className="mt-8 max-w-5xl text-4xl font-black leading-tight text-slate-900 sm:text-5xl md:text-7xl">
              Documentos médicos
              <br />

              <span className="text-teal-600">
                rápidos, seguros e profissionais
              </span>
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl md:leading-9">
              Solicite atestados médicos, receitas e laudos de forma online,
              com acompanhamento completo da solicitação até a entrega do
              documento.
            </p>

            <div className="mt-12 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
              <Link
                href="/solicitar"
                className="rounded-xl bg-teal-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:px-10 sm:py-5"
              >
                Solicitar atendimento
              </Link>

              <a
                href="#como-funciona"
                className="rounded-xl border border-slate-300 bg-white px-8 py-4 text-lg font-bold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 sm:px-10 sm:py-5"
              >
                Como funciona
              </a>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-20 bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center">
              <span className="rounded-full bg-teal-100 px-4 py-2 text-sm font-bold text-teal-700">
                Fluxo do atendimento
              </span>

              <h2 className="mt-6 text-4xl font-black text-slate-900 md:text-5xl">
                Como funciona o MedClick
              </h2>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                O paciente acompanha todas as etapas da solicitação diretamente
                pela plataforma.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {serviceSteps.map((step, index) => (
                <article
                  key={step}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:bg-white hover:shadow-lg"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-xl font-bold text-white">
                    {index + 1}
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">
                    {step}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Features />
        <Benefits />
        <Pricing />
        <Security />
      </main>

      <Footer />
    </>
  );
}
