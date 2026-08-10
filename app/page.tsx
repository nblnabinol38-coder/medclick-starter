import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileHeart,
  FileText,
  HeartPulse,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Zap,
} from "lucide-react";

import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

const trustItems = [
  {
    icon: Zap,
    title: "Fluxo rápido",
    description: "Acompanhamento digital da solicitação",
  },
  {
    icon: ShieldCheck,
    title: "Documento seguro",
    description: "Validação e acesso controlado",
  },
  {
    icon: LockKeyhole,
    title: "Dados protegidos",
    description: "Privacidade em todas as etapas",
  },
  {
    icon: HeartPulse,
    title: "Suporte especializado",
    description: "Ajuda durante o atendimento",
  },
];

const services = [
  {
    icon: ClipboardCheck,
    title: "Atestados médicos",
    description: "Solicitação online com acompanhamento do processo.",
  },
  {
    icon: FileHeart,
    title: "Receitas médicas",
    description: "Fluxo organizado para análise e emissão médica.",
  },
  {
    icon: FileText,
    title: "Laudos médicos",
    description: "Documentação preparada conforme a finalidade informada.",
  },
];

const steps = [
  "Envie sua solicitação",
  "Acompanhe a análise",
  "Revise a prévia",
  "Conclua o pagamento",
  "Receba o documento final",
];

export default function Home() {
  return (
    <div className="mc-home-shell">
      <Header />

      <main>
        <section className="mc-hero relative overflow-hidden">
          <div className="mc-grid" aria-hidden="true" />
          <div className="mc-orb mc-orb-one" aria-hidden="true" />
          <div className="mc-orb mc-orb-two" aria-hidden="true" />
          <div className="mc-scanline" aria-hidden="true" />

          <div className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-7 lg:grid-cols-[1.03fr_.97fr] lg:px-8 lg:py-20">
            <div className="relative z-10 text-center lg:text-left">
              <div className="mc-pill mx-auto lg:mx-0">
                <span className="mc-live-dot" />
                Atendimento médico 100% online
              </div>

              <h1 className="mt-7 text-[2.65rem] font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.65rem]">
                Documentos médicos
                <span className="mc-gradient-text mt-2 block">
                  rápidos, seguros e profissionais
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8 lg:mx-0">
                Solicite atestados, receitas e laudos de forma online, com uma
                experiência organizada do pedido até a entrega do documento.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-3xl">
                {trustItems.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="mc-trust-mini">
                    <Icon size={21} aria-hidden="true" />
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/solicitar" className="mc-primary-cta">
                  <span>Solicitar atendimento</span>
                  <span className="mc-cta-arrow">
                    <ArrowRight size={20} />
                  </span>
                </Link>

                <a href="#como-funciona" className="mc-secondary-cta">
                  <Sparkles size={18} />
                  Como funciona
                  <ArrowRight size={17} />
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[590px] lg:max-w-none">
              <div className="mc-doc-stage" aria-hidden="true">
                <div className="mc-ring mc-ring-one" />
                <div className="mc-ring mc-ring-two" />
                <div className="mc-ring mc-ring-three" />
                <span className="mc-particle mc-particle-1" />
                <span className="mc-particle mc-particle-2" />
                <span className="mc-particle mc-particle-3" />
                <span className="mc-particle mc-particle-4" />

                <div className="mc-doc-card">
                  <div className="mc-doc-gloss" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">
                        MedClick • verificação digital
                      </span>
                      <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                        Documento médico
                        <br />
                        <span className="text-teal-600">verificável</span>
                      </h2>
                    </div>
                    <span className="mc-doc-seal">
                      <BadgeCheck size={30} />
                    </span>
                  </div>

                  <div className="mt-7 space-y-4">
                    <div className="mc-doc-check">
                      <CheckCircle2 size={20} />
                      <div>
                        <strong>Assinatura digital</strong>
                        <span>Quando aplicável ao documento emitido</span>
                      </div>
                    </div>
                    <div className="mc-doc-check">
                      <CheckCircle2 size={20} />
                      <div>
                        <strong>QR Code de verificação</strong>
                        <span>Consulta rápida das informações de validação</span>
                      </div>
                    </div>
                    <div className="mc-doc-check">
                      <CheckCircle2 size={20} />
                      <div>
                        <strong>Acompanhamento seguro</strong>
                        <span>Do pedido até o documento final</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-end justify-between gap-5 border-t border-slate-200 pt-6">
                    <div className="min-w-0 flex-1">
                      <div className="mc-signature-line" />
                      <span className="mt-2 block text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Médico responsável
                      </span>
                    </div>
                    <div className="mc-qr">
                      <QrCode size={54} strokeWidth={1.45} />
                    </div>
                  </div>
                </div>

                <div className="mc-stage-base" />
              </div>
            </div>
          </div>
        </section>

        <section id="documentos" className="mc-section-dark relative overflow-hidden py-20 sm:py-24">
          <div className="mc-wave" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-7 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mc-section-kicker">Serviços MedClick</span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
                Solicite o documento que precisa
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
                Um fluxo único, responsivo e acompanhado pela plataforma.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {services.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="mc-service-card" style={{ animationDelay: `${index * 0.35}s` }}>
                  <div className="mc-service-icon"><Icon size={28} /></div>
                  <h3 className="mt-6 text-xl font-black text-white">{title}</h3>
                  <p className="mt-3 min-h-14 text-sm leading-6 text-slate-400">{description}</p>
                  <Link href="/solicitar" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-teal-300 transition hover:gap-3 hover:text-teal-200">
                    Solicitar agora <ArrowRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mc-section-deep py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
              <div>
                <span className="mc-section-kicker">Fluxo transparente</span>
                <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Você acompanha cada etapa
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                  O MedClick mantém o andamento visível para que você saiba o que já foi concluído e qual é o próximo passo.
                </p>

                <div className="mt-8 rounded-[26px] border border-teal-400/20 bg-[rgba(45,212,191,0.06)] p-5 text-sm leading-6 text-slate-300 backdrop-blur">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 shrink-0 text-teal-300" size={22} />
                    <p>
                      Documentos finais podem contar com assinatura digital e QR Code de verificação, conforme o tipo de emissão e a avaliação do profissional responsável.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mc-progress-panel">
                {steps.map((step, index) => (
                  <div key={step} className="mc-progress-row">
                    <span className="mc-progress-number">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <strong>{step}</strong>
                      <div className="mc-progress-track"><span style={{ animationDelay: `${index * 0.45}s` }} /></div>
                    </div>
                    <FileCheck2 size={19} className="text-teal-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="seguranca" className="mc-section-dark pb-28 pt-6 sm:pb-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:px-8">
            <div className="mc-security-banner">
              <div className="mc-shield-glow"><ShieldCheck size={38} /></div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-[.18em] text-teal-300">Segurança e autenticidade</span>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Documentos com validação e rastreabilidade</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                  A plataforma organiza dados, acompanhamento, arquivos e etapas de validação em um único ambiente protegido.
                </p>
              </div>
              <Link href="/solicitar" className="mc-outline-button">Solicitar atendimento <ArrowRight size={17} /></Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
