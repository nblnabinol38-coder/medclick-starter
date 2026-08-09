"use client";

import "@/app/mobile-premium.css";

import "@/app/patient-clinic.css";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  Hospital,
  Building2,
  MapPin,
  LoaderCircle,
  LockKeyhole,
  Pill,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  Suspense,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import LogoutButton from "@/components/patient/LogoutButton";

type ServiceType =
  | "MEDICAL_CERTIFICATE"
  | "PRESCRIPTION"
  | "MEDICAL_REPORT";

type UnitType = "UPA" | "UNIMED";
type ProviderType = "UPA" | "UNIMED" | "HAPVIDA";

type PatientMode = "SELF" | "OTHER";

type PatientProfile = {
  id: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  motherName: string;
  phone: string;
  email: string;
  address: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
};

type MeResponse = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  patient?: PatientProfile | null;
  request?: {
    id: string;
    protocol: string;
    status: string;
  } | null;
};

type CreateResponse = {
  success: boolean;
  message?: string;
  request?: {
    id: string;
    protocol: string;
  };
};

const SERVICES = [
  {
    id: "MEDICAL_CERTIFICATE" as const,
    title: "Atestado médico",
    subtitle: "Afastamento e justificativa",
    description:
      "Informe o período necessário e os dados clínicos para análise do atendimento.",
    icon: Stethoscope,
    price: "a partir de R$ 60",
    tone:
      "from-cyan-500 to-teal-500 shadow-cyan-200/60",
  },
  {
    id: "PRESCRIPTION" as const,
    title: "Receita médica",
    subtitle: "Prescrição e continuidade",
    description:
      "Informe medicamento, dosagem e orientação atual para análise do pedido.",
    icon: Pill,
    price: "R$ 100",
    tone:
      "from-violet-500 to-indigo-500 shadow-violet-200/60",
  },
  {
    id: "MEDICAL_REPORT" as const,
    title: "Laudo médico",
    subtitle: "Documento detalhado",
    description:
      "Informe a finalidade do laudo e o contexto clínico necessário para avaliação.",
    icon: FileText,
    price: "R$ 280",
    tone:
      "from-blue-500 to-cyan-500 shadow-blue-200/60",
  },
];

function centsFor(
  type: ServiceType,
  days: number,
) {
  if (type === "PRESCRIPTION") return 10000;
  if (type === "MEDICAL_REPORT") return 28000;

  if (days <= 3) return 6000;
  if (days <= 7) return 8000;
  return 12000;
}

function documentApiType(type: ServiceType) {
  if (type === "MEDICAL_CERTIFICATE") return "ATESTADO";
  if (type === "PRESCRIPTION") return "RECEITA";
  return "LAUDO";
}

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function dateForInput(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function SolicitarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2>(1);
  const [service, setService] =
    useState<ServiceType | null>(null);

  const [profile, setProfile] =
    useState<PatientProfile | null>(null);

  const [patientMode, setPatientMode] =
    useState<PatientMode>("SELF");

  const [otherPatient, setOtherPatient] =
    useState({
      fullName: "",
      cpf: "",
      birthDate: "",
      motherName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
    });

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [certificateDays, setCertificateDays] =
    useState(1);

  const [unitType, setUnitType] =
    useState<UnitType>("UNIMED");
  const [providerSelected, setProviderSelected] =
    useState<ProviderType | null>(null);
  const [upaDetails, setUpaDetails] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [medication, setMedication] = useState({
    name: "",
    dosage: "",
    pharmaceuticalForm: "Comprimido",
    boxQuantity: 1,
    instructions: "",
    notes: "",
  });

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [showSubmitAnimation, setShowSubmitAnimation] =
    useState(false);
  const [successProtocol, setSuccessProtocol] =
    useState("");

  useEffect(() => {
    const requested = searchParams.get("servico");
    const requestedProvider =
      searchParams.get("unidade")?.toUpperCase();

    if (
      requestedProvider === "UPA" ||
      requestedProvider === "UNIMED" ||
      requestedProvider === "HAPVIDA"
    ) {
      setProviderSelected(
        requestedProvider as ProviderType,
      );
      setUnitType(
        requestedProvider === "UPA"
          ? "UPA"
          : "UNIMED",
      );
    }

    if (requested === "atestado") {
      setService("MEDICAL_CERTIFICATE");

      if (requestedProvider) {
        setStep(2);
      }
    } else if (
      requested === "receita" &&
      requestedProvider !== "HAPVIDA"
    ) {
      setService("PRESCRIPTION");

      if (requestedProvider) {
        setStep(2);
      }
    } else if (
      requested === "laudo" &&
      requestedProvider !== "HAPVIDA"
    ) {
      setService("MEDICAL_REPORT");

      if (requestedProvider) {
        setStep(2);
      }
    } else if (
      requestedProvider === "HAPVIDA"
    ) {
      setService("MEDICAL_CERTIFICATE");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(
          "/api/paciente/me",
          { cache: "no-store" },
        );

        const contentType =
          response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `A API do paciente respondeu em formato inesperado (${response.status}).`,
          );
        }

        const data =
          (await response.json()) as MeResponse;

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Não foi possível carregar seus dados.",
          );
        }

        setProfile(data.patient ?? null);

        if (
          data.request &&
          data.request.status !== "CANCELLED" &&
          data.request.status !== "COMPLETED"
        ) {
          router.replace("/paciente");
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar seus dados.",
        );
      } finally {
        setLoadingProfile(false);
      }
    }

    void loadProfile();
  }, [router]);

  const priceCents = useMemo(
    () =>
      service
        ? centsFor(service, certificateDays)
        : 0,
    [service, certificateDays],
  );

  function selectProvider(
    provider: ProviderType,
  ) {
    setProviderSelected(provider);
    setUnitType(
      provider === "UPA"
        ? "UPA"
        : "UNIMED",
    );

    if (
      provider === "HAPVIDA" &&
      service &&
      service !== "MEDICAL_CERTIFICATE"
    ) {
      setService(null);
    }

    setError("");

    window.setTimeout(() => {
      document
        .getElementById("escolha-servico")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 40);
  }

  function selectService(type: ServiceType) {
    if (!providerSelected) {
      setError(
        "Escolha primeiro a unidade: UPA 24h, Unimed ou Hapvida.",
      );
      return;
    }

    if (
      providerSelected === "HAPVIDA" &&
      type !== "MEDICAL_CERTIFICATE"
    ) {
      setError(
        "Na Hapvida, a MedClick disponibiliza somente Atestado Médico.",
      );
      return;
    }

    setService(type);
    setError("");
    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setShowSubmitAnimation(true);

    if (!service) {
      setStep(1);
      return;
    }

    if (patientMode === "SELF" && !profile) {
      setError(
        "Seus dados cadastrados ainda não estão disponíveis. Escolha “Outra pessoa” e preencha os dados para continuar.",
      );
      return;
    }

    const formData = new FormData(
      event.currentTarget,
    );

    const value = (name: string) =>
      String(formData.get(name) ?? "").trim();

    const selectedPatient =
      patientMode === "SELF"
        ? profile
        : otherPatient;

    if (!selectedPatient) {
      setError(
        "Não foi possível identificar os dados do paciente.",
      );
      return;
    }

    if (patientMode === "OTHER") {
      const requiredPatientFields = [
        otherPatient.fullName,
        otherPatient.cpf,
        otherPatient.birthDate,
        otherPatient.motherName,
        otherPatient.phone,
        otherPatient.email,
        otherPatient.address,
      ];

      if (
        requiredPatientFields.some(
          (field) => !String(field).trim(),
        )
      ) {
        setError(
          "Preencha os dados obrigatórios da pessoa que será atendida.",
        );
        return;
      }
    }

    const cid = value("cid");
    const symptoms = value("symptoms");
    const reportPurpose = value("reportPurpose");
    const reportDescription =
      value("reportDescription");
    const preferredTime = value("preferredTime");
    const additionalNotes =
      value("additionalNotes");

    if (
      providerSelected === "UPA" &&
      (
        !upaDetails.name.trim() ||
        !upaDetails.address.trim() ||
        !upaDetails.city.trim() ||
        !upaDetails.state.trim()
      )
    ) {
      setError(
        "Informe o nome, endereço, cidade e UF da UPA.",
      );
      setShowSubmitAnimation(false);
      return;
    }

    if (
      service === "PRESCRIPTION" &&
      (!medication.name.trim() ||
        !medication.dosage.trim() ||
        !medication.instructions.trim())
    ) {
      setError(
        "Preencha nome, dosagem e orientação do medicamento.",
      );
      return;
    }

    if (
      service === "MEDICAL_REPORT" &&
      (!reportPurpose || !reportDescription)
    ) {
      setError(
        "Informe a finalidade e a descrição do laudo.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        fullName: selectedPatient.fullName.trim(),
        cpf: selectedPatient.cpf.replace(/\D/g, ""),
        birthDate: dateForInput(
          selectedPatient.birthDate,
        ),
        motherName: selectedPatient.motherName.trim(),
        phone: selectedPatient.phone.trim(),
        email: selectedPatient.email.trim(),
        address: selectedPatient.address.trim(),
        city: selectedPatient.city?.trim() ?? "",
        state: selectedPatient.state?.trim() ?? "",
        postalCode:
          selectedPatient.postalCode?.trim() ?? "",

        documentType: documentApiType(service),

        certificatePeriod:
          service === "MEDICAL_CERTIFICATE"
            ? `${certificateDays} ${
                certificateDays === 1
                  ? "dia"
                  : "dias"
              }`
            : undefined,

        certificateDays:
          service === "MEDICAL_CERTIFICATE"
            ? certificateDays
            : undefined,

        reportPurpose:
          service === "MEDICAL_REPORT"
            ? reportPurpose
            : undefined,

        reportDescription:
          service === "MEDICAL_REPORT"
            ? reportDescription
            : undefined,

        medications:
          service === "PRESCRIPTION"
            ? [
                {
                  name: medication.name.trim(),
                  dosage:
                    medication.dosage.trim(),
                  pharmaceuticalForm:
                    medication.pharmaceuticalForm.trim(),
                  boxQuantity:
                    medication.boxQuantity,
                  instructions:
                    medication.instructions.trim(),
                  notes:
                    medication.notes.trim() ||
                    null,
                },
              ]
            : [],

        cid:
          service === "PRESCRIPTION"
            ? undefined
            : cid,

        symptoms:
          service === "PRESCRIPTION"
            ? "Solicitação de receita médica."
            : symptoms ||
              "Informações fornecidas pelo paciente no portal.",

        preferredTime,

        additionalNotes:
          service === "MEDICAL_CERTIFICATE"
            ? undefined
            : additionalNotes,

        unitType,
        providerNetwork: providerSelected,
        unitName:
          providerSelected === "UPA"
            ? [
                upaDetails.name.trim(),
                upaDetails.address.trim(),
                [
                  upaDetails.city.trim(),
                  upaDetails.state.trim(),
                ]
                  .filter(Boolean)
                  .join(" / "),
                upaDetails.postalCode.trim(),
              ]
                .filter(Boolean)
                .join(" · ")
            : providerSelected === "HAPVIDA"
              ? "Hapvida"
              : "Unimed",

        priceCents,

        attachments: [],
      };

      const response = await fetch(
        "/api/solicitacoes",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const contentType =
        response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `A API de solicitações respondeu em formato inesperado (${response.status}).`,
        );
      }

      const data =
        (await response.json()) as CreateResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.request
      ) {
        throw new Error(
          data.message ||
            "Não foi possível criar sua solicitação.",
        );
      }

      setSuccessProtocol(
        data.request.protocol,
      );

      if (typeof BroadcastChannel !== "undefined") {
        const channel =
          new BroadcastChannel("saudeclick-realtime");

        channel.postMessage({
          type: "request-created",
          requestId: data.request.id,
          protocol: data.request.protocol,
          at: Date.now(),
        });

        channel.close();
      }

      window.setTimeout(() => {
        router.replace("/paciente");
        router.refresh();
      }, 1900);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao criar sua solicitação.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (successProtocol) {
    return (
      <main className="patient-clinic-shell mobile-premium-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="service-success-orbit service-success-orbit-a" />
        <div className="service-success-orbit service-success-orbit-b" />

        <section className="service-success relative w-full max-w-lg rounded-[30px] border border-emerald-100 bg-white p-8 text-center shadow-[0_28px_100px_rgba(16,185,129,.14)]">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CheckCircle2 size={46} />
          </div>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700">
            <Sparkles size={13} />
            Solicitação criada
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight">
            Tudo pronto
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Protocolo{" "}
            <strong className="text-slate-800">
              {successProtocol}
            </strong>
            . Estamos abrindo o acompanhamento.
          </p>

          <div className="mx-auto mt-7 max-w-sm overflow-hidden rounded-full bg-slate-100 p-1">
            <div className="service-success-progress h-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          </div>
        </section>

        <Styles />
      </main>
    );
  }

  return (
    <main className="patient-clinic-shell min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-teal-100/80 bg-white/86 shadow-[0_8px_28px_rgba(15,118,110,.04)] backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/paciente"
            className="flex items-center gap-2 text-xs font-black text-slate-600 transition hover:text-teal-700"
          >
            <ArrowLeft size={16} />
            Área do paciente
          </Link>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-200">
              <HeartPulse size={18} />
            </span>
            <div>
              <strong className="block text-sm font-black">
                MedClick
              </strong>
              <span className="block text-[8px] font-black uppercase tracking-[.14em] text-teal-700">
                Nova solicitação
              </span>
            </div>
          </div>

          <LogoutButton compact />
        </div>
      </header>

      <section className="patient-content-grid max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
              Atendimento
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {step === 1
                ? "Escolha o serviço"
                : "Complete sua solicitação"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {step === 1
                ? "Selecione o documento que precisa. Na etapa seguinte você confirma as informações do atendimento."
                : "Seus dados cadastrais já estão vinculados à sua conta. Preencha apenas as informações desta solicitação."}
            </p>
          </div>

          <div className="hidden rounded-2xl border border-slate-200 bg-white p-1 sm:flex">
            <StepPill
              number={1}
              label="Serviço"
              active={step === 1}
              done={step === 2}
            />
            <StepPill
              number={2}
              label="Formulário"
              active={step === 2}
            />
          </div>
        </div>

        {loadingProfile ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-[26px] border border-slate-200 bg-white">
            <div className="text-center">
              <LoaderCircle
                className="mx-auto animate-spin text-teal-600"
                size={32}
              />
              <p className="mt-3 text-xs font-bold text-slate-500">
                Carregando seus dados...
              </p>
            </div>
          </div>
        ) : step === 1 ? (
          <section className="request-mobile-stack">
            <div className="mobile-request-intro rounded-[28px] border border-teal-100 bg-white p-5 shadow-[0_18px_55px_rgba(15,118,110,.08)] sm:p-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-teal-700">
                <Sparkles size={12} />
                Nova solicitação
              </span>

              <h2 className="mt-4 text-2xl font-black tracking-[-.035em] text-slate-950 sm:text-3xl">
                Onde você quer emitir seu documento?
              </h2>

              <p className="mt-2 max-w-2xl text-[11px] leading-5 text-slate-500 sm:text-xs">
                Comece escolhendo a unidade. Depois mostramos somente as opções necessárias para você preencher com rapidez no celular.
              </p>

              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <ProviderChoice
                  provider="UPA"
                  selected={providerSelected === "UPA"}
                  title="UPA 24h"
                  eyebrow="Pronto atendimento"
                  description="Emissão vinculada ao atendimento em Unidade de Pronto Atendimento."
                  icon={Hospital}
                  tone="cyan"
                  onClick={() => selectProvider("UPA")}
                />

                <ProviderChoice
                  provider="UNIMED"
                  selected={providerSelected === "UNIMED"}
                  title="Unimed"
                  eyebrow="Rede credenciada"
                  description="Documentos vinculados ao atendimento e unidades da rede Unimed."
                  icon={Building2}
                  tone="green"
                  onClick={() => selectProvider("UNIMED")}
                />

                <ProviderChoice
                  provider="HAPVIDA"
                  selected={providerSelected === "HAPVIDA"}
                  title="Hapvida"
                  eyebrow="Somente atestado"
                  description="Para Hapvida, a solicitação disponível é exclusivamente Atestado Médico."
                  icon={HeartPulse}
                  tone="violet"
                  badge="Somente Atestado"
                  onClick={() => selectProvider("HAPVIDA")}
                />
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 p-3.5">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0 text-teal-600"
                />
                <p className="text-[9px] leading-4 text-slate-600">
                  Você pode solicitar pela MedClick para <strong>UPA 24h, Unimed e Hapvida</strong>. Na Hapvida, somente Atestado Médico fica disponível.
                </p>
              </div>
            </div>

            <div
              id="escolha-servico"
              className={`clinic-glass scroll-mt-24 rounded-[28px] p-4 transition duration-500 sm:p-5 ${
                providerSelected
                  ? "opacity-100"
                  : "pointer-events-none opacity-45"
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-[.14em] text-teal-700">
                    Passo 2
                  </span>
                  <h3 className="mt-1 text-lg font-black text-slate-950">
                    Qual documento você precisa?
                  </h3>
                </div>

                {providerSelected && (
                  <span className="rounded-full border border-teal-100 bg-white px-3 py-1.5 text-[9px] font-black text-teal-700 shadow-sm">
                    {providerSelected === "UPA"
                      ? "UPA 24h"
                      : "Unimed"}
                  </span>
                )}
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {SERVICES.map((item, index) => {
                  const Icon = item.icon;
                  const blocked =
                    providerSelected === "HAPVIDA" &&
                    item.id !== "MEDICAL_CERTIFICATE";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        !blocked &&
                        selectService(item.id)
                      }
                      disabled={blocked}
                      aria-disabled={blocked}
                      className={`service-card-mobile group relative overflow-hidden rounded-[22px] border p-4 text-left shadow-[0_8px_26px_rgba(15,23,42,.05)] transition duration-300 sm:p-5 ${
                        blocked
                          ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-45"
                          : "border-slate-200 bg-white hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_18px_45px_rgba(20,184,166,.10)]"
                      }`}
                      style={{
                        animationDelay: `${index * 70}ms`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-md transition duration-300 group-hover:scale-105`}
                        >
                          <Icon size={21} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="block text-[8px] font-black uppercase tracking-[.12em] text-teal-700">
                            {item.subtitle}
                          </span>
                          <h2 className="mt-0.5 text-[15px] font-black text-slate-950">
                            {item.title}
                          </h2>
                        </div>

                        <ChevronRight
                          size={16}
                          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-500"
                        />
                      </div>

                      <p className="mt-3 text-[10px] leading-5 text-slate-500">
                        {item.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[9px] font-black text-slate-900">
                          {item.price}
                        </span>
                        <span className={`text-[9px] font-black ${
                          blocked
                            ? "text-slate-400"
                            : "text-teal-700"
                        }`}>
                          {blocked
                            ? "Indisponível na Hapvida"
                            : "Continuar"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <form
            onSubmit={submit}
            className="service-form grid gap-4 lg:grid-cols-[1fr_320px]"
          >
            <div className="space-y-4">
              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <SectionTitle
                    icon={UserRound}
                    eyebrow="Paciente"
                    title="Quem será atendido?"
                  />
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    Trocar serviço
                  </button>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Use os dados cadastrados na sua conta ou informe os dados de outra pessoa somente para esta solicitação.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <PatientModeCard
                    title="Usar meus dados"
                    description={
                      profile
                        ? `Atendimento para ${profile.fullName}.`
                        : "Seus dados cadastrados ainda não estão disponíveis."
                    }
                    selected={patientMode === "SELF"}
                    disabled={!profile}
                    onClick={() =>
                      profile &&
                      setPatientMode("SELF")
                    }
                  />

                  <PatientModeCard
                    title="Outra pessoa"
                    description="Preencher manualmente os dados do paciente para esta solicitação."
                    selected={patientMode === "OTHER"}
                    onClick={() =>
                      setPatientMode("OTHER")
                    }
                  />
                </div>

                {patientMode === "SELF" ? (
                  profile ? (
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      <ReadOnlyData
                        label="Nome"
                        value={profile.fullName}
                      />
                      <ReadOnlyData
                        label="CPF"
                        value={profile.cpf}
                      />
                      <ReadOnlyData
                        label="Nascimento"
                        value={dateForInput(
                          profile.birthDate,
                        )}
                      />
                      <ReadOnlyData
                        label="Nome da mãe"
                        value={profile.motherName}
                      />
                      <ReadOnlyData
                        label="E-mail"
                        value={profile.email}
                      />
                      <ReadOnlyData
                        label="Telefone"
                        value={profile.phone}
                      />
                      <ReadOnlyData
                        label="Endereço"
                        value={profile.address}
                      />
                      <ReadOnlyData
                        label="Cidade / UF"
                        value={[
                          profile.city,
                          profile.state,
                        ]
                          .filter(Boolean)
                          .join(" / ")}
                      />
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                      Seus dados cadastrados ainda não estão vinculados. Selecione <strong>Outra pessoa</strong> para preencher manualmente e continuar.
                    </div>
                  )
                ) : (
                  <div className="other-patient-enter mt-5">
                    <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50/70 px-3 py-3 text-[10.5px] leading-5 text-cyan-800">
                      Estes dados serão usados somente nesta solicitação e não substituem os dados da sua conta.
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <PatientInput
                        label="Nome completo"
                        value={otherPatient.fullName}
                        onChange={(value) =>
                          setOtherPatient(
                            (current) => ({
                              ...current,
                              fullName: value,
                            }),
                          )
                        }
                        placeholder="Nome completo do paciente"
                      />

                      <PatientInput
                        label="CPF"
                        value={otherPatient.cpf}
                        onChange={(value) =>
                          setOtherPatient(
                            (current) => ({
                              ...current,
                              cpf: value,
                            }),
                          )
                        }
                        placeholder="000.000.000-00"
                      />

                      <PatientInput
                        label="Data de nascimento"
                        type="date"
                        value={
                          otherPatient.birthDate
                        }
                        onChange={(value) =>
                          setOtherPatient(
                            (current) => ({
                              ...current,
                              birthDate: value,
                            }),
                          )
                        }
                      />

                      <PatientInput
                        label="Nome da mãe"
                        value={
                          otherPatient.motherName
                        }
                        onChange={(value) =>
                          setOtherPatient(
                            (current) => ({
                              ...current,
                              motherName: value,
                            }),
                          )
                        }
                        placeholder="Nome completo da mãe"
                      />

                      <PatientInput
                        label="Telefone"
                        type="tel"
                        value={otherPatient.phone}
                        onChange={(value) =>
                          setOtherPatient(
                            (current) => ({
                              ...current,
                              phone: value,
                            }),
                          )
                        }
                        placeholder="(00) 00000-0000"
                      />

                      <PatientInput
                        label="E-mail"
                        type="email"
                        value={otherPatient.email}
                        onChange={(value) =>
                          setOtherPatient(
                            (current) => ({
                              ...current,
                              email: value,
                            }),
                          )
                        }
                        placeholder="email@exemplo.com"
                      />

                      <div className="sm:col-span-2">
                        <PatientInput
                          label="Endereço"
                          value={
                            otherPatient.address
                          }
                          onChange={(value) =>
                            setOtherPatient(
                              (current) => ({
                                ...current,
                                address: value,
                              }),
                            )
                          }
                          placeholder="Rua, número, complemento"
                        />
                      </div>

                      <PatientInput
                        label="Cidade"
                        required={false}
                        value={otherPatient.city}
                        onChange={(value) =>
                          setOtherPatient(
                            (current) => ({
                              ...current,
                              city: value,
                            }),
                          )
                        }
                        placeholder="Cidade"
                      />

                      <PatientInput
                        label="UF"
                        required={false}
                        value={otherPatient.state}
                        onChange={(value) =>
                          setOtherPatient(
                            (current) => ({
                              ...current,
                              state: value
                                .toUpperCase()
                                .slice(0, 2),
                            }),
                          )
                        }
                        placeholder="SC"
                      />

                      <PatientInput
                        label="CEP"
                        required={false}
                        value={
                          otherPatient.postalCode
                        }
                        onChange={(value) =>
                          setOtherPatient(
                            (current) => ({
                              ...current,
                              postalCode: value,
                            }),
                          )
                        }
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionTitle
                  icon={ReceiptText}
                  eyebrow="Detalhes"
                  title={
                    SERVICES.find(
                      (item) =>
                        item.id === service,
                    )?.title ??
                    "Solicitação"
                  }
                />

                <div className="mt-5 space-y-4">
                  <div className="rounded-[22px] border border-teal-100 bg-gradient-to-r from-teal-50/85 via-white to-cyan-50/70 p-4 shadow-[0_12px_32px_rgba(15,118,110,.06)]">
                    <div className="flex items-center gap-3">
                      <span
                        className={`sc-float flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
                          providerSelected === "UPA"
                            ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                            : providerSelected === "HAPVIDA"
                              ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                              : "bg-gradient-to-br from-emerald-500 to-green-600"
                        }`}
                      >
                        {providerSelected === "UPA" ? (
                          <Hospital size={21} />
                        ) : providerSelected === "HAPVIDA" ? (
                          <HeartPulse size={21} />
                        ) : (
                          <Building2 size={21} />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] font-black uppercase tracking-[.14em] text-teal-700">
                          Unidade já selecionada
                        </span>
                        <strong className="mt-0.5 block text-[13px] font-black text-slate-950">
                          {providerSelected === "UPA"
                            ? "UPA 24h"
                            : providerSelected === "HAPVIDA"
                              ? "Hapvida"
                              : "Unimed"}
                        </strong>
                        <span className="mt-0.5 block text-[9px] leading-4 text-slate-500">
                          Você escolheu esta unidade no início. Não precisa selecionar novamente.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setStep(1);
                          setProviderSelected(null);
                        }}
                        className="tap-target rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black text-slate-600 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
                      >
                        Alterar
                      </button>
                    </div>

                    <input type="hidden" name="unitType" value={unitType} />
                  </div>

                  {providerSelected === "UPA" && (
                    <div className="upa-address-card relative overflow-hidden rounded-[24px] border border-cyan-100 bg-white p-4 shadow-[0_16px_42px_rgba(14,165,233,.07)] sm:p-5">
                      <span className="sc-pulse pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-100/70 blur-xl" />

                      <div className="relative">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-100">
                            <MapPin size={19} />
                          </span>

                          <div>
                            <span className="text-[8px] font-black uppercase tracking-[.14em] text-cyan-700">
                              Endereço da UPA
                            </span>
                            <h3 className="mt-1 text-[14px] font-black text-slate-950">
                              Informe a unidade onde deseja emitir
                            </h3>
                            <p className="mt-1 text-[9px] leading-4 text-slate-500">
                              Esses dados identificam corretamente a UPA e podem ser utilizados no documento quando aplicável.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                          <PatientInput
                            label="Nome da UPA"
                            value={upaDetails.name}
                            onChange={(value) =>
                              setUpaDetails((current) => ({
                                ...current,
                                name: value,
                              }))
                            }
                            placeholder="Ex.: UPA 24h Bom Jardim"
                          />

                          <PatientInput
                            label="Endereço completo da UPA"
                            value={upaDetails.address}
                            onChange={(value) =>
                              setUpaDetails((current) => ({
                                ...current,
                                address: value,
                              }))
                            }
                            placeholder="Ex.: Rua das Flores, 123 - Centro"
                          />

                          <div className="grid grid-cols-[1fr_90px] gap-3">
                            <PatientInput
                              label="Cidade"
                              value={upaDetails.city}
                              onChange={(value) =>
                                setUpaDetails((current) => ({
                                  ...current,
                                  city: value,
                                }))
                              }
                              placeholder="Ex.: Fortaleza"
                            />

                            <PatientInput
                              label="UF"
                              value={upaDetails.state}
                              onChange={(value) =>
                                setUpaDetails((current) => ({
                                  ...current,
                                  state: value.toUpperCase().slice(0, 2),
                                }))
                              }
                              placeholder="CE"
                            />
                          </div>

                          <PatientInput
                            label="CEP"
                            required={false}
                            value={upaDetails.postalCode}
                            onChange={(value) =>
                              setUpaDetails((current) => ({
                                ...current,
                                postalCode: value,
                              }))
                            }
                            placeholder="00000-000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Horário desejado"
                      name="preferredTime"
                      placeholder="Ex.: manhã ou 14:00"
                      required={false}
                    />

                    {service !== "PRESCRIPTION" && (
                      <Field
                        label="CID, se informado"
                        name="cid"
                        placeholder="Ex.: F41"
                        required={false}
                      />
                    )}
                  </div>
                </div>

                {service ===
                  "MEDICAL_CERTIFICATE" && (
                  <div className="mt-5">
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Quantidade de dias
                    </span>

                    <div className="mt-2 grid grid-cols-7 gap-1.5 sm:grid-cols-14">
                      {Array.from(
                        { length: 14 },
                        (_, index) => index + 1,
                      ).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setCertificateDays(day)
                          }
                          className={`h-10 rounded-xl text-xs font-black transition ${
                            certificateDays ===
                            day
                              ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                              : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-200 hover:bg-teal-50"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <TextArea
                      label="Sintomas / motivo"
                      name="symptoms"
                      placeholder="Descreva de forma objetiva o motivo da solicitação."
                    />
                  </div>
                )}

                {service ===
                  "PRESCRIPTION" && (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ControlledField
                        label="Medicamento"
                        value={medication.name}
                        onChange={(value) =>
                          setMedication((current) => ({
                            ...current,
                            name: value,
                          }))
                        }
                        placeholder="Ex.: Dipirona"
                      />

                      <ControlledField
                        label="Dosagem"
                        value={medication.dosage}
                        onChange={(value) =>
                          setMedication((current) => ({
                            ...current,
                            dosage: value,
                          }))
                        }
                        placeholder="Ex.: 500 mg"
                      />

                      <ControlledField
                        label="Forma farmacêutica"
                        value={
                          medication.pharmaceuticalForm
                        }
                        onChange={(value) =>
                          setMedication((current) => ({
                            ...current,
                            pharmaceuticalForm:
                              value,
                          }))
                        }
                        placeholder="Ex.: comprimido"
                      />

                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                          Caixas
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={
                            medication.boxQuantity
                          }
                          onChange={(event) =>
                            setMedication((current) => ({
                              ...current,
                              boxQuantity:
                                Number(
                                  event.target.value,
                                ) || 1,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
                        />
                      </label>
                    </div>

                    <ControlledTextArea
                      label="Como utiliza"
                      value={
                        medication.instructions
                      }
                      onChange={(value) =>
                        setMedication((current) => ({
                          ...current,
                          instructions: value,
                        }))
                      }
                      placeholder="Ex.: 1 comprimido a cada 8 horas."
                    />

                    <TextArea
                      label="Observações adicionais"
                      name="additionalNotes"
                      required={false}
                      placeholder="Opcional."
                    />
                  </div>
                )}

                {service ===
                  "MEDICAL_REPORT" && (
                  <div className="mt-5 space-y-4">
                    <Field
                      label="Finalidade do laudo"
                      name="reportPurpose"
                      placeholder="Ex.: INSS, trabalho, concurso..."
                    />

                    <TextArea
                      label="Descrição"
                      name="reportDescription"
                      placeholder="Explique a finalidade e as informações que precisam ser analisadas."
                    />

                    <TextArea
                      label="Sintomas / contexto"
                      name="symptoms"
                      placeholder="Descreva o contexto clínico da solicitação."
                    />

                    <TextArea
                      label="Observações adicionais"
                      name="additionalNotes"
                      required={false}
                      placeholder="Opcional."
                    />
                  </div>
                )}
              </section>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  {error}
                </div>
              )}
            </div>

            <aside className="lg:sticky lg:top-[88px] lg:self-start">
              <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,.08)]">
                <div className="bg-gradient-to-br from-slate-950 to-[#0b2846] p-5 text-white">
                  <span className="text-[9px] font-black uppercase tracking-[.15em] text-cyan-300">
                    Resumo
                  </span>
                  <h2 className="mt-2 text-lg font-black">
                    Sua solicitação
                  </h2>
                </div>

                <div className="space-y-4 p-5">
                  <SummaryRow
                    label="Serviço"
                    value={
                      SERVICES.find(
                        (item) =>
                          item.id === service,
                      )?.title ?? "—"
                    }
                  />

                  <SummaryRow
                    label="Unidade"
                    value={
                      providerSelected === "UPA"
                        ? upaDetails.name || "UPA 24h"
                        : providerSelected === "HAPVIDA"
                          ? "Hapvida"
                          : "Unimed"
                    }
                  />

                  <SummaryRow
                    label="Paciente"
                    value={
                      patientMode === "SELF"
                        ? profile?.fullName ?? "Meus dados"
                        : otherPatient.fullName ||
                          "Outra pessoa"
                    }
                  />

                  {service ===
                    "MEDICAL_CERTIFICATE" && (
                    <SummaryRow
                      label="Período"
                      value={`${certificateDays} dia(s)`}
                    />
                  )}

                  <div className="rounded-2xl bg-teal-50 p-4">
                    <span className="text-[9px] font-black uppercase tracking-wide text-teal-700">
                      Valor
                    </span>
                    <strong className="mt-1 block text-2xl font-black text-slate-950">
                      {money(priceCents)}
                    </strong>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <BadgeCheck
                      className="mt-0.5 shrink-0 text-teal-600"
                      size={15}
                    />
                    <p className="text-[10px] leading-5 text-slate-500">
                      Depois de enviar, você acompanha todas as etapas na Área do Paciente.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      (patientMode === "SELF" &&
                        !profile)
                    }
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-teal-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <LoaderCircle
                        className="animate-spin"
                        size={16}
                      />
                    ) : (
                      <>
                        Enviar solicitação
                        <ArrowRight
                          className="transition group-hover:translate-x-1"
                          size={15}
                        />
                      </>
                    )}
                  </button>
                </div>
              </section>
            </aside>
          </form>
        )}
      </section>

      <Styles />
    </main>
  );
}

function StepPill({
  number,
  label,
  active,
  done = false,
}: {
  number: number;
  label: string;
  active: boolean;
  done?: boolean;
}) {
  return (
    <span
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black ${
        active
          ? "bg-teal-600 text-white"
          : done
            ? "bg-emerald-50 text-emerald-700"
            : "text-slate-400"
      }`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          active
            ? "bg-white/20"
            : done
              ? "bg-emerald-500 text-white"
              : "bg-slate-100"
        }`}
      >
        {done ? <Check size={11} /> : number}
      </span>
      {label}
    </span>
  );
}

function TrustBox({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="service-card flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
        <Icon size={18} />
      </span>
      <div>
        <strong className="block text-xs">
          {title}
        </strong>
        <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
          {text}
        </span>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: typeof UserRound;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
        <Icon size={18} />
      </span>
      <div>
        <span className="block text-[8px] font-black uppercase tracking-[.14em] text-teal-700">
          {eyebrow}
        </span>
        <h2 className="mt-0.5 text-base font-black">
          {title}
        </h2>
      </div>
    </div>
  );
}

function SubmissionStage({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof ShieldCheck;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
        <Icon size={16} />
      </span>
      <div>
        <strong className="block text-[10px] font-black text-white">
          {title}
        </strong>
        <span className="mt-0.5 block text-[8px] text-slate-400">
          {detail}
        </span>
      </div>
      <span className="ml-auto h-2.5 w-2.5 rounded-full bg-teal-300 shadow-[0_0_16px_rgba(94,234,212,.9)]" />
    </div>
  );
}

function ProviderChoice({
  provider,
  selected,
  title,
  eyebrow,
  description,
  icon: Icon,
  tone,
  badge,
  onClick,
}: {
  provider: ProviderType;
  selected: boolean;
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof Hospital;
  tone: "cyan" | "green" | "violet";
  badge?: string;
  onClick: () => void;
}) {
  const styles = {
    cyan: {
      border: selected ? "border-cyan-400" : "border-cyan-100",
      bg: selected
        ? "bg-gradient-to-br from-cyan-50 to-white"
        : "bg-white",
      logo: "from-cyan-500 to-blue-600",
      glow: "provider-glow-cyan",
      text: "text-cyan-700",
    },
    green: {
      border: selected ? "border-emerald-400" : "border-emerald-100",
      bg: selected
        ? "bg-gradient-to-br from-emerald-50 to-white"
        : "bg-white",
      logo: "from-emerald-500 to-green-600",
      glow: "provider-glow-green",
      text: "text-emerald-700",
    },
    violet: {
      border: selected ? "border-violet-400" : "border-violet-100",
      bg: selected
        ? "bg-gradient-to-br from-violet-50 to-white"
        : "bg-white",
      logo: "from-violet-500 to-indigo-600",
      glow: "provider-glow-violet",
      text: "text-violet-700",
    },
  } as const;

  const style = styles[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`provider-choice provider-choice-${provider.toLowerCase()} group relative min-h-[190px] overflow-hidden rounded-[26px] border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,.10)] ${style.border} ${style.bg}`}
    >
      <span
        className={`provider-halo absolute -right-8 -top-8 h-32 w-32 rounded-full ${style.glow}`}
      />
      <span className="provider-sweep absolute inset-y-[-30%] left-[-55px] w-8 rotate-[14deg] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      {badge && (
        <span className="absolute right-4 top-4 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[8px] font-black text-violet-700">
          {badge}
        </span>
      )}

      <div className="relative z-10">
        <span
          className={`provider-logo flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br ${style.logo} text-white shadow-xl`}
        >
          <Icon size={29} />
        </span>

        <span
          className={`mt-4 block text-[8px] font-black uppercase tracking-[.15em] ${style.text}`}
        >
          {eyebrow}
        </span>
        <strong className="mt-1 block text-xl font-black text-slate-950">
          {title}
        </strong>
        <p className="mt-1.5 max-w-[280px] text-[10px] leading-5 text-slate-500">
          {description}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className={`text-[9px] font-black ${style.text}`}>
            Escolher {title}
          </span>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border ${
              selected
                ? "border-teal-500 bg-teal-500 text-white"
                : "border-slate-200 bg-white text-slate-300"
            }`}
          >
            <Check size={13} />
          </span>
        </div>
      </div>
    </button>
  );
}

function PatientModeCard({
  title,
  description,
  selected,
  disabled = false,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group relative rounded-2xl border p-4 text-left transition duration-300 ${
        selected
          ? "border-teal-400 bg-teal-50 shadow-sm ring-4 ring-teal-50"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
      } ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-teal-600 bg-teal-600 text-white"
              : "border-slate-300 bg-white text-transparent"
          }`}
        >
          <Check size={11} />
        </span>

        <div>
          <strong className="block text-xs text-slate-900">
            {title}
          </strong>
          <span className="mt-1 block text-[10px] leading-4 text-slate-500">
            {description}
          </span>
        </div>
      </div>
    </button>
  );
}

function PatientInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        required={
          required
        }
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
      />
    </label>
  );
}

function ReadOnlyData({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <span className="block text-[8px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <strong className="mt-1 block truncate text-[11px] text-slate-800">
        {value || "—"}
      </strong>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
      />
    </label>
  );
}

function ControlledField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        name={name}
        required={required}
        rows={4}
        placeholder={placeholder}
        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
      />
    </label>
  );
}

function ControlledTextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={4}
        placeholder={placeholder}
        className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
      />
    </label>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
      <span className="text-[10px] font-bold text-slate-400">
        {label}
      </span>
      <strong className="text-right text-[11px] text-slate-800">
        {value}
      </strong>
    </div>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      @keyframes serviceEnter {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes otherPatientEnter {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .other-patient-enter {
        animation: otherPatientEnter 320ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      @keyframes serviceSuccess {
        from {
          opacity: 0;
          transform: scale(0.94) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes serviceSuccessProgress {
        from {
          width: 0;
        }
        to {
          width: 100%;
        }
      }

      @keyframes serviceOrbit {
        from {
          transform: scale(0.4);
          opacity: 0.6;
        }
        to {
          transform: scale(1.6);
          opacity: 0;
        }
      }

      .service-card,
      .service-form {
        animation: serviceEnter 420ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .service-success {
        animation: serviceSuccess 520ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .service-success-progress {
        animation: serviceSuccessProgress 1.8s
          ease-in-out forwards;
      }

      .service-success-orbit {
        position: absolute;
        height: 300px;
        width: 300px;
        border-radius: 9999px;
        border: 2px solid rgba(16, 185, 129, 0.15);
        animation: serviceOrbit 1.8s ease-out infinite;
      }

      .service-success-orbit-a {
        left: 8%;
        top: 10%;
      }

      .service-success-orbit-b {
        right: 8%;
        bottom: 10%;
        animation-delay: 500ms;
      }
    `}</style>
  );
}


export default function SolicitarPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm">
            <LoaderCircle className="animate-spin" size={18} />
            Carregando solicitação...
          </div>
        </main>
      }
    >
      <SolicitarPageContent />
    </Suspense>
  );
}
