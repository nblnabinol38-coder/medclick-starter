"use client";

import "@/app/mobile-premium.css";

import "@/app/patient-clinic.css";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Ban,
  Building2,
  Hospital,
  HeartPulse,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardPlus,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileText,
  HelpCircle,
  Home,
  LoaderCircle,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  X,
  QrCode,
  ReceiptText,
  UploadCloud,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import LogoutButton from "@/components/patient/LogoutButton";
import { supportWhatsAppUrl } from "@/lib/support";

type PatientRequest = {
  id: string;
  protocol: string;
  documentType:
    | "MEDICAL_CERTIFICATE"
    | "PRESCRIPTION"
    | "MEDICAL_REPORT";
  status: string;
  unitType?: "UPA" | "UNIMED";
  unitName?: string;
  reportPurpose: string | null;
  priceCents: number;
  cancelledAt: string | null;
  patientConfirmedPreview: boolean;
  previewConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documents: Array<{
    id: string;
    type: string;
    originalName: string;
    storageKey: string;
    version: number;
    createdAt: string;
  }>;
  payment: {
    id: string;
    status: string;
    amountCents: number;
    pixKey: string | null;
    receiverName: string | null;
    receiverDocument: string | null;
    qrCodePayload: string | null;
    qrCodeStorageKey: string | null;
    qrCodeSentAt: string | null;
    rejectionReason: string | null;
    reviewedAt: string | null;
    approvedAt: string | null;
    proofs: Array<{
      id: string;
      status: string;
      originalName: string;
      storageKey: string;
      mimeType: string;
      sizeBytes: number;
      patientNote: string | null;
      rejectionReason: string | null;
      reviewedAt: string | null;
      approvedAt: string | null;
      createdAt: string;
    }>;
  } | null;
};

type PatientResponse = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  patient?: {
    id: string;
    fullName: string;
    cpf: string;
    email: string;
  } | null;
  request?: PatientRequest | null;
};

const DOCUMENT_LABELS = {
  MEDICAL_CERTIFICATE: "Atestado médico",
  PRESCRIPTION: "Receita médica",
  MEDICAL_REPORT: "Laudo médico",
} as const;

function currency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Paciente";
}

function stageFromStatus(status: string) {
  if (status === "CANCELLED") return "CANCELLED";

  if (
    [
      "RECEIVED",
      "UNDER_REVIEW",
      "ADDITIONAL_INFORMATION_REQUIRED",
      "AI_DRAFT_IN_PREPARATION",
      "AI_DRAFT_READY",
      "ADMIN_REVIEW",
      "PREVIEW_IN_PREPARATION",
    ].includes(status)
  ) {
    return "PREVIEW_PREPARING";
  }

  if (
    [
      "PREVIEW_READY",
      "PREVIEW_SENT",
      "CORRECTION_REQUESTED",
    ].includes(status)
  ) {
    return "PREVIEW_READY";
  }

  if (
    [
      "PREVIEW_APPROVED",
      "WAITING_PAYMENT_REQUEST",
      "PAYMENT_REQUESTED",
      "PIX_QR_CODE_GENERATED",
      "PIX_QR_CODE_SENT",
      "WAITING_PAYMENT",
      "PAYMENT_PROOF_SENT",
      "PAYMENT_UNDER_REVIEW",
      "PAYMENT_REJECTED",
    ].includes(status)
  ) {
    return "WAITING_PAYMENT";
  }

  if (
    [
      "PAYMENT_APPROVED",
      "WAITING_MEDICAL_REVIEW",
      "WAITING_SIGNATURE",
      "FINAL_DOCUMENT_IN_PREPARATION",
      "FINAL_DOCUMENT_SIGNED",
      "FINAL_DOCUMENT_AUTHENTICATED",
    ].includes(status)
  ) {
    return "FINAL_PREPARING";
  }

  if (
    [
      "FINAL_DOCUMENT_AVAILABLE",
      "FINAL_DOCUMENT_SENT",
    ].includes(status)
  ) {
    return "FINAL_READY";
  }

  if (status === "COMPLETED") {
    return "COMPLETED";
  }

  return "PREVIEW_PREPARING";
}

export default function PacientePage() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] =
    useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [previewOpen, setPreviewOpen] =
    useState(false);
  const [confirmingPreview, setConfirmingPreview] =
    useState(false);
  const [previewActionError, setPreviewActionError] =
    useState("");
  const [previewConfirmedAnimation, setPreviewConfirmedAnimation] =
    useState(false);

  const [copiedPix, setCopiedPix] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState("");
  const [proofSuccessAnimation, setProofSuccessAnimation] = useState(false);

  const redirectStarted = useRef(false);

  async function loadPatient() {
    try {
      const response = await fetch("/api/paciente/me", {
        cache: "no-store",
      });

      const contentType =
        response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          response.status === 404
            ? "A API /api/paciente/me não foi encontrada. Verifique se app/api/paciente/me/route.ts existe."
            : `A API respondeu em formato inesperado (${response.status}).`,
        );
      }

      const result =
        (await response.json()) as PatientResponse;

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Não foi possível carregar sua área.",
        );
      }

      setData(result);

      if (
        result.request?.status === "CANCELLED" &&
        !redirectStarted.current
      ) {
        redirectStarted.current = true;
        setCancelled(true);

        window.setTimeout(() => {
          router.replace("/solicitar");
          router.refresh();
        }, 2800);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao carregar sua área.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function heartbeat() {
    try {
      await fetch("/api/presence/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: window.location.pathname,
        }),
      });
    } catch {
      // Presença nunca bloqueia o portal.
    }
  }

  async function copyPix(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedPix(true);
      window.setTimeout(() => setCopiedPix(false), 1800);
    } catch {
      setProofError("Não foi possível copiar automaticamente.");
    }
  }

  async function uploadPaymentProof() {
    if (!request || !proofFile) {
      setProofError("Selecione o comprovante antes de enviar.");
      return;
    }

    try {
      setUploadingProof(true);
      setProofError("");

      const formData = new FormData();
      formData.append("file", proofFile);
      formData.append("patientNote", proofNote);

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(request.id)}/comprovante-pagamento`,
        { method: "POST", body: formData },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Não foi possível enviar o comprovante.");
      }

      setProofFile(null);
      setProofNote("");
      setProofSuccessAnimation(true);
      await loadPatient();
      window.setTimeout(() => setProofSuccessAnimation(false), 2200);
    } catch (requestError) {
      setProofError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao enviar comprovante.",
      );
    } finally {
      setUploadingProof(false);
    }
  }

  async function confirmPreview() {
    if (!request || !preview) return;

    try {
      setConfirmingPreview(true);
      setPreviewActionError("");

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(
          request.id,
        )}/confirmar-previa`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-saudeclick-context": "patient",
          },
        },
      );

      const result =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Não foi possível confirmar a prévia.",
        );
      }

      setPreviewOpen(false);
      setPreviewConfirmedAnimation(true);

      await loadPatient();

      window.setTimeout(() => {
        setPreviewConfirmedAnimation(false);
      }, 2200);
    } catch (requestError) {
      setPreviewActionError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao confirmar a prévia.",
      );
    } finally {
      setConfirmingPreview(false);
    }
  }

  async function cancelOwnRequest() {
    if (!request) return;

    const confirmed = window.confirm(
      `Cancelar a solicitação ${request.protocol}?`,
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setCancelError("");

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(
          request.id,
        )}/cancelar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-saudeclick-context": "patient",
          },
          body: JSON.stringify({
            reason:
              "Solicitação cancelada pelo paciente através do portal.",
          }),
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Não foi possível cancelar a solicitação.",
        );
      }

      await loadPatient();
    } catch (requestError) {
      setCancelError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao cancelar solicitação.",
      );
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    void loadPatient();
    void heartbeat();

    const events =
      new EventSource(
        "/api/realtime/paciente",
      );

    const syncPatient = () => {
      void loadPatient();
    };

    events.addEventListener(
      "patient-changed",
      syncPatient,
    );

    const presenceInterval =
      window.setInterval(() => {
        void heartbeat();
      }, 10000);

    const channel =
      typeof BroadcastChannel !==
      "undefined"
        ? new BroadcastChannel(
            "saudeclick-realtime",
          )
        : null;

    channel?.addEventListener(
      "message",
      syncPatient,
    );

    const focusHandler = () => {
      void loadPatient();
      void heartbeat();
    };

    window.addEventListener(
      "focus",
      focusHandler,
    );

    const visibilityHandler = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void heartbeat();
      }
    };

    document.addEventListener(
      "visibilitychange",
      visibilityHandler,
    );

    return () => {
      events.close();
      window.clearInterval(
        presenceInterval,
      );
      channel?.close();
      window.removeEventListener(
        "focus",
        focusHandler,
      );
      document.removeEventListener(
        "visibilitychange",
        visibilityHandler,
      );
    };
  }, []);

  const request = data?.request ?? null;

  const stage = useMemo(
    () =>
      request
        ? stageFromStatus(request.status)
        : "EMPTY",
    [request],
  );

  if (cancelled) {
    return (
      <main className="patient-clinic-shell mobile-premium-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="cancel-wave cancel-wave-a" />
        <div className="cancel-wave cancel-wave-b" />

        <section className="cancelled-card relative w-full max-w-lg rounded-[30px] border border-red-100 bg-white p-8 text-center shadow-[0_30px_100px_rgba(239,68,68,.12)] sm:p-10">
          <div className="cancel-icon mx-auto flex h-28 w-28 items-center justify-center rounded-[30px] bg-red-50 text-red-600 ring-1 ring-red-100">
            <Ban size={50} />
          </div>

          <span className="mt-6 inline-flex rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-700">
            Solicitação cancelada
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
            Atendimento cancelado
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Esta solicitação foi cancelada. Você será levado para a escolha de um novo serviço.
          </p>

          <div className="mx-auto mt-7 max-w-sm overflow-hidden rounded-full bg-slate-100 p-1">
            <div className="cancel-progress h-2 rounded-full bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400">
            <LoaderCircle
              className="animate-spin"
              size={13}
            />
            Preparando nova solicitação...
          </div>
        </section>

  
      <nav className="mobile-bottom-nav mt-8 grid grid-cols-5 gap-1 px-3 py-2 md:hidden">
        <Link href="/paciente" className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black text-teal-700">
          <Home size={18} />
          Início
        </Link>
        <a href="#servicos" className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black text-slate-500">
          <ClipboardPlus size={18} />
          Serviços
        </a>
        <Link href="/solicitar" className="-mt-7 flex h-14 w-14 items-center justify-center justify-self-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-[0_14px_32px_rgba(20,184,166,.32)]">
          <Plus size={24} />
        </Link>
        <a href="#documentos" className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black text-slate-500">
          <FileText size={18} />
          Docs
        </a>
        <button type="button" className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[9px] font-black text-slate-500">
          <UserRound size={18} />
          Perfil
        </button>
      </nav>

      <PatientStyles />
      </main>
    );
  }

  if (loading && !data) {
    return (
      <main className="patient-clinic-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-teal-600"
            size={34}
          />
          <p className="mt-3 text-xs font-bold text-slate-500">
            Carregando sua área...
          </p>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="patient-clinic-shell flex min-h-screen items-center justify-center px-4">
        <section className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-7 text-center shadow-lg">
          <Ban
            className="mx-auto text-red-500"
            size={40}
          />
          <h1 className="mt-4 text-xl font-black">
            Não foi possível carregar
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void loadPatient()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  const displayName =
    data?.patient?.fullName ||
    data?.user?.name ||
    "Paciente";

  const preview = request?.documents.find(
    (document) => document.type === "PREVIEW",
  );

  const finalDocument = request?.documents.find(
    (document) =>
      document.type === "FINAL" ||
      document.type === "SIGNED_FINAL",
  );

  const payment = request?.payment ?? null;
  const latestProof = payment?.proofs?.[0] ?? null;

  const pixAvailable = Boolean(
    payment?.pixKey ||
      payment?.qrCodePayload ||
      payment?.qrCodeStorageKey,
  );

  const proofPending =
    payment?.status === "PROOF_SENT" ||
    payment?.status === "UNDER_REVIEW" ||
    request?.status === "PAYMENT_PROOF_SENT" ||
    request?.status === "PAYMENT_UNDER_REVIEW";

  const proofRejected =
    payment?.status === "REJECTED" ||
    request?.status === "PAYMENT_REJECTED";

  const paymentApproved =
    payment?.status === "APPROVED" ||
    request?.status === "PAYMENT_APPROVED" ||
    stage === "FINAL_PREPARING" ||
    stage === "FINAL_READY" ||
    stage === "COMPLETED";

  /*
   * Quando o atendimento termina, /paciente volta a funcionar como
   * HOME da Área do Paciente. O atendimento concluído não "prende"
   * mais o usuário na tela de conclusão.
   */

  return (
    <main className="patient-clinic-shell min-h-screen text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] flex-col bg-[linear-gradient(180deg,#07334a_0%,#075064_55%,#06354a_100%)] text-white shadow-[18px_0_55px_rgba(6,52,74,.16)] lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="clinic-pulse flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-teal-400 text-[#06354a] shadow-lg">
              <ShieldCheck size={22} />
            </span>
            <div>
              <strong className="block text-xl font-black tracking-tight">MedClick</strong>
              <span className="text-[8px] font-black uppercase tracking-[.18em] text-cyan-200">Área do paciente</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-5">
          <SideLink icon={Home} label="Início" active />
          <a href="#servicos" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[10px] font-black text-slate-200 transition hover:bg-white/10 hover:text-white">
            <ClipboardPlus size={15} /> Serviços
          </a>
          <a href="#documentos" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[10px] font-black text-slate-200 transition hover:bg-white/10 hover:text-white">
            <FileText size={15} /> Meus documentos
          </a>
          <a
            href={supportWhatsAppUrl("Olá! Preciso de ajuda na Área do Paciente do MedClick.")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[10px] font-black text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <HelpCircle size={15} /> Ajuda
          </a>
        </nav>

        <div id="ajuda" className="px-3 pb-3">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
            <div className="flex items-center gap-2 text-cyan-100">
              <MessageCircle size={14} />
              <strong className="text-[10px]">Precisa de ajuda?</strong>
            </div>
            <p className="mt-2 text-[9px] leading-4 text-slate-200/80">Use o suporte somente quando precisar. Todo o fluxo do atendimento acontece dentro do portal.</p>
          </div>
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><UserRound size={16} /></span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-[11px]">{firstName(displayName)}</strong>
              <span className="text-[9px] text-cyan-100/70">Paciente</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <section className="min-h-screen lg:pl-[228px]">
        <header className="sticky top-0 z-30 border-b border-teal-100/80 bg-white/86 px-4 py-3.5 backdrop-blur-2xl sm:px-6">
          <div className="mx-auto flex max-w-[1420px] items-center justify-between gap-4">
            <div>
              <span className="text-[8px] font-black uppercase tracking-[.18em] text-teal-700">Área do paciente</span>
              <h1 className="mt-0.5 text-lg font-black text-slate-950">Olá, {firstName(displayName)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-black text-emerald-700 sm:inline-flex">Conta ativa</span>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="patient-content-grid mobile-frame px-4 py-5 sm:px-6 sm:py-7">
          <section className="clinic-scene patient-enter grid gap-0 lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10 flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-teal-700 shadow-sm">
                <ShieldCheck size={13} /> Atendimento digital seguro
              </span>
              <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-[-.04em] text-slate-950 sm:text-4xl">
                Tudo do seu atendimento em um só lugar.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Solicite documentos, acompanhe a prévia, faça o pagamento e receba o documento final sem perder o andamento.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/solicitar" className="clinic-shimmer inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-6 py-3.5 text-xs font-black text-white shadow-[0_14px_35px_rgba(20,184,166,.22)] transition hover:-translate-y-0.5">
                  <ClipboardPlus size={16} /> Solicitar novo documento <ArrowRight size={14} />
                </Link>
                {finalDocument && (
                  <a href={finalDocument.storageKey} download={finalDocument.originalName} className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white/90 px-5 py-3.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-teal-50">
                    <Download size={15} /> Baixar último documento
                  </a>
                )}
              </div>

              <div className="mt-7 grid gap-2 sm:grid-cols-3">
                <MiniStep done label="Solicitação" helper="Dados enviados" />
                <MiniStep done={Boolean(preview)} label="Prévia" helper={preview ? "Disponível" : "Em preparação"} />
                <MiniStep done={stage === "FINAL_READY" || stage === "COMPLETED"} label="Documento" helper={finalDocument ? "Disponível" : "Aguardando"} />
              </div>
            </div>

            <div className="relative hidden min-h-[430px] lg:block">
              <div className="clinic-window clinic-float" />
              <div className="clinic-cabinet" />
              <div className="clinic-plant clinic-float" />
              <div className="absolute left-[8%] top-[17%] w-[250px] rounded-[24px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_60px_rgba(15,118,110,.11)] backdrop-blur-xl">
                <span className="clinic-pulse flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><Stethoscope size={22} /></span>
                <strong className="mt-4 block text-sm font-black text-slate-900">Sua clínica digital</strong>
                <p className="mt-2 text-[10px] leading-5 text-slate-500">Fluxo simples, acompanhamento claro e documentos sempre acessíveis na sua conta.</p>
              </div>
            </div>
          </section>

          <section id="servicos" className="mt-6">
            <div className="patient-network-head flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-[8px] font-black uppercase tracking-[.16em] text-teal-700">
                  Nossas unidades
                </span>
                <h2 className="mt-1 text-2xl font-black tracking-[-.03em] text-slate-950">
                  Escolha sua unidade de atendimento
                </h2>
                <p className="mt-1 text-[10px] leading-5 text-slate-500">
                  Selecione a unidade para começar sua solicitação.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <NetworkHomeCard
                title="UPA 24h"
                subtitle="Unidade de Pronto Atendimento"
                description="Atestado, receita ou laudo conforme o serviço selecionado."
                icon={Hospital}
                tone="cyan"
                href="/solicitar?unidade=UPA"
              />

              <NetworkHomeCard
                title="Unimed"
                subtitle="Rede credenciada"
                description="Solicite seus documentos para atendimento vinculado à rede Unimed."
                icon={Building2}
                tone="green"
                href="/solicitar?unidade=UNIMED"
              />

              <NetworkHomeCard
                title="Hapvida"
                subtitle="Somente Atestado Médico"
                description="Na Hapvida, o fluxo da MedClick está disponível exclusivamente para atestado."
                icon={HeartPulse}
                tone="violet"
                badge="Somente Atestado"
                href="/solicitar?unidade=HAPVIDA&servico=atestado"
              />
            </div>
          </section>

          <section className="mt-7 rounded-[28px] border border-slate-200 bg-white/92 p-5 shadow-[0_18px_55px_rgba(15,23,42,.05)] sm:p-6">
            <div>
              <span className="text-[8px] font-black uppercase tracking-[.16em] text-teal-700">
                Serviços
              </span>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                O que você precisa hoje?
              </h2>
              <p className="mt-1 text-[10px] text-slate-500">
                Escolha o documento. Na próxima tela você seleciona ou confirma a unidade.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ServiceHomeCard
                title="Atestado médico"
                description="Disponível para UPA 24h, Unimed e Hapvida."
                icon={FileCheck2}
                href="/solicitar?servico=atestado"
              />
              <ServiceHomeCard
                title="Receita médica"
                description="Disponível para as unidades compatíveis com o atendimento."
                icon={ReceiptText}
                href="/solicitar?servico=receita"
              />
              <ServiceHomeCard
                title="Laudo médico"
                description="Solicite seu laudo e acompanhe o processo pelo portal."
                icon={ClipboardPlus}
                href="/solicitar?servico=laudo"
              />
            </div>
          </section>

          {request ? (
            <section className="mt-6 grid gap-5 xl:grid-cols-[1.12fr_.88fr]">
              <div className="clinic-glass rounded-[28px] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[.14em] text-teal-700">Solicitação ativa</span>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{request.protocol}</h2>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {DOCUMENT_LABELS[request.documentType]} · {request.unitName?.toLowerCase().startsWith("hapvida")
                        ? "Hapvida"
                        : request.unitType === "UPA"
                          ? "UPA 24h"
                          : "Unimed"} · {currency(request.priceCents)}
                    </p>
                  </div>
                  <StatusBadge stage={stage} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ProgressBox active label="Solicitação recebida" done />
                  <ProgressBox active={stage === "PREVIEW_PREPARING" || stage === "PREVIEW_READY"} label="Prévia" done={Boolean(preview)} />
                  <ProgressBox active={stage === "WAITING_PAYMENT" || paymentApproved} label="Pagamento" done={paymentApproved} />
                </div>

                {stage === "PREVIEW_PREPARING" && (
                  <FlowMessage icon={LoaderCircle} title="Estamos preparando sua prévia" text="Você pode continuar usando o site. Assim que a prévia ficar pronta, esta área muda automaticamente." spinning />
                )}

                {stage === "PREVIEW_READY" && preview && (
                  <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-[.14em] text-cyan-700">Prévia disponível</span>
                        <strong className="mt-1 block text-sm text-slate-900">Confira o documento antes de continuar</strong>
                        <span className="mt-1 block text-[9px] text-slate-500">{preview.originalName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[10px] font-black text-white"><Eye size={13} /> Abrir prévia</button>
                        <a href={preview.storageKey} download={preview.originalName} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black text-slate-700"><Download size={13} /> Baixar</a>
                      </div>
                    </div>
                    <button type="button" disabled={confirmingPreview} onClick={() => void confirmPreview()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-3 text-[10px] font-black text-white disabled:opacity-60">
                      {confirmingPreview ? <LoaderCircle size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Confirmar prévia e ir para pagamento
                    </button>
                    {previewActionError && <p className="mt-2 text-[10px] font-semibold text-red-600">{previewActionError}</p>}
                  </div>
                )}

                {stage === "WAITING_PAYMENT" && (
                  <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                    {!pixAvailable ? (
                      <FlowMessage icon={QrCode} title="Aguardando dados do PIX" text="O administrador está preparando a chave ou QR Code. Assim que for enviado, aparecerá aqui automaticamente." />
                    ) : paymentApproved ? (
                      <FlowMessage icon={CheckCircle2} title="Pagamento aprovado" text="Tudo certo com o pagamento. Agora estamos preparando seu documento final." />
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm"><QrCode size={20} /></span>
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-[.14em] text-violet-700">Pagamento</span>
                            <strong className="mt-1 block text-sm text-slate-900">PIX disponível</strong>
                            <p className="mt-1 text-[10px] text-slate-500">Efetue o pagamento e envie o comprovante abaixo.</p>
                          </div>
                        </div>

                        {payment?.pixKey && (
                          <button type="button" onClick={() => void copyPix(payment.pixKey!)} className="mt-4 flex w-full items-center justify-between rounded-xl border border-violet-200 bg-white px-3 py-3 text-left">
                            <span className="min-w-0"><span className="block text-[8px] font-black uppercase text-slate-400">Chave PIX</span><strong className="block truncate text-[10px] text-slate-900">{payment.pixKey}</strong></span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-violet-700"><Copy size={12} /> {copiedPix ? "Copiado" : "Copiar"}</span>
                          </button>
                        )}

                        {payment?.qrCodeStorageKey && <img src={payment.qrCodeStorageKey} alt="QR Code PIX" className="mx-auto mt-4 h-40 w-40 rounded-2xl border border-violet-100 bg-white p-2 shadow-sm" />}

                        {!proofPending && !paymentApproved && (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                            <label className="block text-[8px] font-black uppercase tracking-[.12em] text-slate-400">Comprovante</label>
                            <input type="file" accept="image/*,.pdf" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-[10px]" />
                            <textarea value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="Observação opcional" className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-[10px] outline-none" />
                            <button type="button" disabled={!proofFile || uploadingProof} onClick={() => void uploadPaymentProof()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[10px] font-black text-white disabled:opacity-40">
                              {uploadingProof ? <LoaderCircle size={14} className="animate-spin" /> : <UploadCloud size={14} />} Enviar comprovante
                            </button>
                          </div>
                        )}

                        {proofPending && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-700">Comprovante enviado. Aguardando conferência administrativa.</p>}
                        {proofRejected && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-700">Comprovante recusado. Envie um novo arquivo.</p>}
                        {proofError && <p className="mt-2 text-[10px] font-semibold text-red-600">{proofError}</p>}
                      </>
                    )}
                  </div>
                )}

                {stage === "FINAL_PREPARING" && <FlowMessage icon={FileCheck2} title="Pagamento aprovado" text="Seu documento final está sendo preparado. Esta página acompanha a atualização automaticamente." />}
                {stage === "FINAL_READY" && finalDocument && (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <span className="text-[8px] font-black uppercase tracking-[.14em] text-emerald-700">Documento final disponível</span>
                    <strong className="mt-1 block text-sm text-slate-900">{finalDocument.originalName}</strong>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a href={finalDocument.storageKey} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[10px] font-black text-white"><Eye size={13} /> Abrir</a>
                      <a href={finalDocument.storageKey} download={finalDocument.originalName} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-[10px] font-black text-emerald-700"><Download size={13} /> Baixar</a>
                    </div>
                  </div>
                )}
                {stage === "COMPLETED" && <FlowMessage icon={CheckCircle2} title="Atendimento concluído" text="O documento continua disponível na sua conta e você já pode iniciar uma nova solicitação." />}

                {stage !== "COMPLETED" && stage !== "FINAL_READY" && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <button type="button" disabled={cancelling} onClick={() => void cancelOwnRequest()} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[10px] font-black text-red-600 disabled:opacity-50"><Ban size={13} /> {cancelling ? "Cancelando..." : "Cancelar solicitação"}</button>
                    {cancelError && <p className="mt-2 text-[10px] text-red-600">{cancelError}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <section className="clinic-glass rounded-[28px] p-5 sm:p-6">
                  <span className="text-[8px] font-black uppercase tracking-[.14em] text-teal-700">Resumo</span>
                  <h3 className="mt-1 text-lg font-black text-slate-950">Sua solicitação</h3>
                  <div className="mt-4 space-y-3 text-[10px]">
                    <InfoRow label="Protocolo" value={request.protocol} />
                    <InfoRow label="Documento" value={DOCUMENT_LABELS[request.documentType]} />
                    <InfoRow label="Valor" value={currency(request.priceCents)} />
                    <InfoRow label="Status" value={stageLabel(stage)} />
                  </div>
                </section>

                <section id="documentos" className="clinic-glass rounded-[28px] p-5 sm:p-6">
                  <span className="text-[8px] font-black uppercase tracking-[.14em] text-violet-700">Documentos</span>
                  <h3 className="mt-1 text-lg font-black text-slate-950">Arquivos disponíveis</h3>
                  <div className="mt-4 space-y-3">
                    {preview && <DocumentRow title="Prévia" file={preview} />}
                    {finalDocument && <DocumentRow title="Documento final" file={finalDocument} />}
                    {!preview && !finalDocument && <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-5 text-center text-[10px] text-slate-400">Os documentos aparecerão aqui conforme o atendimento avançar.</div>}
                  </div>
                </section>
              </div>
            </section>
          ) : (
            <section className="mt-6 clinic-glass rounded-[28px] p-7 text-center sm:p-9">
              <span className="clinic-pulse mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><ClipboardPlus size={24} /></span>
              <h2 className="mt-4 text-xl font-black text-slate-950">Nenhuma solicitação ativa</h2>
              <p className="mx-auto mt-2 max-w-lg text-[11px] leading-5 text-slate-500">Escolha um serviço acima para iniciar um novo atendimento.</p>
            </section>
          )}
        </div>
      </section>

      {previewOpen && preview && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div><strong className="block text-sm text-slate-900">Prévia do documento</strong><span className="text-[9px] text-slate-400">{preview.originalName}</span></div>
              <button type="button" onClick={() => setPreviewOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500"><X size={15} /></button>
            </div>
            <iframe src={preview.storageKey} title="Prévia" className="min-h-0 flex-1 bg-slate-100" />
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 p-3">
              <a href={preview.storageKey} download={preview.originalName} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-[10px] font-black text-slate-700"><Download size={13} /> Baixar prévia</a>
              <button type="button" disabled={confirmingPreview} onClick={() => void confirmPreview()} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-3 text-[10px] font-black text-white"><CheckCircle2 size={13} /> Confirmar prévia</button>
            </div>
          </div>
        </div>
      )}

      {(previewConfirmedAnimation || proofSuccessAnimation) && (
        <div className="pointer-events-none fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
          <div className="rounded-[28px] border border-emerald-100 bg-white px-8 py-7 text-center shadow-[0_30px_100px_rgba(16,185,129,.20)]">
            <span className="clinic-pulse mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span>
            <strong className="mt-4 block text-xl font-black text-slate-950">Atualizado com sucesso</strong>
            <span className="mt-2 block text-xs text-slate-500">O andamento foi sincronizado com o painel.</span>
          </div>
        </div>
      )}

      <PatientStyles />
    </main>
  );
}

function MiniStep({ done, label, helper }: { done: boolean; label: string; helper: string }) {
  return (
    <div className={`rounded-2xl border p-3.5 ${done ? "border-emerald-200 bg-emerald-50/75" : "border-slate-200 bg-white/75"}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>{done ? <Check size={13} /> : <Clock3 size={13} />}</span>
        <div><strong className="block text-[10px] text-slate-900">{label}</strong><span className="block text-[8px] text-slate-500">{helper}</span></div>
      </div>
    </div>
  );
}

function FlowMessage({ icon: Icon, title, text, spinning = false }: { icon: typeof FileText; title: string; text: string; spinning?: boolean }) {
  return (
    <div className="mt-5 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/80 to-cyan-50/70 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm"><Icon size={20} className={spinning ? "animate-spin" : ""} /></span>
        <div><strong className="block text-sm text-slate-900">{title}</strong><p className="mt-1 text-[10px] leading-5 text-slate-500">{text}</p></div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"><span className="text-slate-400">{label}</span><strong className="text-right text-slate-900">{value}</strong></div>;
}

function DocumentRow({ title, file }: { title: string; file: { originalName: string; storageKey: string } }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><FileText size={17} /></span>
      <div className="min-w-0 flex-1"><strong className="block text-[10px] text-slate-900">{title}</strong><span className="block truncate text-[9px] text-slate-400">{file.originalName}</span></div>
      <div className="grid grid-cols-2 gap-2">
        <a href={file.storageKey} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-[9px] font-black text-white"><Eye size={11} /> Abrir</a>
        <a href={file.storageKey} download={file.originalName} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] font-black text-slate-700"><Download size={11} /> Baixar</a>
      </div>
    </div>
  );
}

function StatusBadge({ stage }: { stage: string }) {
  return <span className="inline-flex w-fit rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[9px] font-black text-teal-700">{stageLabel(stage)}</span>;
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    PREVIEW_PREPARING: "Preparando prévia",
    PREVIEW_READY: "Prévia disponível",
    WAITING_PAYMENT: "Aguardando pagamento",
    FINAL_PREPARING: "Preparando documento",
    FINAL_READY: "Documento disponível",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  };
  return labels[stage] ?? "Em andamento";
}

function SideLink({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold ${
        active
          ? "bg-cyan-500/15 text-cyan-100"
          : "text-slate-300"
      }`}
    >
      <Icon size={15} />
      {label}
    </div>
  );
}

function MobileLink({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${
        active
          ? "bg-teal-50 text-teal-700"
          : "text-slate-600"
      }`}
    >
      <Icon size={15} />
      {label}
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof FileText;
  tone: "blue" | "violet" | "emerald";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <span className="block text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">
            {label}
          </span>
          <strong className="mt-0.5 block truncate text-[11px] text-slate-900">
            {value}
          </strong>
        </div>
      </div>
    </article>
  );
}

function PaymentMiniStep({
  title,
  done = false,
  active = false,
}: {
  title: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-2 py-2.5 text-center ${
        done
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : active
            ? "border-cyan-200 bg-cyan-50 text-cyan-700"
            : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      <span
        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-cyan-500 text-white"
              : "bg-slate-200 text-slate-400"
        }`}
      >
        {done ? (
          <Check size={11} />
        ) : active ? (
          <LoaderCircle className="animate-spin" size={11} />
        ) : (
          <Clock3 size={11} />
        )}
      </span>
      <strong className="mt-1.5 block text-[8px] font-black">
        {title}
      </strong>
    </div>
  );
}

function NetworkHomeCard({
  title,
  subtitle,
  description,
  icon: Icon,
  tone,
  href,
  badge,
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Hospital;
  tone: "cyan" | "green" | "violet";
  href: string;
  badge?: string;
}) {
  const styles = {
    cyan: {
      border: "border-cyan-100",
      glow: "network-halo-cyan",
      icon: "from-cyan-500 to-blue-600",
      text: "text-cyan-700",
      button: "from-cyan-600 to-blue-600",
    },
    green: {
      border: "border-emerald-100",
      glow: "network-halo-green",
      icon: "from-emerald-500 to-green-600",
      text: "text-emerald-700",
      button: "from-emerald-600 to-green-600",
    },
    violet: {
      border: "border-violet-100",
      glow: "network-halo-violet",
      icon: "from-violet-500 to-indigo-600",
      text: "text-violet-700",
      button: "from-violet-600 to-indigo-600",
    },
  } as const;

  const style = styles[tone];

  return (
    <Link
      href={href}
      className={`network-home-card group relative min-h-[250px] overflow-hidden rounded-[28px] border bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.055)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(15,23,42,.10)] ${style.border}`}
    >
      <span className={`network-halo absolute -right-10 -top-12 h-44 w-44 rounded-full ${style.glow}`} />
      <span className="network-sweep absolute inset-y-[-30%] left-[-55px] w-8 rotate-[14deg] bg-gradient-to-r from-transparent via-white/90 to-transparent" />

      {badge && (
        <span className="absolute right-4 top-4 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[8px] font-black text-violet-700">
          {badge}
        </span>
      )}

      <div className="relative z-10">
        <span className={`network-logo flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br ${style.icon} text-white shadow-xl`}>
          <Icon size={34} />
        </span>

        <span className={`mt-5 block text-[8px] font-black uppercase tracking-[.14em] ${style.text}`}>
          {subtitle}
        </span>
        <strong className="mt-1 block text-xl font-black text-slate-950">
          {title}
        </strong>
        <p className="mt-2 max-w-[300px] text-[10px] leading-5 text-slate-500">
          {description}
        </p>

        <span className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${style.button} px-4 py-2.5 text-[9px] font-black text-white shadow-lg`}>
          Escolher {title}
          <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}

function ProviderInfoCard({
  name,
  detail,
  icon: Icon,
  tone,
  href,
}: {
  name: string;
  detail: string;
  icon: typeof FileText;
  tone: "cyan" | "green" | "blue";
  href: string;
}) {
  const tones = {
    cyan: {
      box: "border-cyan-100 bg-cyan-50/70",
      icon: "from-cyan-500 to-blue-600 shadow-cyan-200",
      text: "text-cyan-700",
    },
    green: {
      box: "border-emerald-100 bg-emerald-50/70",
      icon: "from-emerald-500 to-green-600 shadow-emerald-200",
      text: "text-emerald-700",
    },
    blue: {
      box: "border-blue-100 bg-blue-50/70",
      icon: "from-blue-500 to-indigo-600 shadow-blue-200",
      text: "text-blue-700",
    },
  };

  const style = tones[tone];

  return (
    <Link
      href={href}
      className={`provider-info-card group flex items-center gap-3 rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg ${style.box}`}
    >
      <span
        className={`provider-info-logo flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${style.icon}`}
      >
        <Icon size={21} />
      </span>

      <div className="min-w-0 flex-1">
        <strong
          className={`block text-[12px] font-black ${style.text}`}
        >
          {name}
        </strong>
        <span className="mt-0.5 block text-[9px] leading-4 text-slate-500">
          {detail}
        </span>
      </div>

      <ChevronRight
        size={14}
        className="text-slate-300 transition group-hover:translate-x-1"
      />
    </Link>
  );
}

function ServiceHomeCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: typeof FileText;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/60"
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-teal-100/60 blur-2xl transition group-hover:bg-cyan-100"
      />

      <div className="relative">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white">
          <Icon size={21} />
        </span>

        <h3 className="mt-4 text-sm font-black text-slate-950">
          {title}
        </h3>
        <p className="mt-2 min-h-[48px] text-[10px] leading-4 text-slate-500">
          {description}
        </p>

        <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-black text-teal-700">
          Solicitar
          <ArrowRight
            size={13}
            className="transition group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}

function ProgressBox({
  label,
  done = false,
  active = false,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-3 ${
        done
          ? "border-emerald-200 bg-emerald-50"
          : active
            ? "border-cyan-200 bg-cyan-50"
            : "border-slate-200 bg-slate-50"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full ${
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-cyan-500 text-white"
              : "bg-slate-200 text-slate-400"
        }`}
      >
        {done ? (
          <Check size={12} />
        ) : active ? (
          <LoaderCircle
            className="animate-spin"
            size={12}
          />
        ) : (
          <Clock3 size={12} />
        )}
      </span>
      <strong className="text-[9px] text-slate-700">
        {label}
      </strong>
    </div>
  );
}

function PatientStyles() {
  return (
    <style jsx global>{`
      @keyframes patientEnter {
        from {
          opacity: 0;
          transform: translateY(7px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes sparkle {
        0%,
        100% {
          transform: scale(0.8) rotate(-6deg);
          opacity: 0.45;
        }
        50% {
          transform: scale(1.15) rotate(9deg);
          opacity: 1;
        }
      }

      @keyframes pixSendingOrbit {
        0%, 100% {
          transform: rotate(-3deg) scale(1);
          box-shadow: 0 14px 34px rgba(124,58,237,.12);
        }
        50% {
          transform: rotate(3deg) scale(1.06);
          box-shadow: 0 22px 48px rgba(6,182,212,.20);
        }
      }

      @keyframes paymentScan {
        from { transform: translateX(-120%); }
        to { transform: translateX(330%); }
      }

      @keyframes proofReviewPulse {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-3px) scale(1.04); }
      }

      @keyframes approvedRing {
        0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,.15); }
        50% { box-shadow: 0 0 0 14px rgba(16,185,129,0); }
      }

      .pix-sending-orbit {
        animation: pixSendingOrbit 2.4s ease-in-out infinite;
      }

      .payment-scan-line span {
        animation: paymentScan 1.8s ease-in-out infinite;
      }

      .proof-review-pulse {
        animation: proofReviewPulse 2.2s ease-in-out infinite;
      }

      .payment-approved-ring {
        animation: approvedRing 2.3s ease-in-out infinite;
      }

      @keyframes previewModalBackdrop {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes previewModalCard {
        from {
          opacity: 0;
          transform: translateY(18px) scale(.975);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes previewApprovedPop {
        0% {
          opacity: 0;
          transform: scale(.82);
        }
        65% {
          opacity: 1;
          transform: scale(1.04);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes paymentWaitPulse {
        0%,
        100% {
          transform: translateY(0);
          box-shadow: 0 8px 24px rgba(124,58,237,.06);
        }
        50% {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(124,58,237,.16);
        }
      }

      .preview-modal-backdrop {
        animation: previewModalBackdrop 180ms ease-out both;
      }

      .preview-modal-card {
        animation: previewModalCard 360ms cubic-bezier(.22,1,.36,1) both;
      }

      .preview-approved-pop {
        animation: previewApprovedPop 440ms cubic-bezier(.22,1,.36,1) both;
      }

      .payment-wait {
        animation: paymentWaitPulse 2.3s ease-in-out infinite;
      }

      .preview-confirm-button {
        position: relative;
        overflow: hidden;
      }

      .preview-confirm-button::after {
        content: "";
        position: absolute;
        inset: -2px;
        background: linear-gradient(
          115deg,
          transparent 20%,
          rgba(255,255,255,.32) 45%,
          transparent 70%
        );
        transform: translateX(-120%);
        animation: previewButtonShine 3.2s ease-in-out infinite;
      }

      @keyframes previewButtonShine {
        0%,
        55% {
          transform: translateX(-120%);
        }
        78%,
        100% {
          transform: translateX(120%);
        }
      }

      @keyframes waitingStepPulse {
        0%,
        100% {
          transform: translateY(0);
          box-shadow: 0 10px 28px rgba(6, 182, 212, 0.08);
        }
        50% {
          transform: translateY(-3px);
          box-shadow: 0 18px 38px rgba(6, 182, 212, 0.18);
        }
      }

      .waiting-step-active {
        animation: waitingStepPulse 2.2s ease-in-out infinite;
      }

      @keyframes patientProgress {
        from {
          transform: translateX(-140%);
        }
        to {
          transform: translateX(310%);
        }
      }

      @keyframes cancelCard {
        from {
          opacity: 0;
          transform: scale(0.92) translateY(12px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes cancelIcon {
        0% {
          transform: scale(0.5) rotate(-15deg);
          opacity: 0;
        }
        70% {
          transform: scale(1.08) rotate(3deg);
        }
        100% {
          transform: scale(1) rotate(0);
          opacity: 1;
        }
      }

      @keyframes cancelProgress {
        from {
          width: 0;
        }
        to {
          width: 100%;
        }
      }

      @keyframes cancelWave {
        from {
          transform: scale(0.45);
          opacity: 0.55;
        }
        to {
          transform: scale(1.55);
          opacity: 0;
        }
      }

      .patient-enter {
        animation: patientEnter 420ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .sparkle {
        animation: sparkle 1.4s ease-in-out infinite;
      }

      .patient-progress {
        animation: patientProgress 1.8s
          ease-in-out infinite;
      }

      .cancelled-card {
        animation: cancelCard 520ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .cancel-icon {
        animation: cancelIcon 620ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .cancel-progress {
        animation: cancelProgress 2.6s ease-in-out
          forwards;
      }

      .cancel-wave {
        position: absolute;
        height: 300px;
        width: 300px;
        border-radius: 9999px;
        border: 2px solid rgba(244, 63, 94, 0.15);
        animation: cancelWave 2s ease-out infinite;
      }

      .cancel-wave-a {
        left: 8%;
        top: 10%;
      }

      .cancel-wave-b {
        right: 8%;
        bottom: 10%;
        animation-delay: 600ms;
      }


      @keyframes providerInfoFloat {
        0%,100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }

      @keyframes providerCardGlow {
        0%,100% {
          box-shadow: 0 8px 28px rgba(15,118,110,.03);
        }
        50% {
          box-shadow: 0 14px 38px rgba(15,118,110,.10);
        }
      }

      .provider-info-card {
        animation:
          providerCardGlow 4.4s ease-in-out
          infinite;
      }

      .provider-info-logo {
        animation:
          providerInfoFloat 3.2s ease-in-out
          infinite;
      }

      .provider-info-card:nth-child(2)
        .provider-info-logo {
        animation-delay: -1s;
      }

      .provider-info-card:nth-child(3)
        .provider-info-logo {
        animation-delay: -2s;
      }


      @keyframes networkFloat {
        0%,100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-6px) rotate(1deg); }
      }

      @keyframes networkHaloPulse {
        0%,100% { transform: scale(.88); opacity: .18; }
        50% { transform: scale(1.16); opacity: .44; }
      }

      @keyframes networkSweep {
        0%,18% { transform: translateX(-90px) rotate(14deg); opacity: 0; }
        38% { opacity: .75; }
        62%,100% { transform: translateX(620px) rotate(14deg); opacity: 0; }
      }

      .network-logo {
        animation: networkFloat 3.5s ease-in-out infinite;
      }

      .network-home-card:nth-child(2) .network-logo {
        animation-delay: -1.1s;
      }

      .network-home-card:nth-child(3) .network-logo {
        animation-delay: -2.2s;
      }

      .network-halo {
        filter: blur(8px);
        animation: networkHaloPulse 3.6s ease-in-out infinite;
      }

      .network-halo-cyan {
        background: radial-gradient(circle, rgba(34,211,238,.22), transparent 68%);
      }

      .network-halo-green {
        background: radial-gradient(circle, rgba(16,185,129,.20), transparent 68%);
      }

      .network-halo-violet {
        background: radial-gradient(circle, rgba(139,92,246,.20), transparent 68%);
      }

      .network-sweep {
        animation: networkSweep 6.2s ease-in-out infinite;
      }

      @media (max-width: 639px) {
        .network-home-card {
          min-height: 210px;
          border-radius: 23px;
        }

        .network-logo {
          width: 64px;
          height: 64px;
          border-radius: 21px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .patient-enter,
        .sparkle,
        .patient-progress,
        .cancelled-card,
        .cancel-icon,
        .cancel-progress,
        .cancel-wave {
          animation: none !important;
        }
      }
    `}</style>
  );
}
