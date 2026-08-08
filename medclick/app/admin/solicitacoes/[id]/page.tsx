"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  HeartPulse,
  LoaderCircle,
  Maximize2,
  ExternalLink,
  Eye,
  Pill,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Save,
  Send,
  Stethoscope,
  UserRound,
  UploadCloud,
  WalletCards,
  Home,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  MessageCircle,
  ChevronRight,
  Paperclip,
  QrCode,
  CircleDollarSign,
  LayoutDashboard,
  FileUp,
  Check,
  Circle,
  Bell,
} from "lucide-react";

import CancelRequestButton from "@/components/admin/CancelRequestButton";

type RequestStatus = string;
type DocumentType =
  | "MEDICAL_CERTIFICATE"
  | "PRESCRIPTION"
  | "MEDICAL_REPORT";

type ServiceRequest = {
  id: string;
  protocol: string;
  documentType: DocumentType;
  status: RequestStatus;
  certificatePeriod: string | null;
  certificateDays: number | null;
  reportPurpose: string | null;
  reportDescription: string | null;
  cid: string | null;
  symptoms: string;
  preferredTime: string;
  additionalNotes: string | null;
  unitType: "UPA" | "UNIMED";
  unitName: string;
  priceCents: number;
  patientConfirmedPreview: boolean;
  previewConfirmedAt: string | null;
  correctionReason: string | null;
  createdAt: string;
  updatedAt: string;

  patient: {
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

  assignedDoctor: {
    id: string;
    name: string;
    email: string;
    active: boolean;
    role: string;
    doctorProfile: {
      id: string;
      crm: string;
      crmState: string;
      specialty: string | null;
      phone: string | null;
      signatureProvider: string | null;
      certificateSerial: string | null;
      certificateIssuer: string | null;
      certificateValidUntil: string | null;
      memedDoctorId: string | null;
      authorizedToSign: boolean;
      active: boolean;
    } | null;
  } | null;

  medications: Array<{
    id: string;
    position: number;
    name: string;
    dosage: string;
    pharmaceuticalForm: string;
    boxQuantity: number;
    instructions: string;
    notes: string | null;
    approvedByDoctor: boolean;
    doctorNotes: string | null;
  }>;

  attachments: Array<{
    id: string;
    type: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    description: string | null;
    createdAt: string;
  }>;

  documents: Array<{
    id: string;
    type: string;
    originalName: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    version: number;
    active: boolean;
    createdAt: string;
    uploadedBy?: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
  }>;

  generatedDocuments: Array<{
    id: string;
    documentNumber: string;
    version: number;
    status: string;
    aiDraftContent: string | null;
    previewStorageKey: string | null;
    previewMimeType: string | null;
    previewWatermark: string;
    previewGeneratedAt: string | null;
    previewSentAt: string | null;
    previewHasValidQrCode: boolean;
    authenticationActive: boolean;
    verificationStatus: string;
    verificationCode: string | null;
    verificationUrl: string | null;
    verificationQrCode: string | null;
    createdAt: string;
    approvedAt: string | null;
    finalStorageKey: string | null;
    finalMimeType: string | null;
    finalSizeBytes: number | null;
    finalGeneratedAt: string | null;
    finalSentAt: string | null;
    generatedBy?: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
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
    expiresAt: string | null;
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
      payerName: string | null;
      paidAmountCents: number | null;
      paidAt: string | null;
      transactionId: string | null;
      patientNote: string | null;
      adminNote: string | null;
      rejectionReason: string | null;
      reviewedAt: string | null;
      approvedAt: string | null;
      createdAt: string;
    }>;
  } | null;

  statusHistory: Array<{
    id: string;
    status: string;
    note: string | null;
    visibleToPatient: boolean;
    createdAt: string;
    changedBy: {
      id: string;
      name: string;
      email?: string;
      role: string;
    } | null;
  }>;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  request?: ServiceRequest;
};

type DoctorOption = {
  id: string;
  name: string;
  email: string;
  doctorProfile: {
    crm: string;
    crmState: string;
    specialty: string | null;
    authorizedToSign: boolean;
    active: boolean;
  } | null;
};

type DoctorsApiResponse = {
  success: boolean;
  message?: string;
  doctors?: DoctorOption[];
};

type GeneratePreviewApiResponse = {
  success: boolean;
  message?: string;
  document?: ServiceRequest["generatedDocuments"][number];
};


type UploadFinalDocumentApiResponse = {
  success: boolean;
  message?: string;
  documentFile?: {
    id: string;
    storageKey: string;
    originalName: string;
    version: number;
  };
  generatedDocument?: {
    id: string;
    finalStorageKey: string | null;
    finalGeneratedAt: string | null;
  };
};


type SendPreviewApiResponse = {
  success: boolean;
  message?: string;
  preview?: {
    storageKey: string;
    documentNumber: string;
    previewSentAt: string | null;
  };
};


type DraftForm = {
  patientName: string;
  patientCpf: string;
  patientBirthDate: string;
  patientMotherName: string;
  patientPhone: string;
  patientEmail: string;
  patientAddress: string;
  patientCity: string;
  patientState: string;
  patientPostalCode: string;

  documentType: DocumentType;
  unitType: "UPA" | "UNIMED";
  unitName: string;

  preferredTime: string;
  symptoms: string;
  additionalNotes: string;

  certificatePeriod: string;
  certificateDays: number | null;
  cid: string;

  reportPurpose: string;
  reportDescription: string;
};

type DraftApiResponse = {
  success: boolean;
  message?: string;
  draft?: DraftForm;
  hasSavedDraft?: boolean;
  updatedAt?: string | null;
};

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  MEDICAL_CERTIFICATE: "Atestado médico",
  PRESCRIPTION: "Receita médica",
  MEDICAL_REPORT: "Laudo médico",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBirthDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

function formatCpf(value: string) {
  const cpf = value.replace(/\D/g, "").slice(0, 11);
  if (cpf.length !== 11) return value;

  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(
    6,
    9,
  )}-${cpf.slice(9)}`;
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = useMemo(
    () => decodeURIComponent(params.id ?? ""),
    [params.id],
  );

  const [data, setData] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [assigningDoctor, setAssigningDoctor] = useState(false);
  const [doctorError, setDoctorError] = useState("");
  const [doctorSuccess, setDoctorSuccess] = useState("");

  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewSuccess, setPreviewSuccess] = useState("");
  const [previewBuildStep, setPreviewBuildStep] = useState(0);

  const [finalDocumentFile, setFinalDocumentFile] = useState<File | null>(null);
  const [uploadingFinalDocument, setUploadingFinalDocument] = useState(false);
  const [finalDocumentError, setFinalDocumentError] = useState("");
  const [finalDocumentSuccess, setFinalDocumentSuccess] = useState("");

  const [manualPreviewFile, setManualPreviewFile] = useState<File | null>(null);
  const [uploadingManualPreview, setUploadingManualPreview] = useState(false);
  const [manualPreviewError, setManualPreviewError] = useState("");
  const [manualPreviewSuccess, setManualPreviewSuccess] = useState("");

  const [publishingPreview, setPublishingPreview] = useState(false);
  const [publishPreviewError, setPublishPreviewError] = useState("");
  const [publishPreviewSuccess, setPublishPreviewSuccess] = useState("");

  const [pixKey, setPixKey] = useState("");
  const [pixReceiverName, setPixReceiverName] = useState("");
  const [pixReceiverDocument, setPixReceiverDocument] = useState("");
  const [pixPayload, setPixPayload] = useState("");
  const [sendingPix, setSendingPix] = useState(false);
  const [pixError, setPixError] = useState("");
  const [pixSuccess, setPixSuccess] = useState("");

  const [approvingPayment, setApprovingPayment] = useState(false);
  const [paymentApprovalError, setPaymentApprovalError] = useState("");
  const [paymentApprovalSuccess, setPaymentApprovalSuccess] = useState("");


  const [draft, setDraft] = useState<DraftForm | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [draftSuccess, setDraftSuccess] = useState("");

  async function loadRequest(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(requestId)}`,
        {
          cache: "no-store",
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.request) {
        throw new Error(
          result.message || "Não foi possível carregar a solicitação.",
        );
      }

      setData(result.request);

      if (result.request.payment) {
        setPixKey(result.request.payment.pixKey ?? "");
        setPixReceiverName(result.request.payment.receiverName ?? "");
        setPixReceiverDocument(result.request.payment.receiverDocument ?? "");
        setPixPayload(result.request.payment.qrCodePayload ?? "");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao carregar a solicitação.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadDoctors() {
    try {
      setLoadingDoctors(true);
      setDoctorError("");

      const response = await fetch("/api/medicos", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as DoctorsApiResponse;

      if (!response.ok || !result.success || !result.doctors) {
        throw new Error(
          result.message || "Não foi possível carregar os médicos.",
        );
      }

      setDoctors(result.doctors);
    } catch (doctorRequestError) {
      setDoctorError(
        doctorRequestError instanceof Error
          ? doctorRequestError.message
          : "Erro ao carregar os médicos.",
      );
    } finally {
      setLoadingDoctors(false);
    }
  }


  async function loadDraft() {
    try {
      setLoadingDraft(true);
      setDraftError("");

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(requestId)}/rascunho`,
        { cache: "no-store" },
      );

      const result = (await response.json()) as DraftApiResponse;

      if (!response.ok || !result.success || !result.draft) {
        throw new Error(result.message || "Não foi possível carregar o rascunho.");
      }

      setDraft(result.draft);
    } catch (requestError) {
      setDraftError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao carregar o rascunho.",
      );
    } finally {
      setLoadingDraft(false);
    }
  }

  function updateDraft<K extends keyof DraftForm>(
    field: K,
    value: DraftForm[K],
  ) {
    setDraft((current) =>
      current ? { ...current, [field]: value } : current,
    );
    setDraftSuccess("");
  }

  async function saveDraft() {
    if (!draft) return;

    try {
      setSavingDraft(true);
      setDraftError("");
      setDraftSuccess("");

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(requestId)}/rascunho`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );

      const result = (await response.json()) as DraftApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Não foi possível salvar o rascunho.");
      }

      setDraftSuccess("Alterações salvas. A próxima prévia usará estes dados.");
    } catch (requestError) {
      setDraftError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao salvar o rascunho.",
      );
    } finally {
      setSavingDraft(false);
    }
  }

  async function saveAndGeneratePreview() {
    await saveDraft();

    if (draftError) return;

    await generatePreview();
  }



  async function uploadManualPreview() {
    if (!data || !manualPreviewFile) {
      setManualPreviewError("Selecione um arquivo PDF para a prévia.");
      return;
    }

    if (
      manualPreviewFile.type !== "application/pdf" &&
      !manualPreviewFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setManualPreviewError("A prévia precisa ser um arquivo PDF.");
      return;
    }

    if (manualPreviewFile.size > 20 * 1024 * 1024) {
      setManualPreviewError("O PDF deve ter no máximo 20 MB.");
      return;
    }

    try {
      setUploadingManualPreview(true);
      setManualPreviewError("");
      setManualPreviewSuccess("");

      const formData = new FormData();
      formData.append("file", manualPreviewFile);

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(requestId)}/previa-manual`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Não foi possível anexar a prévia.",
        );
      }

      setManualPreviewFile(null);
      setManualPreviewSuccess("Prévia anexada com sucesso.");
      await loadRequest(true);
    } catch (requestError) {
      setManualPreviewError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao anexar a prévia.",
      );
    } finally {
      setUploadingManualPreview(false);
    }
  }

  function normalizeWhatsappPhone(phone: string) {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("55") && digits.length >= 12) return digits;
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    return digits;
  }

  async function publishPreviewOnSite() {
    if (!data || !latestPreviewDocument?.storageKey) {
      setPublishPreviewError(
        "Anexe uma prévia antes de disponibilizá-la no portal.",
      );
      return;
    }

    try {
      setPublishingPreview(true);
      setPublishPreviewError("");
      setPublishPreviewSuccess("");

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(
          requestId,
        )}/disponibilizar-previa`,
        {
          method: "POST",
        },
      );

      const result = (await response.json()) as SendPreviewApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Não foi possível disponibilizar a prévia no portal.",
        );
      }

      setPublishPreviewSuccess(
        "Prévia disponibilizada no Portal do Paciente. Nenhum arquivo foi enviado pelo WhatsApp.",
      );

      await loadRequest(true);
    } catch (requestError) {
      setPublishPreviewError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao disponibilizar a prévia.",
      );
    } finally {
      setPublishingPreview(false);
    }
  }

  async function sendPixToPatient() {
    if (!data) return;

    if (!pixKey.trim()) {
      setPixError("Informe a chave PIX.");
      return;
    }

    if (!pixReceiverName.trim()) {
      setPixError("Informe o nome do recebedor.");
      return;
    }

    try {
      setSendingPix(true);
      setPixError("");
      setPixSuccess("");

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(requestId)}/pix`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-medclick-context": "admin",
          },
          body: JSON.stringify({
            pixKey,
            receiverName: pixReceiverName,
            receiverDocument: pixReceiverDocument,
            qrCodePayload: pixPayload || pixKey,
          }),
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Não foi possível enviar o PIX.");
      }

      setPixSuccess("PIX disponibilizado no Portal do Paciente.");
      await loadRequest(true);
    } catch (requestError) {
      setPixError(
        requestError instanceof Error ? requestError.message : "Erro ao enviar PIX.",
      );
    } finally {
      setSendingPix(false);
    }
  }

  async function approvePayment() {
    try {
      setApprovingPayment(true);
      setPaymentApprovalError("");
      setPaymentApprovalSuccess("");

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(requestId)}/aprovar-pagamento`,
        {
          method: "POST",
          headers: { "x-medclick-context": "admin" },
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Não foi possível aprovar o pagamento.");
      }

      setPaymentApprovalSuccess(
        "Pagamento aprovado. O paciente foi atualizado automaticamente.",
      );
      await loadRequest(true);
    } catch (requestError) {
      setPaymentApprovalError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao aprovar pagamento.",
      );
    } finally {
      setApprovingPayment(false);
    }
  }

  async function uploadFinalDocument() {
    if (!data || !finalDocumentFile) {
      setFinalDocumentError("Selecione um arquivo PDF.");
      return;
    }

    if (finalDocumentFile.type !== "application/pdf") {
      setFinalDocumentError("O documento final precisa ser um arquivo PDF.");
      return;
    }

    if (finalDocumentFile.size > 20 * 1024 * 1024) {
      setFinalDocumentError("O PDF deve ter no máximo 20 MB.");
      return;
    }

    /*
     * O fluxo atual usa PRÉVIA MANUAL.
     * Portanto, para anexar o documento final, basta existir
     * uma prévia ativa já anexada/disponibilizada no atendimento.
     *
     * Não exigimos mais GeneratedDocument, pois isso pertence
     * ao fluxo antigo de geração automática da prévia.
     */
    if (!latestPreviewDocument) {
      setFinalDocumentError(
        "Anexe e disponibilize uma prévia antes de anexar o documento final.",
      );
      return;
    }

    if (!data.patientConfirmedPreview) {
      setFinalDocumentError(
        "O paciente precisa confirmar a prévia antes do documento final.",
      );
      return;
    }

    if (!paymentApproved) {
      setFinalDocumentError(
        "Confirme o pagamento antes de anexar o documento final.",
      );
      return;
    }

    try {
      setUploadingFinalDocument(true);
      setFinalDocumentError("");
      setFinalDocumentSuccess("");

      const formData = new FormData();
      formData.append("file", finalDocumentFile);

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(
          requestId,
        )}/documento-final`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result =
        (await response.json()) as UploadFinalDocumentApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Não foi possível anexar o documento final.",
        );
      }

      setFinalDocumentFile(null);
      setFinalDocumentSuccess(
        "Documento final anexado com sucesso.",
      );

      await loadRequest();
    } catch (requestError) {
      setFinalDocumentError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao anexar o documento final.",
      );
    } finally {
      setUploadingFinalDocument(false);
    }
  }

  async function assignDoctor() {
    if (!selectedDoctorId) {
      setDoctorError("Selecione um médico.");
      return;
    }

    const selectedDoctor = doctors.find(
      (doctor) => doctor.id === selectedDoctorId,
    );

    if (
      !selectedDoctor ||
      !selectedDoctor.doctorProfile?.active ||
      !selectedDoctor.doctorProfile.authorizedToSign
    ) {
      setDoctorError(
        "Selecione um médico ativo e autorizado a assinar.",
      );
      return;
    }

    try {
      setAssigningDoctor(true);
      setDoctorError("");
      setDoctorSuccess("");

      const response = await fetch(
        `/api/solicitacoes/${encodeURIComponent(requestId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedDoctorId: selectedDoctor.id,
            status: "UNDER_REVIEW",
            note: `Médico ${selectedDoctor.name} atribuído à solicitação.`,
            visibleToPatient: true,
          }),
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Não foi possível atribuir o médico.",
        );
      }

      setDoctorSuccess("Médico atribuído com sucesso.");
      setSelectedDoctorId("");
      await loadRequest(true);
    } catch (assignError) {
      setDoctorError(
        assignError instanceof Error
          ? assignError.message
          : "Erro ao atribuir o médico.",
      );
    } finally {
      setAssigningDoctor(false);
    }
  }

  async function generatePreview() {
    if (!data?.assignedDoctor) {
      setPreviewError(
        "Atribua um médico antes de gerar a prévia.",
      );
      return;
    }

    try {
      setGeneratingPreview(true);
      setPreviewBuildStep(0);
      setPreviewError("");
      setPreviewSuccess("");

      const minimumAnimationTime = new Promise<void>((resolve) => {
        window.setTimeout(resolve, 5600);
      });

      const responsePromise = fetch(
        `/api/solicitacoes/${encodeURIComponent(
          requestId,
        )}/gerar-previa`,
        {
          method: "POST",
        },
      );

      const [response] = await Promise.all([
        responsePromise,
        minimumAnimationTime,
      ]);

      const result =
        (await response.json()) as GeneratePreviewApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Não foi possível gerar a prévia.",
        );
      }

      setPreviewSuccess(
        "Prévia criada. O QR Code está em modo de prévia e ainda não autentica o documento.",
      );

      await loadRequest(true);
    } catch (previewRequestError) {
      setPreviewError(
        previewRequestError instanceof Error
          ? previewRequestError.message
          : "Erro ao gerar a prévia.",
      );
    } finally {
      setGeneratingPreview(false);
    }
  }

  useEffect(() => {
    if (!generatingPreview) {
      setPreviewBuildStep(0);
      return;
    }

    setPreviewBuildStep(0);

    const timer = window.setInterval(() => {
      setPreviewBuildStep((current) => Math.min(current + 1, 3));
    }, 1400);

    return () => window.clearInterval(timer);
  }, [generatingPreview]);

  useEffect(() => {
    if (requestId) {
      void loadRequest();
      void loadDoctors();
      void loadDraft();
    }
  }, [requestId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-teal-600"
            size={42}
          />
          <p className="mt-4 text-slate-600">
            Carregando solicitação...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <section className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={42} />
          <h1 className="mt-4 text-2xl font-extrabold">
            Não foi possível abrir a solicitação
          </h1>
          <p className="mt-3 text-slate-600">{error}</p>

          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-xl bg-teal-600 px-5 py-3 font-bold text-white"
          >
            Voltar ao painel
          </Link>
        </section>
      </main>
    );
  }

  const latestDocument =
    data.generatedDocuments.length > 0
      ? [...data.generatedDocuments].sort(
          (a, b) => b.version - a.version,
        )[0]
      : null;

  const latestPreviewDocument =
    data.documents
      .filter((document) => document.type === "PREVIEW" && document.active)
      .sort((a, b) => b.version - a.version)[0] ?? null;

  const latestFinalDocument =
    data.documents
      .filter((document) => document.type === "FINAL" && document.active)
      .sort((a, b) => b.version - a.version)[0] ?? null;

  const paymentApproved =
    data.payment?.status === "APPROVED" ||
    data.status === "PAYMENT_APPROVED" ||
    data.status === "FINAL_DOCUMENT_IN_PREPARATION" ||
    data.status === "FINAL_DOCUMENT_SIGNED" ||
    data.status === "FINAL_DOCUMENT_AUTHENTICATED" ||
    data.status === "FINAL_DOCUMENT_AVAILABLE" ||
    data.status === "FINAL_DOCUMENT_SENT" ||
    data.status === "COMPLETED";

  const activeHistory = [...data.statusHistory].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const paymentProof = data.payment?.proofs?.[0] ?? null;

  const previewApproved =
    data.patientConfirmedPreview ||
    data.status === "PREVIEW_APPROVED" ||
    data.status === "WAITING_PAYMENT_REQUEST" ||
    data.status === "PAYMENT_REQUESTED" ||
    data.status === "PIX_QR_CODE_GENERATED" ||
    data.status === "PIX_QR_CODE_SENT" ||
    data.status === "WAITING_PAYMENT" ||
    data.status === "PAYMENT_PROOF_SENT" ||
    data.status === "PAYMENT_UNDER_REVIEW" ||
    paymentApproved;

  const pixSent = Boolean(
    data.payment?.qrCodeSentAt ||
      data.payment?.pixKey,
  );

  const proofReceived = Boolean(
    paymentProof &&
      paymentProof.status !== "REJECTED",
  );

  const previewAttached = Boolean(latestPreviewDocument);
  const previewSent =
    data.status === "PREVIEW_SENT" ||
    data.status === "PREVIEW_APPROVED" ||
    data.status === "PAYMENT_REQUESTED" ||
    data.status === "WAITING_PAYMENT" ||
    data.status === "PAYMENT_PROOF_SENT" ||
    data.status === "PAYMENT_UNDER_REVIEW" ||
    paymentApproved;

  const finalAttached = Boolean(latestFinalDocument);
  const finalSent =
    data.status === "FINAL_DOCUMENT_SENT" ||
    data.status === "COMPLETED";

  const completed = data.status === "COMPLETED";

  const workflowProgress = [
    previewAttached,
    previewSent,
    Boolean(data.payment),
    paymentApproved,
    finalAttached,
    finalSent,
    completed,
  ].filter(Boolean).length;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_right,#eff6ff_0%,#f8fafc_35%,#f5f8fc_72%)] text-slate-900">
      <div className="pointer-events-none fixed right-0 top-16 h-[420px] w-[420px] rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="pointer-events-none fixed -left-32 bottom-0 h-96 w-96 rounded-full bg-violet-300/10 blur-3xl" />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] overflow-hidden bg-[linear-gradient(180deg,#07172c_0%,#0a213d_55%,#07182f_100%)] text-white shadow-2xl 2xl:flex 2xl:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-teal-950/30">
              <HeartPulse size={22} className="text-white" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300 ring-2 ring-[#07172c]" />
            </div>
            <div>
              <strong className="block text-[20px] font-black tracking-tight">
                MedClick
              </strong>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Painel administrativo
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-5">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/admin" />
          <SidebarItem icon={FileText} label="Solicitações" href="/admin" active />
          <SidebarItem icon={FileCheck2} label="Documentos" href="/admin" />
          <SidebarItem icon={CreditCard} label="Pagamentos" href="/admin" />
          <SidebarItem icon={Users} label="Pacientes" href="/admin" />
          <SidebarItem icon={BarChart3} label="Relatórios" href="/admin" />
          <SidebarItem icon={Settings} label="Configurações" href="/admin" />
        </nav>

        <div className="px-3 pb-4">
          <div className="rounded-2xl border border-cyan-300/10 bg-cyan-400/10 p-3.5">
            <div className="flex items-center gap-2 text-cyan-200">
              <MessageCircle size={17} />
              <strong className="text-xs">Precisa de ajuda?</strong>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-300">
              Suporte operacional MedClick
            </p>
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/90 px-3 py-2 text-[11px] font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-400"
            >
              <MessageCircle size={14} />
              Abrir WhatsApp
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-black text-cyan-200">
              AD
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-xs">Administrador</strong>
              <span className="block truncate text-[11px] text-slate-400">
                Painel administrativo
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="2xl:pl-[244px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[62px] items-center justify-between gap-4 px-4 sm:px-5 xl:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/admin"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-x-0.5 hover:border-teal-300 hover:text-teal-700"
              >
                <ArrowLeft size={17} />
              </Link>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                    Solicitação {data.protocol}
                  </h1>
                  <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700 sm:inline-flex">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {statusLabel(data.status)}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Fluxo manual · operação administrativa
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 sm:flex"
                aria-label="Notificações"
              >
                <Bell size={16} />
              </button>
              <button
                type="button"
                onClick={() => void loadRequest(true)}
                disabled={refreshing}
                className="group inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-blue-500/30 disabled:translate-y-0 disabled:opacity-60"
              >
                {refreshing ? (
                  <LoaderCircle className="animate-spin" size={15} />
                ) : (
                  <RefreshCw
                    size={15}
                    className="transition-transform duration-500 group-hover:rotate-180"
                  />
                )}
                Atualizar
              </button>
            </div>
          </div>
        </header>

        <section className="mx-auto flex max-w-[1540px] flex-col gap-3 p-3 sm:p-4 xl:p-4 2xl:p-4">
          <div className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            <TopMetric
              icon={FileText}
              label="Documento"
              value={DOCUMENT_LABELS[data.documentType]}
              tone="blue"
              delay={0}
            />
            <TopMetric
              icon={Stethoscope}
              label="Unidade"
              value={data.unitType}
              subtitle={data.unitName}
              tone="violet"
              delay={40}
            />
            <TopMetric
              icon={CircleDollarSign}
              label="Valor"
              value={formatCurrency(data.priceCents)}
              tone="emerald"
              delay={80}
            />
            <TopMetric
              icon={UserRound}
              label="Paciente"
              value={data.patient.fullName}
              tone="indigo"
              delay={120}
            />
            <TopMetric
              icon={CalendarDays}
              label="Solicitado em"
              value={formatDate(data.createdAt)}
              tone="sky"
              delay={160}
            />
            <TopMetric
              icon={Activity}
              label="Status atual"
              value={statusLabel(data.status)}
              tone="cyan"
              delay={200}
            />
          </div>

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2 2xl:grid-cols-[1fr_1.2fr_390px]">
            <div className="min-h-0 space-y-3 2xl:overflow-y-auto 2xl:pr-1 dashboard-scroll">
              <CompactSection title="Dados do paciente" icon={UserRound} tone="blue">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-50 text-sm font-black text-blue-700 ring-4 ring-blue-50">
                    {initials(data.patient.fullName)}
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-black text-slate-950">
                      {data.patient.fullName}
                    </strong>
                    <span className="mt-0.5 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-emerald-700">
                      Paciente
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3">
                  <DataLine label="CPF" value={formatCpf(data.patient.cpf)} />
                  <DataLine
                    label="Nascimento"
                    value={formatBirthDate(data.patient.birthDate)}
                  />
                  <DataLine label="Nome da mãe" value={data.patient.motherName} />
                  <DataLine label="Telefone" value={data.patient.phone} />
                  <DataLine label="E-mail" value={data.patient.email} />
                  <DataLine
                    label="Cidade / UF"
                    value={
                      [data.patient.city, data.patient.state]
                        .filter(Boolean)
                        .join(" / ") || "Não informado"
                    }
                  />
                  <div className="col-span-2">
                    <DataLine label="Endereço" value={data.patient.address} />
                  </div>
                </div>
              </CompactSection>

              <CompactSection title="Dados da solicitação" icon={HeartPulse} tone="violet">
                <div className="grid grid-cols-2 gap-x-3">
                  <DataLine label="Criada em" value={formatDate(data.createdAt)} />
                  <DataLine label="Atualizada em" value={formatDate(data.updatedAt)} />
                  <DataLine
                    label={
                      data.documentType === "MEDICAL_CERTIFICATE"
                        ? "Período solicitado"
                        : "CID"
                    }
                    value={
                      data.documentType === "MEDICAL_CERTIFICATE"
                        ? data.certificatePeriod || "—"
                        : data.cid || "Não informado"
                    }
                  />
                  <DataLine
                    label={
                      data.documentType === "MEDICAL_CERTIFICATE"
                        ? "Quantidade"
                        : "Horário desejado"
                    }
                    value={
                      data.documentType === "MEDICAL_CERTIFICATE"
                        ? data.certificateDays
                          ? `${data.certificateDays} dia(s)`
                          : "—"
                        : data.preferredTime || "—"
                    }
                  />
                </div>

                <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                    Descrição / motivo
                  </span>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-4 text-slate-700">
                    {data.symptoms || data.reportDescription || "Não informado"}
                  </p>
                </div>
              </CompactSection>

              {data.medications.length > 0 && (
                <CompactSection
                  title={`Medicamentos (${data.medications.length})`}
                  icon={Pill}
                  tone="cyan"
                >
                  <div className="space-y-2">
                    {data.medications.slice(0, 3).map((medication) => (
                      <div
                        key={medication.id}
                        className="group rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 transition hover:border-cyan-200 hover:bg-cyan-50/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <strong className="text-[11px] font-black text-slate-900">
                            {medication.name}
                          </strong>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                            {medication.boxQuantity} caixa(s)
                          </span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                          <span>{medication.dosage}</span>
                          <span>{medication.pharmaceuticalForm}</span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-[11px] text-slate-600">
                          {medication.instructions}
                        </p>
                      </div>
                    ))}
                  </div>
                </CompactSection>
              )}
            </div>

            <div className="min-h-0 space-y-3 2xl:overflow-y-auto 2xl:pr-1 dashboard-scroll">
              <CompactSection
                title="Histórico da solicitação"
                icon={Clock3}
                tone="indigo"
                action={
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500">
                    {data.statusHistory.length} evento(s)
                  </span>
                }
              >
                {activeHistory.length === 0 ? (
                  <EmptyCompact text="Nenhum evento registrado." />
                ) : (
                  <div className="relative space-y-2 pl-1">
                    <span className="absolute bottom-3 left-[14px] top-3 w-px bg-gradient-to-b from-emerald-300 via-blue-200 to-slate-100" />
                    {activeHistory.slice(0, 4).map((event, index) => (
                      <div
                        key={event.id}
                        className="relative flex gap-3 rounded-xl border border-slate-100 bg-white px-2 py-2.5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
                      >
                        <span
                          className={`z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                            index === 0
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {index === 0 ? <Check size={13} /> : <Circle size={9} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <strong className="truncate text-[11px] font-black text-slate-900">
                              {statusLabel(event.status)}
                            </strong>
                            <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                              {formatDate(event.createdAt)}
                            </span>
                          </div>
                          {event.note && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-500">
                              {event.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CompactSection>

              <CompactSection title="Arquivos" icon={Paperclip} tone="blue">
                <div className="grid gap-2 sm:grid-cols-2">
                  <FileSlot
                    title="Prévia"
                    file={latestPreviewDocument}
                    emptyText="Nenhuma prévia anexada"
                    tone="blue"
                  />
                  <FileSlot
                    title="Documento final"
                    file={latestFinalDocument}
                    emptyText="Nenhum documento final anexado"
                    tone="violet"
                  />
                </div>
              </CompactSection>

              <CompactSection
                title="Comprovante de pagamento"
                icon={CreditCard}
                tone="emerald"
              >
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Status
                    </span>
                    <strong className="mt-0.5 block text-[11px] text-slate-900">
                      {statusLabel(data.payment?.status || "NOT_STARTED")}
                    </strong>
                  </div>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      paymentApproved
                        ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                        : "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.12)]"
                    }`}
                  />
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <MiniStat
                    label="Valor"
                    value={formatCurrency(
                      data.payment?.amountCents ?? data.priceCents,
                    )}
                  />
                  <MiniStat
                    label="Pago em"
                    value={formatDate(data.payment?.approvedAt)}
                  />
                  <MiniStat
                    label="PIX enviado"
                    value={formatDate(data.payment?.qrCodeSentAt)}
                  />
                  <MiniStat
                    label="Comprovante"
                    value={paymentProof?.originalName || "—"}
                  />
                </div>

                {paymentProof?.storageKey && (
                  <a
                    href={paymentProof.storageKey}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-[10px] font-black text-blue-700 transition hover:bg-blue-100"
                  >
                    <Eye size={14} />
                    Visualizar comprovante enviado
                  </a>
                )}

                {!paymentApproved && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-800">
                    <AlertCircle className="mt-0.5 shrink-0" size={13} />
                    Aguardando confirmação manual do pagamento.
                  </div>
                )}
              </CompactSection>
            </div>

            <aside className="min-h-0 lg:col-span-2 2xl:col-span-1 2xl:overflow-y-auto dashboard-scroll">
              <section className="relative overflow-hidden rounded-[22px] border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 via-white to-white shadow-[0_12px_35px_rgba(15,118,110,0.08)]">
                <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="relative border-b border-emerald-100 px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <Activity size={16} />
                      </span>
                      <div>
                        <h2 className="text-sm font-black text-slate-950">
                          Próximas ações
                        </h2>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Fluxo manual · simples e direto
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                      {workflowProgress}/7
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(
                          5,
                          Math.round((workflowProgress / 7) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="relative space-y-2 p-3">
                  <FlowUploadStep
                    number={1}
                    title="Anexar prévia"
                    description="Prepare a prévia em PDF e anexe ao atendimento."
                    done={previewAttached}
                    tone="blue"
                    file={manualPreviewFile}
                    uploading={uploadingManualPreview}
                    accept="application/pdf,.pdf"
                    buttonLabel="Anexar prévia"
                    success={manualPreviewSuccess}
                    error={manualPreviewError}
                    onChange={(file) => {
                      setManualPreviewFile(file);
                      setManualPreviewError("");
                      setManualPreviewSuccess("");
                    }}
                    onSubmit={() => void uploadManualPreview()}
                  />

                  <FlowButtonStep
                    number={2}
                    title="Disponibilizar prévia no portal"
                    description="Libere a prévia para o paciente visualizar dentro do site."
                    icon={MessageCircle}
                    done={previewSent}
                    disabled={!latestPreviewDocument || publishingPreview}
                    loading={publishingPreview}
                    buttonLabel="Disponibilizar no site"
                    onClick={() => void publishPreviewOnSite()}
                    tone="emerald"
                    feedback={publishPreviewSuccess || publishPreviewError}
                    feedbackError={Boolean(publishPreviewError)}
                  />

                  <section className={`rounded-2xl border p-3.5 transition ${
                    pixSent
                      ? "border-emerald-200 bg-emerald-50/60"
                      : previewApproved
                        ? "border-cyan-200 bg-cyan-50/60"
                        : "border-slate-200 bg-slate-50 opacity-60"
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${
                        pixSent ? "bg-emerald-500" : "bg-cyan-500"
                      }`}>
                        {pixSent ? <Check size={13} /> : 3}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <QrCode size={14} className="text-cyan-700" />
                          <strong className="text-[11px] text-slate-900">
                            Inserir / enviar PIX
                          </strong>
                        </div>
                        <p className="mt-1 text-[9px] leading-4 text-slate-500">
                          Após a prévia ser confirmada, informe a chave. O QR Code será gerado e disponibilizado no portal.
                        </p>

                        {previewApproved && (
                          <div className="mt-3 grid gap-2">
                            <input
                              value={pixKey}
                              onChange={(event) => setPixKey(event.target.value)}
                              placeholder="Chave PIX"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/50"
                            />

                            <div className="grid gap-2 sm:grid-cols-2">
                              <input
                                value={pixReceiverName}
                                onChange={(event) => setPixReceiverName(event.target.value)}
                                placeholder="Nome do recebedor"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/50"
                              />
                              <input
                                value={pixReceiverDocument}
                                onChange={(event) => setPixReceiverDocument(event.target.value)}
                                placeholder="CPF/CNPJ (opcional)"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/50"
                              />
                            </div>

                            <textarea
                              value={pixPayload}
                              onChange={(event) => setPixPayload(event.target.value)}
                              rows={2}
                              placeholder="PIX copia e cola (opcional)"
                              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/50"
                            />

                            {pixError && (
                              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700">
                                {pixError}
                              </div>
                            )}

                            {pixSuccess && (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700">
                                {pixSuccess}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => void sendPixToPatient()}
                              disabled={sendingPix}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-2.5 text-[10px] font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60"
                            >
                              {sendingPix ? (
                                <LoaderCircle className="animate-spin" size={14} />
                              ) : (
                                <Send size={14} />
                              )}
                              {pixSent ? "Atualizar / reenviar PIX" : "Enviar PIX ao paciente"}
                            </button>

                            {data.payment?.qrCodeStorageKey && (
                              <div className="flex items-center gap-3 rounded-xl border border-cyan-100 bg-white p-2.5">
                                <img
                                  src={data.payment.qrCodeStorageKey}
                                  alt="QR Code PIX"
                                  className="h-14 w-14 rounded-lg border border-slate-100 object-contain"
                                />
                                <div className="min-w-0">
                                  <span className="block text-[8px] font-black uppercase text-slate-400">
                                    PIX disponível
                                  </span>
                                  <strong className="mt-0.5 block truncate text-[9px] text-slate-700">
                                    {data.payment.pixKey}
                                  </strong>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className={`rounded-2xl border p-3.5 transition ${
                    paymentApproved
                      ? "border-emerald-200 bg-emerald-50/60"
                      : proofReceived
                        ? "border-amber-200 bg-amber-50/60"
                        : "border-slate-200 bg-slate-50 opacity-70"
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${
                        paymentApproved
                          ? "bg-emerald-500"
                          : proofReceived
                            ? "bg-amber-500"
                            : "bg-slate-400"
                      }`}>
                        {paymentApproved ? <Check size={13} /> : 4}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className={paymentApproved ? "text-emerald-700" : "text-amber-700"} />
                          <strong className="text-[11px] text-slate-900">
                            Aprovar pagamento
                          </strong>
                        </div>

                        <p className="mt-1 text-[9px] leading-4 text-slate-500">
                          O botão é liberado após o paciente enviar o comprovante.
                        </p>

                        {paymentProof && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                            <span className="text-[8px] font-black uppercase text-slate-400">
                              Comprovante recebido
                            </span>
                            <strong className="mt-1 block truncate text-[10px] text-slate-800">
                              {paymentProof.originalName}
                            </strong>
                            {paymentProof.storageKey && (
                              <a
                                href={paymentProof.storageKey}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-black text-blue-700 hover:underline"
                              >
                                <Eye size={12} />
                                Abrir comprovante
                              </a>
                            )}
                          </div>
                        )}

                        {paymentApprovalError && (
                          <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[9px] text-red-700">
                            {paymentApprovalError}
                          </div>
                        )}

                        {paymentApprovalSuccess && (
                          <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700">
                            {paymentApprovalSuccess}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => void approvePayment()}
                          disabled={!proofReceived || paymentApproved || approvingPayment}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {approvingPayment ? (
                            <LoaderCircle className="animate-spin" size={14} />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          {paymentApproved ? "Pagamento aprovado" : "Confirmar pagamento"}
                        </button>
                      </div>
                    </div>
                  </section>

                  <FlowUploadStep
                    number={5}
                    title="Anexar documento final"
                    description="Anexe o PDF final autenticado."
                    done={finalAttached}
                    tone="violet"
                    file={finalDocumentFile}
                    uploading={uploadingFinalDocument}
                    disabled={!paymentApproved}
                    accept="application/pdf,.pdf"
                    buttonLabel="Anexar documento final"
                    success={finalDocumentSuccess}
                    error={finalDocumentError}
                    onChange={(file) => {
                      setFinalDocumentFile(file);
                      setFinalDocumentError("");
                      setFinalDocumentSuccess("");
                    }}
                    onSubmit={() => void uploadFinalDocument()}
                  />

                  <FlowButtonStep
                    number={6}
                    title="Enviar documento final"
                    description="Envie o documento final ao paciente."
                    icon={Send}
                    done={finalSent}
                    disabled={!latestFinalDocument}
                    buttonLabel="Enviar documento final"
                    tone="blue"
                  />

                  <FlowButtonStep
                    number={7}
                    title="Finalizar atendimento"
                    description="Conclua a solicitação após a entrega."
                    icon={BadgeCheck}
                    done={completed}
                    disabled={!finalSent}
                    buttonLabel="Finalizar solicitação"
                    tone="amber"
                  />

                  <div className="mt-3 border-t border-red-100 pt-3">
                    <CancelRequestButton
                      requestId={data.id}
                      protocol={data.protocol}
                      disabled={
                        data.status === "CANCELLED" ||
                        data.status === "COMPLETED"
                      }
                      onCancelled={() =>
                        loadRequest(true)
                      }
                    />
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>

      <DashboardAnimationStyles />
    </main>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  href,
  active = false,
}: {
  icon: typeof FileText;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-300 ${
        active
          ? "bg-gradient-to-r from-teal-500/25 to-cyan-400/10 text-cyan-100 shadow-[inset_3px_0_0_#22d3ee]"
          : "text-slate-300 hover:translate-x-0.5 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon
        size={16}
        className={`transition-transform duration-300 group-hover:scale-110 ${
          active ? "text-cyan-300" : "text-slate-400"
        }`}
      />
      {label}
    </Link>
  );
}

function TopMetric({
  icon: Icon,
  label,
  value,
  subtitle,
  tone,
  delay,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  subtitle?: string;
  tone: "blue" | "violet" | "emerald" | "indigo" | "sky" | "cyan";
  delay: number;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    sky: "bg-sky-50 text-sky-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <article
      className="dashboard-enter group min-w-0 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_5px_18px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(59,130,246,0.10)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${tones[tone]}`}
        >
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <span className="block truncate text-[8.5px] font-black uppercase tracking-[0.1em] text-slate-400">
            {label}
          </span>
          <strong className="mt-0.5 block truncate text-[11px] font-black text-slate-950">
            {value}
          </strong>
          {subtitle && (
            <span className="mt-0.5 block truncate text-[8.5px] font-semibold text-slate-400">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function CompactSection({
  title,
  icon: Icon,
  tone,
  action,
  children,
}: {
  title: string;
  icon: typeof FileText;
  tone: "blue" | "violet" | "cyan" | "indigo" | "emerald";
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <section className="dashboard-enter rounded-[24px] border border-slate-200/80 bg-white p-3.5 shadow-[0_6px_22px_rgba(15,23,42,0.04)] transition duration-300 hover:border-slate-300/80 hover:shadow-[0_10px_30px_rgba(15,23,42,0.065)]">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon size={14} />
          </span>
          <h2 className="text-[12px] font-black text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DataLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-b border-slate-100 py-2 last:border-b-0">
      <span className="block truncate text-[8.5px] font-bold text-slate-400">
        {label}
      </span>
      <strong className="mt-0.5 block truncate text-[10.5px] font-bold text-slate-800">
        {value || "—"}
      </strong>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
      <span className="block text-[8.5px] font-bold text-slate-400">{label}</span>
      <strong className="mt-0.5 block truncate text-[11px] font-black text-slate-800">
        {value || "—"}
      </strong>
    </div>
  );
}

function FileSlot({
  title,
  file,
  emptyText,
  tone,
}: {
  title: string;
  file:
    | {
        id: string;
        originalName: string;
        storageKey: string;
        sizeBytes: number;
        version: number;
      }
    | null
    | undefined;
  emptyText: string;
  tone: "blue" | "violet";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50/40 text-blue-700"
      : "border-violet-200 bg-violet-50/40 text-violet-700";

  return (
    <div className={`rounded-xl border border-dashed p-3 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <FileText size={14} />
        <strong className="text-[10.5px] font-black">{title}</strong>
      </div>

      {file ? (
        <>
          <p className="mt-2 truncate text-[11px] font-bold text-slate-700">
            {file.originalName}
          </p>
          <div className="mt-1 flex items-center justify-between text-[8.5px] text-slate-400">
            <span>Versão {file.version}</span>
            <span>{formatFileSize(file.sizeBytes)}</span>
          </div>
          <a
            href={file.storageKey}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-blue-700"
          >
            <Eye size={12} />
            Visualizar
          </a>
        </>
      ) : (
        <div className="flex min-h-[70px] flex-col items-center justify-center text-center">
          <UploadCloud size={20} className="opacity-45" />
          <span className="mt-2 text-[9.5px] font-semibold text-slate-400">
            {emptyText}
          </span>
        </div>
      )}
    </div>
  );
}

function FlowUploadStep({
  number,
  title,
  description,
  done,
  tone,
  file,
  uploading,
  disabled = false,
  accept,
  buttonLabel,
  success,
  error,
  onChange,
  onSubmit,
}: {
  number: number;
  title: string;
  description: string;
  done: boolean;
  tone: "blue" | "violet";
  file: File | null;
  uploading: boolean;
  disabled?: boolean;
  accept: string;
  buttonLabel: string;
  success: string;
  error: string;
  onChange: (file: File | null) => void;
  onSubmit: () => void;
}) {
  const accent =
    tone === "blue"
      ? "border-blue-200 bg-blue-50/50 text-blue-700"
      : "border-violet-200 bg-violet-50/50 text-violet-700";

  return (
    <div className={`flow-step relative rounded-2xl border p-3 ${done ? "border-emerald-200 bg-emerald-50/50" : accent}`}>
      <span
        className={`absolute -left-2.5 top-3 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black text-white shadow-sm ${
          done ? "bg-emerald-500" : tone === "blue" ? "bg-blue-600" : "bg-violet-600"
        }`}
      >
        {done ? <Check size={11} /> : number}
      </span>

      <div className="pl-1">
        <div className="flex items-center gap-2">
          <FileUp size={14} className={done ? "text-emerald-600" : ""} />
          <strong className="text-[10.5px] font-black text-slate-900">{title}</strong>
        </div>
        <p className="mt-0.5 text-[11px] leading-3.5 text-slate-500">{description}</p>

        {!done && (
          <>
            <label className={`mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-white px-2 py-2 text-[11px] font-bold transition hover:border-slate-400 ${disabled ? "pointer-events-none opacity-45" : ""}`}>
              <Paperclip size={12} />
              {file ? file.name : "Escolher PDF"}
              <input
                type="file"
                accept={accept}
                disabled={disabled || uploading}
                className="hidden"
                onChange={(event) => onChange(event.target.files?.[0] ?? null)}
              />
            </label>

            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || !file || uploading}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-2 py-2 text-[9.5px] font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {uploading ? (
                <LoaderCircle className="animate-spin" size={12} />
              ) : (
                <UploadCloud size={12} />
              )}
              {uploading ? "Enviando..." : buttonLabel}
            </button>
          </>
        )}

        {(success || error) && (
          <p className={`mt-2 text-[8.5px] leading-3.5 ${error ? "text-red-600" : "text-emerald-700"}`}>
            {error || success}
          </p>
        )}
      </div>
    </div>
  );
}

function FlowButtonStep({
  number,
  title,
  description,
  icon: Icon,
  done,
  disabled,
  loading = false,
  buttonLabel,
  onClick,
  tone,
  feedback,
  feedbackError = false,
}: {
  number: number;
  title: string;
  description: string;
  icon: typeof FileText;
  done: boolean;
  disabled: boolean;
  loading?: boolean;
  buttonLabel: string;
  onClick?: () => void;
  tone: "emerald" | "cyan" | "blue" | "amber";
  feedback?: string;
  feedbackError?: boolean;
}) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
    cyan: "border-cyan-200 bg-cyan-50/50 text-cyan-700",
    blue: "border-blue-200 bg-blue-50/50 text-blue-700",
    amber: "border-amber-200 bg-amber-50/50 text-amber-700",
  };

  const dots = {
    emerald: "bg-emerald-500",
    cyan: "bg-cyan-500",
    blue: "bg-blue-600",
    amber: "bg-amber-500",
  };

  return (
    <div className={`flow-step relative rounded-2xl border p-3 ${done ? "border-emerald-200 bg-emerald-50/50 text-emerald-700" : tones[tone]}`}>
      <span
        className={`absolute -left-2.5 top-3 flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black text-white shadow-sm ${
          done ? "bg-emerald-500" : dots[tone]
        }`}
      >
        {done ? <Check size={11} /> : number}
      </span>

      <div className="pl-1">
        <div className="flex items-center gap-2">
          <Icon size={14} />
          <strong className="text-[10.5px] font-black text-slate-900">{title}</strong>
        </div>
        <p className="mt-0.5 text-[11px] leading-3.5 text-slate-500">{description}</p>

        {!done && (
          <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-2 py-2 text-[9.5px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-blue-700 disabled:translate-y-0 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {loading && <LoaderCircle className="animate-spin" size={12} />}
            {buttonLabel}
            {!loading && <ChevronRight size={12} />}
          </button>
        )}

        {feedback && (
          <p className={`mt-2 text-[8.5px] leading-3.5 ${feedbackError ? "text-red-600" : "text-emerald-700"}`}>
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyCompact({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-[11px] font-semibold text-slate-400">
      {text}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DashboardAnimationStyles() {
  return (
    <style jsx global>{`
      @keyframes dashboardEnter {
        from {
          opacity: 0;
          transform: translateY(8px) scale(0.99);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes flowGlow {
        0%,
        100% {
          box-shadow: 0 0 0 rgba(14, 165, 233, 0);
        }
        50% {
          box-shadow: 0 8px 28px rgba(14, 165, 233, 0.08);
        }
      }

      .dashboard-enter {
        opacity: 0;
        animation: dashboardEnter 420ms cubic-bezier(0.22, 1, 0.36, 1)
          forwards;
      }

      .flow-step {
        transition:
          transform 220ms ease,
          box-shadow 220ms ease,
          border-color 220ms ease;
      }

      .flow-step:hover {
        transform: translateX(2px);
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      }

      .dashboard-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
      }

      .dashboard-scroll::-webkit-scrollbar {
        width: 5px;
      }

      .dashboard-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .dashboard-scroll::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.35);
        border-radius: 999px;
      }

      @keyframes premiumPanelEnter {
        from {
          opacity: 0;
          transform: translateY(10px) scale(.99);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes premiumGlow {
        0%, 100% {
          box-shadow: 0 12px 34px rgba(15, 23, 42, .055);
        }
        50% {
          box-shadow: 0 18px 44px rgba(14, 165, 233, .10);
        }
      }

      .admin-card,
      .request-card,
      .flow-card {
        animation: premiumPanelEnter 420ms cubic-bezier(.22,1,.36,1) both;
      }

      .flow-card {
        animation-name: premiumPanelEnter, premiumGlow;
        animation-duration: 420ms, 4.5s;
        animation-timing-function: cubic-bezier(.22,1,.36,1), ease-in-out;
        animation-iteration-count: 1, infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .dashboard-enter,
        .flow-step {
          animation: none !important;
          transition: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}


function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Icon size={20} />
        </span>
        <h2 className="text-xl font-extrabold">{title}</h2>
      </div>

      {children}
    </section>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof FileText;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-500">
            {title}
          </span>
          <strong className="mt-2 block text-lg text-slate-900">
            {value}
          </strong>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Icon size={19} />
        </span>
      </div>
    </article>
  );
}

function InfoGrid({
  items,
}: {
  items: Array<[string, string]>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {label}
          </span>
          <strong className="mt-2 block break-words text-slate-900">
            {value}
          </strong>
        </div>
      ))}
    </div>
  );
}



const editorInputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

function DraftSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-slate-700">
        {title}
      </h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function DraftField({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}


function PreviewGenerationOverlay({ step }: { step: number }) {
  const stages = [
    "Preparando dados",
    "Montando o documento",
    "Renderizando o PDF",
    "Finalizando a prévia",
  ];

  const active = Math.min(step, stages.length - 1);
  const progress = [22, 48, 76, 94][active];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl">
        <div className="absolute -left-20 -top-20 h-72 w-72 animate-pulse rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-80 w-80 animate-pulse rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative grid gap-8 p-7 md:grid-cols-[1fr_0.72fr] md:p-10">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-teal-300">
              <Sparkles size={14} />
              MedClick
            </div>

            <h2 className="mt-6 text-3xl font-black tracking-tight text-white">
              Montando o documento
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Aguarde alguns segundos. Estamos preparando uma nova versão da prévia.
            </p>

            <div className="mt-7 space-y-3">
              {stages.map((label, index) => {
                const complete = index < active;
                const current = index === active;

                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-500 ${
                      current
                        ? "border-teal-400/30 bg-teal-400/10"
                        : complete
                          ? "border-emerald-400/20 bg-emerald-400/5"
                          : "border-white/5 bg-white/[0.025]"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        complete
                          ? "bg-emerald-400/15 text-emerald-300"
                          : current
                            ? "bg-teal-400/15 text-teal-300"
                            : "bg-white/5 text-slate-600"
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 size={17} />
                      ) : current ? (
                        <LoaderCircle className="animate-spin" size={17} />
                      ) : (
                        <span className="text-xs font-black">{index + 1}</span>
                      )}
                    </span>
                    <strong
                      className={`text-sm ${
                        current || complete ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {label}
                    </strong>
                  </div>
                );
              })}
            </div>

            <div className="mt-7">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>{stages[active]}</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-teal-400 transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-56">
              <div className="absolute -inset-5 rounded-[30px] bg-teal-400/10 blur-2xl" />
              <div className="relative aspect-[0.707] overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="space-y-3 p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-px bg-slate-200" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-7 animate-pulse rounded bg-slate-100" />
                    <div className="h-7 animate-pulse rounded bg-slate-100" />
                    <div className="h-7 animate-pulse rounded bg-slate-100" />
                    <div className="h-7 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="pt-3">
                    <div className="mx-auto h-3 w-28 animate-pulse rounded bg-slate-200" />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
                    <div className="h-2 w-11/12 animate-pulse rounded bg-slate-100" />
                    <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
                    <div className="h-2 w-4/5 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="pt-10">
                    <div className="mx-auto h-px w-2/3 bg-slate-200" />
                    <div className="mx-auto mt-2 h-2.5 w-28 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>

                <div className="absolute inset-x-0 top-0 h-16 animate-[documentScan_1.8s_ease-in-out_infinite] border-b border-teal-400/20 bg-gradient-to-b from-transparent to-teal-400/10" />
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes documentScan {
            0% {
              transform: translateY(-100%);
              opacity: 0;
            }
            15% {
              opacity: 1;
            }
            85% {
              opacity: 1;
            }
            100% {
              transform: translateY(650%);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function DocumentBuildLoader({ step }: { step: number }) {
  const stages = [
    {
      title: "Preparando dados",
      description: "Organizando paciente, unidade e informações do documento.",
    },
    {
      title: "Montando o layout",
      description: "Posicionando textos, linhas, QR Code e elementos visuais.",
    },
    {
      title: "Renderizando o PDF",
      description: "Gerando a folha em alta qualidade e validando o arquivo.",
    },
    {
      title: "Finalizando a prévia",
      description: "Salvando a nova versão para exibição no painel.",
    },
  ];

  const progress = [18, 45, 74, 92][Math.min(step, 3)];

  return (
    <div className="border-b border-slate-200 bg-slate-950 px-4 py-8 sm:px-7 sm:py-12">
      <div className="mx-auto max-w-[960px]">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 shadow-2xl">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute -left-20 -top-20 h-72 w-72 animate-pulse rounded-full bg-teal-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-80 w-80 animate-pulse rounded-full bg-cyan-500/10 blur-3xl [animation-delay:700ms]" />
          </div>

          <div className="relative grid min-h-[620px] gap-8 p-6 md:grid-cols-[1fr_0.9fr] md:p-10">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
                <Sparkles size={14} />
                MedClick
              </div>

              <h3 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Montando seu documento
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Aguarde enquanto o sistema organiza os dados e prepara uma nova
                versão da prévia.
              </p>

              <div className="mt-8 space-y-3">
                {stages.map((stage, index) => {
                  const active = index === step;
                  const complete = index < step;

                  return (
                    <div
                      key={stage.title}
                      className={`flex items-start gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-500 ${
                        active
                          ? "border-teal-400/30 bg-teal-400/10"
                          : complete
                            ? "border-emerald-400/20 bg-emerald-400/5"
                            : "border-white/5 bg-white/[0.025]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          complete
                            ? "bg-emerald-400/15 text-emerald-300"
                            : active
                              ? "bg-teal-400/15 text-teal-300"
                              : "bg-white/5 text-slate-600"
                        }`}
                      >
                        {complete ? (
                          <CheckCircle2 size={17} />
                        ) : active ? (
                          <LoaderCircle className="animate-spin" size={17} />
                        ) : (
                          <span className="text-xs font-black">{index + 1}</span>
                        )}
                      </span>

                      <div>
                        <strong
                          className={
                            active || complete
                              ? "text-sm text-white"
                              : "text-sm text-slate-600"
                          }
                        >
                          {stage.title}
                        </strong>
                        <p
                          className={`mt-0.5 text-xs leading-5 ${
                            active
                              ? "text-slate-300"
                              : complete
                                ? "text-slate-500"
                                : "text-slate-700"
                          }`}
                        >
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>{stages[Math.min(step, 3)].title}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-teal-400 transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[390px]">
                <div className="absolute -inset-4 rounded-[32px] bg-teal-400/5 blur-xl" />

                <div className="relative aspect-[0.707] overflow-hidden rounded-[22px] bg-white shadow-2xl ring-1 ring-white/20">
                  <div className="absolute inset-x-0 top-0 h-3 bg-slate-100" />

                  <div className="space-y-4 p-7 pt-9">
                    <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="h-px bg-slate-200" />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-9 animate-pulse rounded-md bg-slate-100" />
                      <div className="h-9 animate-pulse rounded-md bg-slate-100 [animation-delay:100ms]" />
                      <div className="h-9 animate-pulse rounded-md bg-slate-100 [animation-delay:200ms]" />
                      <div className="h-9 animate-pulse rounded-md bg-slate-100 [animation-delay:300ms]" />
                    </div>

                    <div className="pt-5">
                      <div className="mx-auto h-5 w-36 animate-pulse rounded bg-slate-200" />
                    </div>

                    <div className="space-y-2 pt-4">
                      {[92, 100, 88, 96, 74].map((width, index) => (
                        <div
                          key={width + index}
                          className="h-2.5 animate-pulse rounded bg-slate-100"
                          style={{
                            width: `${width}%`,
                            animationDelay: `${index * 100}ms`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="pt-16">
                      <div className="mx-auto h-px w-2/3 bg-slate-200" />
                      <div className="mx-auto mt-3 h-3 w-44 animate-pulse rounded bg-slate-100" />
                    </div>

                    <div className="absolute bottom-8 left-7 right-7 flex items-end justify-between">
                      <div className="space-y-2">
                        <div className="h-2.5 w-40 animate-pulse rounded bg-slate-100" />
                        <div className="h-2.5 w-32 animate-pulse rounded bg-slate-100" />
                      </div>
                      <div className="grid h-16 w-16 grid-cols-5 gap-0.5 rounded bg-slate-900 p-1 opacity-20">
                        {Array.from({ length: 25 }).map((_, index) => (
                          <span
                            key={index}
                            className={
                              index % 3 === 0 || index % 7 === 0
                                ? "bg-white"
                                : "bg-slate-900"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-400/[0.025] to-transparent">
                    <div className="h-24 w-full animate-[scan_2.4s_ease-in-out_infinite] border-b border-teal-400/20 bg-gradient-to-b from-transparent to-teal-400/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes scan {
            0% {
              transform: translateY(-110%);
              opacity: 0;
            }
            15% {
              opacity: 1;
            }
            85% {
              opacity: 1;
            }
            100% {
              transform: translateY(650%);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function DocumentMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <strong className="mt-1 block break-words text-sm text-slate-900">
        {value}
      </strong>
    </div>
  );
}

function DoctorPreview({
  doctor,
}: {
  doctor: DoctorOption | null;
}) {
  if (!doctor) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-900">
      <strong className="block">{doctor.name}</strong>
      <span className="block">{doctor.email}</span>

      {doctor.doctorProfile && (
        <span className="mt-2 block">
          CRM {doctor.doctorProfile.crm}/
          {doctor.doctorProfile.crmState}
          {doctor.doctorProfile.specialty
            ? ` · ${doctor.doctorProfile.specialty}`
            : ""}
        </span>
      )}
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

function ActionButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
    >
      {children}
    </button>
  );
}