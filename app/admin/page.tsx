"use client";

import "@/app/saudeclick-dark.css";
import OnlineUsersCard from "@/components/admin/OnlineUsersCard";
import Admin3DAnalytics from "@/components/admin/Admin3DAnalytics";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CalendarDays,
  DollarSign,
  Eye,
  MoreVertical,
  TrendingDown,
  TrendingUp,
  Zap,
  Clock3,
  CreditCard,
  FileCheck2,
  FileText,
  Headphones,
  HeartPulse,
  Home,
  LayoutDashboard,
  Lightbulb,
  LoaderCircle,
  MessageCircle,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Stethoscope,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

type DocumentType =
  | "MEDICAL_CERTIFICATE"
  | "PRESCRIPTION"
  | "MEDICAL_REPORT";

type RequestStatus =
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "AI_DRAFT_IN_PREPARATION"
  | "AI_DRAFT_READY"
  | "ADMIN_REVIEW"
  | "PREVIEW_IN_PREPARATION"
  | "PREVIEW_READY"
  | "PREVIEW_SENT"
  | "CORRECTION_REQUESTED"
  | "PREVIEW_APPROVED"
  | "WAITING_PAYMENT_REQUEST"
  | "PAYMENT_REQUESTED"
  | "PIX_QR_CODE_GENERATED"
  | "PIX_QR_CODE_SENT"
  | "WAITING_PAYMENT"
  | "PAYMENT_PROOF_SENT"
  | "PAYMENT_UNDER_REVIEW"
  | "PAYMENT_REJECTED"
  | "PAYMENT_APPROVED"
  | "WAITING_MEDICAL_REVIEW"
  | "WAITING_SIGNATURE"
  | "FINAL_DOCUMENT_IN_PREPARATION"
  | "FINAL_DOCUMENT_SIGNED"
  | "FINAL_DOCUMENT_AUTHENTICATED"
  | "FINAL_DOCUMENT_AVAILABLE"
  | "FINAL_DOCUMENT_SENT"
  | "COMPLETED"
  | "CANCELLED";

type PaymentStatus =
  | "NOT_STARTED"
  | "PIX_REQUESTED"
  | "PIX_GENERATED"
  | "PIX_SENT"
  | "WAITING_PAYMENT"
  | "PROOF_SENT"
  | "UNDER_REVIEW"
  | "REJECTED"
  | "APPROVED"
  | "CANCELLED";

type ServiceRequest = {
  id: string;
  protocol: string;
  documentType: DocumentType;
  status: RequestStatus;
  unitType: "UPA" | "UNIMED";
  unitName: string;
  priceCents: number;
  createdAt: string;
  updatedAt: string;

  patient: {
    id: string;
    fullName: string;
    cpf: string;
    phone: string;
    email: string;
  };

  payment: {
    id: string;
    status: PaymentStatus;
    amountCents: number;
    qrCodeSentAt: string | null;
    approvedAt: string | null;
  } | null;

  medications: Array<{
    id: string;
    position: number;
    name: string;
    dosage: string;
    pharmaceuticalForm: string;
    boxQuantity: number;
    instructions: string;
  }>;

  _count: {
    attachments: number;
    generatedDocuments: number;
    statusHistory: number;
  };
};

type ApiResponse = {
  success: boolean;
  message?: string;
  requests?: ServiceRequest[];
};

type AdminUser = {
  id: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
};

type UsersApiResponse = {
  success: boolean;
  users?: AdminUser[];
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  RECEIVED: "Recebida",
  UNDER_REVIEW: "Em análise",
  ADDITIONAL_INFORMATION_REQUIRED: "Aguardando informações",
  AI_DRAFT_IN_PREPARATION: "Em preparação",
  AI_DRAFT_READY: "Rascunho pronto",
  ADMIN_REVIEW: "Revisão administrativa",
  PREVIEW_IN_PREPARATION: "Prévia em preparação",
  PREVIEW_READY: "Prévia pronta",
  PREVIEW_SENT: "Prévia enviada",
  CORRECTION_REQUESTED: "Correção solicitada",
  PREVIEW_APPROVED: "Prévia aprovada",
  WAITING_PAYMENT_REQUEST: "Aguardando cobrança",
  PAYMENT_REQUESTED: "Pagamento solicitado",
  PIX_QR_CODE_GENERATED: "PIX preparado",
  PIX_QR_CODE_SENT: "PIX enviado",
  WAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_PROOF_SENT: "Comprovante enviado",
  PAYMENT_UNDER_REVIEW: "Pagamento em análise",
  PAYMENT_REJECTED: "Pagamento rejeitado",
  PAYMENT_APPROVED: "Pagamento aprovado",
  WAITING_MEDICAL_REVIEW: "Aguardando revisão",
  WAITING_SIGNATURE: "Aguardando assinatura",
  FINAL_DOCUMENT_IN_PREPARATION: "Documento final em preparação",
  FINAL_DOCUMENT_SIGNED: "Documento assinado",
  FINAL_DOCUMENT_AUTHENTICATED: "Documento autenticado",
  FINAL_DOCUMENT_AVAILABLE: "Documento disponível",
  FINAL_DOCUMENT_SENT: "Documento enviado",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  MEDICAL_CERTIFICATE: "Atestado",
  PRESCRIPTION: "Receita",
  MEDICAL_REPORT: "Laudo",
};

const PAGE_SIZE = 6;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCpf(value: string) {
  const cpf = value.replace(/\D/g, "").slice(0, 11);

  if (cpf.length !== 11) {
    return value;
  }

  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(
    6,
    9,
  )}-${cpf.slice(9)}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinLastDays(date: Date, days: number) {
  const now = new Date();
  const limit = new Date(now);
  limit.setDate(now.getDate() - days);
  limit.setHours(0, 0, 0, 0);
  return date >= limit;
}

function statusClasses(status: RequestStatus) {
  if (
    status === "COMPLETED" ||
    status === "FINAL_DOCUMENT_SENT" ||
    status === "FINAL_DOCUMENT_AVAILABLE"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    status === "PAYMENT_REJECTED" ||
    status === "CORRECTION_REQUESTED" ||
    status === "CANCELLED"
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    status === "PAYMENT_APPROVED" ||
    status === "PREVIEW_APPROVED" ||
    status === "FINAL_DOCUMENT_AUTHENTICATED"
  ) {
    return "border-teal-200 bg-teal-50 text-teal-700";
  }

  if (
    status === "WAITING_PAYMENT" ||
    status === "PAYMENT_REQUESTED" ||
    status === "PIX_QR_CODE_SENT" ||
    status === "PAYMENT_PROOF_SENT" ||
    status === "PAYMENT_UNDER_REVIEW" ||
    status === "WAITING_PAYMENT_REQUEST"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    status === "PREVIEW_READY" ||
    status === "PREVIEW_SENT" ||
    status === "UNDER_REVIEW"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function statusGroup(status: RequestStatus) {
  if (
    ["COMPLETED", "FINAL_DOCUMENT_SENT", "FINAL_DOCUMENT_AVAILABLE"].includes(
      status,
    )
  ) {
    return "completed";
  }

  if (
    [
      "WAITING_PAYMENT_REQUEST",
      "PAYMENT_REQUESTED",
      "PIX_QR_CODE_GENERATED",
      "PIX_QR_CODE_SENT",
      "WAITING_PAYMENT",
      "PAYMENT_PROOF_SENT",
      "PAYMENT_UNDER_REVIEW",
      "PAYMENT_APPROVED",
    ].includes(status)
  ) {
    return "payment";
  }

  if (
    [
      "PREVIEW_READY",
      "PREVIEW_SENT",
      "CORRECTION_REQUESTED",
      "PREVIEW_APPROVED",
    ].includes(status)
  ) {
    return "preview";
  }

  if (
    [
      "UNDER_REVIEW",
      "ADDITIONAL_INFORMATION_REQUIRED",
      "AI_DRAFT_IN_PREPARATION",
      "AI_DRAFT_READY",
      "ADMIN_REVIEW",
      "PREVIEW_IN_PREPARATION",
      "WAITING_MEDICAL_REVIEW",
      "WAITING_SIGNATURE",
      "FINAL_DOCUMENT_IN_PREPARATION",
      "FINAL_DOCUMENT_SIGNED",
      "FINAL_DOCUMENT_AUTHENTICATED",
    ].includes(status)
  ) {
    return "review";
  }

  return "received";
}

export default function AdminPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [search, setSearch] = useState("");
  const [documentFilter, setDocumentFilter] = useState<
    "ALL" | DocumentType
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | RequestStatus
  >("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pendingUsers, setPendingUsers] = useState(0);

  async function loadPendingUsers() {
    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as UsersApiResponse;

      if (!response.ok || !data.success || !data.users) {
        return;
      }

      setPendingUsers(
        data.users.filter(
          (user) => user.approvalStatus === "PENDING",
        ).length,
      );
    } catch {
      // O dashboard continua funcional mesmo se o contador falhar.
    }
  }

  async function loadRequests(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/solicitacoes", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success || !data.requests) {
        throw new Error(
          data.message || "Não foi possível carregar as solicitações.",
        );
      }

      setRequests(data.requests);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Ocorreu um erro ao carregar o painel.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadRequests();
    void loadPendingUsers();

    const events =
      new EventSource(
        "/api/realtime/admin",
      );

    const syncRequests = () => {
      void loadRequests(false);
      void loadPendingUsers();
    };

    events.addEventListener(
      "requests-changed",
      syncRequests,
    );

    const channel =
      typeof BroadcastChannel !==
      "undefined"
        ? new BroadcastChannel(
            "saudeclick-realtime",
          )
        : null;

    channel?.addEventListener(
      "message",
      syncRequests,
    );

    const focusHandler = () => {
      void loadRequests(false);
      void loadPendingUsers();
    };

    window.addEventListener(
      "focus",
      focusHandler,
    );

    return () => {
      events.close();
      channel?.close();
      window.removeEventListener(
        "focus",
        focusHandler,
      );
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, documentFilter, statusFilter]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const numericSearch = normalizedSearch.replace(/\D/g, "");

    return requests.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        request.protocol.toLowerCase().includes(normalizedSearch) ||
        request.patient.fullName
          .toLowerCase()
          .includes(normalizedSearch) ||
        (numericSearch &&
          request.patient.cpf
            .replace(/\D/g, "")
            .includes(numericSearch));

      const matchesDocument =
        documentFilter === "ALL" ||
        request.documentType === documentFilter;

      const matchesStatus =
        statusFilter === "ALL" || request.status === statusFilter;

      return matchesSearch && matchesDocument && matchesStatus;
    });
  }, [requests, search, documentFilter, statusFilter]);

  const stats = useMemo(() => {
    const received = requests.filter(
      (request) => request.status === "RECEIVED",
    ).length;

    const review = requests.filter(
      (request) => statusGroup(request.status) === "review",
    ).length;

    const preview = requests.filter(
      (request) => statusGroup(request.status) === "preview",
    ).length;

    const payment = requests.filter(
      (request) => statusGroup(request.status) === "payment",
    ).length;

    const completed = requests.filter(
      (request) => statusGroup(request.status) === "completed",
    ).length;

    const totalValue = requests.reduce(
      (sum, request) => sum + request.priceCents,
      0,
    );

    const approvedValue = requests.reduce((sum, request) => {
      if (
        request.payment?.status === "APPROVED" ||
        statusGroup(request.status) === "completed"
      ) {
        return sum + (request.payment?.amountCents ?? request.priceCents);
      }

      return sum;
    }, 0);

    const today = requests.filter((request) =>
      isSameDay(new Date(request.createdAt), new Date()),
    ).length;

    const thisWeek = requests.filter((request) =>
      isWithinLastDays(new Date(request.createdAt), 7),
    ).length;

    return {
      total: requests.length,
      received,
      review,
      preview,
      payment,
      completed,
      totalValue,
      approvedValue,
      today,
      thisWeek,
    };
  }, [requests]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / PAGE_SIZE),
  );

  const visibleRequests = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, page, totalPages]);

  const chartSegments = useMemo(() => {
    const groups = [
      {
        key: "received",
        label: "Recebidas",
        value: requests.filter(
          (request) => statusGroup(request.status) === "received",
        ).length,
        color: "#10b981",
      },
      {
        key: "preview",
        label: "Prévia pronta",
        value: stats.preview,
        color: "#3b82f6",
      },
      {
        key: "review",
        label: "Em análise",
        value: stats.review,
        color: "#8b5cf6",
      },
      {
        key: "payment",
        label: "Aguard. pagamento",
        value: stats.payment,
        color: "#f59e0b",
      },
      {
        key: "completed",
        label: "Concluídas",
        value: stats.completed,
        color: "#06b6d4",
      },
    ];

    let cursor = 0;

    const gradient = groups
      .map((group) => {
        const share =
          stats.total > 0 ? (group.value / stats.total) * 100 : 0;
        const start = cursor;
        cursor += share;
        return `${group.color} ${start}% ${cursor}%`;
      })
      .join(", ");

    return {
      groups,
      gradient:
        stats.total > 0
          ? `conic-gradient(${gradient})`
          : "conic-gradient(#e2e8f0 0% 100%)",
    };
  }, [requests, stats]);


  const revenueSeries = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      day.setHours(0, 0, 0, 0);

      const next = new Date(day);
      next.setDate(day.getDate() + 1);

      const value = requests.reduce((sum, request) => {
        const created = new Date(request.createdAt);

        if (created >= day && created < next) {
          if (
            request.payment?.status === "APPROVED" ||
            statusGroup(request.status) === "completed"
          ) {
            return sum + (request.payment?.amountCents ?? request.priceCents);
          }
        }

        return sum;
      }, 0);

      return {
        label: new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }).format(day),
        value,
      };
    });
  }, [requests]);

  const todayRevenue = useMemo(() => {
    const now = new Date();

    return requests.reduce((sum, request) => {
      const created = new Date(request.createdAt);

      if (
        isSameDay(created, now) &&
        (request.payment?.status === "APPROVED" ||
          statusGroup(request.status) === "completed")
      ) {
        return sum + (request.payment?.amountCents ?? request.priceCents);
      }

      return sum;
    }, 0);
  }, [requests]);

  const documentDistribution = useMemo(() => {
    const atestado = requests.filter(
      (request) => request.documentType === "MEDICAL_CERTIFICATE",
    ).length;
    const receita = requests.filter(
      (request) => request.documentType === "PRESCRIPTION",
    ).length;
    const laudo = requests.filter(
      (request) => request.documentType === "MEDICAL_REPORT",
    ).length;

    const total = Math.max(1, atestado + receita + laudo);

    return [
      {
        label: "Atestado médico",
        value: atestado,
        percentage: Math.round((atestado / total) * 100),
        color: "#268cff",
      },
      {
        label: "Receita médica",
        value: receita,
        percentage: Math.round((receita / total) * 100),
        color: "#16d7b0",
      },
      {
        label: "Laudo médico",
        value: laudo,
        percentage: Math.round((laudo / total) * 100),
        color: "#915cff",
      },
    ];
  }, [requests]);

  const approvalRate =
    stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;

  return (
    <main className="saudeclick-shell relative min-h-screen overflow-x-hidden bg-[#020710] text-slate-100">
      <CyberBackground />

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[250px] flex-col border-r border-cyan-400/10 bg-[#020914]/96 text-white shadow-[22px_0_80px_rgba(0,0,0,.32)] 2xl:flex">
        <div className="border-b border-white/[0.06] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="brand-orb relative flex h-12 w-12 items-center justify-center rounded-[18px] border border-cyan-300/25 bg-[radial-gradient(circle_at_35%_25%,#143d64,#071727_60%,#020914)] shadow-[0_0_32px_rgba(23,215,255,.16)]">
              <HeartPulse size={25} className="text-cyan-300" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-300 ring-2 ring-[#020914]" />
            </div>
            <div>
              <strong className="block text-[21px] font-black tracking-[-0.04em] text-white">
                SaúdeClick
              </strong>
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                Painel administrativo
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/admin" active />
          <SidebarItem icon={FileText} label="Solicitações" href="/admin" badge={stats.total} />
          <SidebarItem icon={Users} label="Usuários" href="/admin/usuarios" badge={pendingUsers} />
          <SidebarItem icon={UserRound} label="Pacientes" href="/admin" />
          <SidebarItem icon={Stethoscope} label="Médicos" href="/admin" />
          <SidebarItem icon={FileCheck2} label="Documentos" href="/admin" />
          <SidebarItem icon={BarChart3} label="Relatórios" href="/admin" />
          <SidebarItem icon={CircleDollarSign} label="Financeiro" href="/admin" />
          <SidebarItem icon={Settings} label="Configurações" href="/admin" />
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/15 bg-[#091a2b] text-[11px] font-black text-cyan-100">
                AD
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[11px] font-black text-white">
                  Administrador
                </strong>
                <span className="block truncate text-[9px] text-slate-500">
                  admin@saudeclick.com
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>
            </div>

            <div className="mt-3">
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <div className="relative z-10 2xl:pl-[250px]">
        <header className="sticky top-0 z-40 border-b border-cyan-400/10 bg-[#020914]/88 backdrop-blur-2xl">
          <div className="flex min-h-[78px] items-center gap-4 px-4 sm:px-6 xl:px-7">
            <div className="min-w-[220px]">
              <h1 className="text-[24px] font-black tracking-[-0.04em] text-white">
                Dashboard
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                Visão geral do sistema em tempo real
              </p>
            </div>

            <div className="mx-auto hidden w-full max-w-[520px] lg:block">
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por paciente, protocolo, documento..."
                  className="h-11 w-full rounded-xl border border-cyan-300/10 bg-[#06111f]/90 pl-11 pr-4 text-[11px] font-semibold text-slate-200 outline-none transition focus:border-cyan-400/35 focus:ring-4 focus:ring-cyan-400/[0.05]"
                />
              </label>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/admin/usuarios"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
                aria-label="Notificações"
              >
                <Bell size={16} />
                {pendingUsers > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white ring-2 ring-[#020914]">
                    {Math.min(pendingUsers, 99)}
                  </span>
                )}
              </Link>

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
                aria-label="Tema"
              >
                <Moon size={16} />
              </button>

              <div className="hidden items-center gap-3 pl-3 sm:flex">
                <div className="text-right">
                  <strong className="block text-[10px] font-black text-white">
                    Administrador
                  </strong>
                  <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/15 bg-[#0a1828] text-[11px] font-black text-cyan-100">
                  AD
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1720px] space-y-4 p-3 sm:p-4 xl:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <NeonStatCard
              label="Solicitações"
              value={stats.total}
              helper={`${stats.received} recebidas agora`}
              trend="+18%"
              icon={CheckCircle2}
              tone="blue"
              delay={0}
            />
            <NeonStatCard
              label="Em análise"
              value={stats.review}
              helper="revisão e preparação"
              trend="+33%"
              icon={Activity}
              tone="emerald"
              delay={70}
            />
            <NeonStatCard
              label="Aguardando pagamento"
              value={stats.payment}
              helper="PIX e comprovantes"
              trend={stats.payment > 0 ? "-20%" : "0%"}
              icon={WalletCards}
              tone="violet"
              delay={140}
            />
            <NeonStatCard
              label="Concluídas hoje"
              value={stats.completed}
              helper={`${stats.today} movimentações hoje`}
              trend="+40%"
              icon={FileCheck2}
              tone="cyan"
              delay={210}
            />
            <NeonStatCard
              label="Receita hoje"
              value={formatCurrency(todayRevenue)}
              helper="valor aprovado"
              trend="+28%"
              icon={DollarSign}
              tone="gold"
              delay={280}
              wideValue
            />
          </div>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_410px]">
            <section className="cyber-card overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-cyan-400/10 px-4 py-4 xl:flex-row xl:items-center">
                <div>
                  <h2 className="text-[16px] font-black text-white">
                    Solicitações recentes
                  </h2>
                </div>

                <div className="ml-auto grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-[170px_170px_110px_180px]">
                  <select
                    value={documentFilter}
                    onChange={(event) =>
                      setDocumentFilter(event.target.value as "ALL" | DocumentType)
                    }
                    className="h-9 rounded-lg border border-cyan-300/10 bg-[#06111f] px-3 text-[9px] font-bold text-slate-300 outline-none focus:border-cyan-300/30"
                  >
                    <option value="ALL">Todos os documentos</option>
                    <option value="MEDICAL_CERTIFICATE">Atestado</option>
                    <option value="PRESCRIPTION">Receita</option>
                    <option value="MEDICAL_REPORT">Laudo</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "ALL" | RequestStatus)
                    }
                    className="h-9 rounded-lg border border-cyan-300/10 bg-[#06111f] px-3 text-[9px] font-bold text-slate-300 outline-none focus:border-cyan-300/30"
                  >
                    <option value="ALL">Todos os status</option>
                    {Object.entries(STATUS_LABELS).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-cyan-300/10 bg-[#06111f] px-3 text-[9px] font-black text-slate-300"
                  >
                    <CalendarDays size={12} />
                    Hoje
                  </button>

                  <label className="relative hidden xl:block">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      size={12}
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar..."
                      className="h-9 w-full rounded-lg border border-cyan-300/10 bg-[#06111f] pl-8 pr-3 text-[9px] text-slate-300 outline-none focus:border-cyan-300/30"
                    />
                  </label>
                </div>
              </div>

              {error && (
                <div className="m-3 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-[10px] text-red-200">
                  <AlertCircle className="mt-0.5 shrink-0" size={14} />
                  <div>
                    <strong className="block">Não foi possível carregar o painel</strong>
                    <span className="mt-0.5 block">{error}</span>
                  </div>
                </div>
              )}

              {loading ? (
                <DashboardSkeleton />
              ) : filteredRequests.length === 0 ? (
                <div className="flex h-[360px] items-center justify-center p-6 text-center">
                  <div>
                    <FileText className="mx-auto text-slate-600" size={34} />
                    <h3 className="mt-3 text-sm font-black text-slate-300">
                      Nenhuma solicitação encontrada
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Aguarde novas solicitações ou ajuste os filtros.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-auto dashboard-scroll">
                  <table className="w-full min-w-[980px]">
                    <thead className="sticky top-0 z-10 bg-[#071321]/95 backdrop-blur-xl">
                      <tr className="border-b border-cyan-400/10">
                        <TableHeader>Protocolo</TableHeader>
                        <TableHeader>Paciente</TableHeader>
                        <TableHeader>Documento</TableHeader>
                        <TableHeader>Unidade</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader>Valor</TableHeader>
                        <TableHeader>Data</TableHeader>
                        <TableHeader>Ação</TableHeader>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleRequests.map((request, index) => (
                        <tr
                          key={request.id}
                          className="table-row-enter group border-b border-cyan-400/[0.06] bg-[#06111d]/35 transition duration-300 hover:bg-cyan-400/[0.035]"
                          style={{ animationDelay: `${index * 55}ms` }}
                        >
                          <TableCell>
                            <strong className="whitespace-nowrap font-mono text-[10px] font-black text-cyan-300">
                              {request.protocol}
                            </strong>
                          </TableCell>

                          <TableCell>
                            <div className="min-w-[180px]">
                              <strong className="block truncate text-[10px] font-black text-white">
                                {request.patient.fullName}
                              </strong>
                              <span className="mt-0.5 block text-[8px] font-semibold text-slate-500">
                                {formatCpf(request.patient.cpf)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[9px] font-semibold text-slate-300">
                              <FileText size={12} className="text-cyan-300" />
                              {DOCUMENT_LABELS[request.documentType]}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="min-w-[120px]">
                              <strong className="block text-[9px] font-black text-slate-200">
                                {request.unitName?.toLowerCase().startsWith("hapvida")
                                  ? "Hapvida"
                                  : request.unitType === "UPA"
                                    ? "UPA"
                                    : "Unimed"}
                              </strong>
                              <span className="block max-w-[140px] truncate text-[8px] text-slate-500">
                                {request.unitName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[8px] font-black ${statusClasses(
                                request.status,
                              )}`}
                            >
                              {STATUS_LABELS[request.status]}
                            </span>
                          </TableCell>

                          <TableCell>
                            <strong className="whitespace-nowrap text-[9px] font-black text-white">
                              {formatCurrency(request.priceCents)}
                            </strong>
                          </TableCell>

                          <TableCell>
                            <span className="whitespace-nowrap text-[8px] font-semibold text-slate-400">
                              {formatDate(request.createdAt)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/admin/solicitacoes/${encodeURIComponent(
                                  request.protocol,
                                )}`}
                                className="inline-flex h-7 items-center gap-1 rounded-md border border-cyan-300/20 bg-cyan-400/[0.06] px-2.5 text-[8px] font-black text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/[0.12]"
                              >
                                Ver
                                <Eye size={11} />
                              </Link>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] text-slate-500 transition hover:text-white"
                              >
                                <MoreVertical size={12} />
                              </button>
                            </div>
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex items-center justify-between border-t border-cyan-400/10 px-4 py-3">
                    <span className="text-[8px] font-semibold text-slate-500">
                      Mostrando{" "}
                      {filteredRequests.length === 0
                        ? 0
                        : (Math.min(page, totalPages) - 1) * PAGE_SIZE + 1}{" "}
                      a{" "}
                      {Math.min(
                        Math.min(page, totalPages) * PAGE_SIZE,
                        filteredRequests.length,
                      )}{" "}
                      de {filteredRequests.length} resultados
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={page <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-slate-500 transition hover:border-cyan-300/25 hover:text-cyan-200 disabled:opacity-25"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <span className="flex h-8 min-w-8 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-400/[0.08] px-2 text-[9px] font-black text-cyan-200">
                        {Math.min(page, totalPages)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPage((current) => Math.min(totalPages, current + 1))
                        }
                        disabled={page >= totalPages}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-slate-500 transition hover:border-cyan-300/25 hover:text-cyan-200 disabled:opacity-25"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <Admin3DAnalytics
                received={stats.received}
                review={stats.review}
                payment={stats.payment}
                completed={stats.completed}
                total={stats.total}
              />

              <OnlineUsersCard />
            </aside>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_.78fr_1.05fr]">
            <RevenueChart data={revenueSeries} />

            <DocumentDistribution
              data={documentDistribution}
              total={requests.length}
            />

            <QuickMetrics
              approvalRate={approvalRate}
              completed={stats.completed}
              totalValue={stats.approvedValue}
              thisWeek={stats.thisWeek}
            />
          </div>

          <LiveActivityFeed requests={requests} />

          <footer className="pb-2 pt-1 text-center text-[8px] font-semibold text-slate-600">
            © 2026 SaúdeClick — operação em tempo real.
          </footer>
        </section>
      </div>

      <DashboardStyles />
    </main>
  );
}

function CyberBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="cyber-grid absolute inset-0 opacity-60" />
      <div className="cyber-wave cyber-wave-a absolute" />
      <div className="cyber-wave cyber-wave-b absolute" />
      <div className="cyber-wave cyber-wave-c absolute" />
      {Array.from({ length: 22 }).map((_, index) => (
        <span
          key={index}
          className="cyber-star absolute h-1 w-1 rounded-full bg-cyan-300"
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 53) % 100}%`,
            animationDelay: `${-(index % 7) * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  href,
  active = false,
  badge,
}: {
  icon: typeof FileText;
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] font-bold transition-all duration-300 ${
        active
          ? "border border-cyan-400/25 bg-[linear-gradient(90deg,rgba(38,140,255,.22),rgba(23,215,255,.08))] text-cyan-50 shadow-[0_0_28px_rgba(38,140,255,.08)]"
          : "border border-transparent text-slate-400 hover:translate-x-0.5 hover:border-white/[0.05] hover:bg-white/[0.025] hover:text-white"
      }`}
    >
      <Icon
        size={15}
        className={`transition duration-300 group-hover:scale-110 ${
          active ? "text-cyan-300" : "text-slate-500"
        }`}
      />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex min-w-5 items-center justify-center rounded-md bg-blue-500 px-1.5 py-0.5 text-[8px] font-black text-white shadow-[0_0_16px_rgba(38,140,255,.35)]">
          {badge}
        </span>
      )}
    </Link>
  );
}

function NeonStatCard({
  label,
  value,
  helper,
  trend,
  icon: Icon,
  tone,
  delay,
  wideValue = false,
}: {
  label: string;
  value: string | number;
  helper: string;
  trend: string;
  icon: typeof FileText;
  tone: "blue" | "emerald" | "violet" | "cyan" | "gold";
  delay: number;
  wideValue?: boolean;
}) {
  const tones = {
    blue: {
      border: "border-blue-400/25",
      glow: "shadow-[0_0_34px_rgba(38,140,255,.08)]",
      icon: "border-blue-300/20 bg-blue-500/10 text-blue-300",
      trend: "text-cyan-300",
    },
    emerald: {
      border: "border-emerald-400/25",
      glow: "shadow-[0_0_34px_rgba(16,224,155,.07)]",
      icon: "border-emerald-300/20 bg-emerald-500/10 text-emerald-300",
      trend: "text-emerald-300",
    },
    violet: {
      border: "border-violet-400/25",
      glow: "shadow-[0_0_34px_rgba(145,92,255,.08)]",
      icon: "border-violet-300/20 bg-violet-500/10 text-violet-300",
      trend: "text-violet-300",
    },
    cyan: {
      border: "border-cyan-400/25",
      glow: "shadow-[0_0_34px_rgba(23,215,255,.08)]",
      icon: "border-cyan-300/20 bg-cyan-500/10 text-cyan-300",
      trend: "text-cyan-300",
    },
    gold: {
      border: "border-amber-400/25",
      glow: "shadow-[0_0_34px_rgba(245,158,11,.08)]",
      icon: "border-amber-300/20 bg-amber-500/10 text-amber-300",
      trend: "text-emerald-300",
    },
  };

  const style = tones[tone];

  return (
    <article
      className={`dashboard-enter neon-stat group relative overflow-hidden rounded-[14px] border bg-[#071321]/88 p-3.5 ${style.border} ${style.glow}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="neon-stat-scan absolute inset-y-0 -left-12 w-10 rotate-12 bg-white/10 blur-xl" />
      <div className="relative flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.icon}`}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[8px] font-black uppercase tracking-[.06em] text-slate-400">
            {label}
          </span>
          <strong
            className={`mt-1 block font-black leading-none text-white ${
              wideValue ? "text-[19px]" : "text-[23px]"
            }`}
          >
            {value}
          </strong>
          <div className="mt-1.5 flex items-center gap-1.5">
            <TrendingUp size={10} className={style.trend} />
            <span className={`text-[8px] font-black ${style.trend}`}>{trend}</span>
            <span className="truncate text-[8px] font-semibold text-slate-600">
              {helper}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function RevenueChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));
  const points = data
    .map((item, index) => {
      const x = 18 + (index / Math.max(1, data.length - 1)) * 264;
      const y = 122 - (item.value / max) * 92;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="cyber-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-black text-white">
            Receita dos últimos 7 dias
          </h3>
          <p className="mt-1 text-[8px] font-semibold text-slate-600">
            Valores aprovados
          </p>
        </div>
        <span className="rounded-md border border-cyan-300/15 bg-cyan-400/[0.05] px-2 py-1 text-[8px] font-black text-cyan-200">
          LIVE
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-cyan-400/[0.06] bg-[#04101c]/70 p-2">
        <svg viewBox="0 0 300 150" className="h-[175px] w-full">
          <defs>
            <linearGradient id="revenueLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#17d7ff" />
              <stop offset="55%" stopColor="#17e4b2" />
              <stop offset="100%" stopColor="#278cff" />
            </linearGradient>
            <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#17d7ff" stopOpacity=".22" />
              <stop offset="100%" stopColor="#17d7ff" stopOpacity="0" />
            </linearGradient>
            <filter id="revenueGlow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {Array.from({ length: 5 }).map((_, index) => (
            <line
              key={index}
              x1="15"
              y1={22 + index * 25}
              x2="286"
              y2={22 + index * 25}
              stroke="rgba(65,120,166,.13)"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}

          <polygon
            points={`18,130 ${points} 282,130`}
            fill="url(#revenueArea)"
          />
          <polyline
            points={points}
            fill="none"
            stroke="url(#revenueLine)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#revenueGlow)"
            className="revenue-line"
          />

          {data.map((item, index) => {
            const x = 18 + (index / Math.max(1, data.length - 1)) * 264;
            const y = 122 - (item.value / max) * 92;

            return (
              <g key={item.label}>
                <circle
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#071321"
                  stroke="#24e2d3"
                  strokeWidth="2"
                  className="chart-dot"
                />
                <text
                  x={x}
                  y="144"
                  fill="#64748b"
                  fontSize="7"
                  textAnchor="middle"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function DocumentDistribution({
  data,
  total,
}: {
  data: Array<{
    label: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  total: number;
}) {
  let cursor = 0;
  const segments = data
    .map((item) => {
      const start = cursor;
      cursor += item.percentage;
      return `${item.color} ${start}% ${cursor}%`;
    })
    .join(", ");

  return (
    <section className="cyber-card p-4">
      <h3 className="text-[14px] font-black text-white">
        Distribuição de documentos
      </h3>

      <div className="mt-5 flex items-center gap-5">
        <div
          className="donut-live relative h-[150px] w-[150px] shrink-0 rounded-full"
          style={{
            background:
              total > 0
                ? `conic-gradient(${segments})`
                : "conic-gradient(#172338 0% 100%)",
          }}
        >
          <div className="absolute inset-[22px] flex items-center justify-center rounded-full border border-cyan-400/10 bg-[#06111f] shadow-[inset_0_0_28px_rgba(0,0,0,.48)]">
            <div className="text-center">
              <span className="block text-[9px] text-slate-500">Total</span>
              <strong className="block text-[26px] font-black text-white">
                {total}
              </strong>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]"
                style={{ background: item.color, color: item.color }}
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[9px] font-semibold text-slate-300">
                  {item.label}
                </span>
                <span className="text-[8px] text-slate-600">
                  {item.value} ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickMetrics({
  approvalRate,
  completed,
  totalValue,
  thisWeek,
}: {
  approvalRate: number;
  completed: number;
  totalValue: number;
  thisWeek: number;
}) {
  const metrics = [
    {
      label: "Taxa de aprovação",
      value: `${approvalRate}%`,
      trend: "+12%",
      tone: "gold",
    },
    {
      label: "Tempo médio",
      value: "24m",
      trend: "-8%",
      tone: "rose",
    },
    {
      label: "Clientes atendidos",
      value: String(thisWeek),
      trend: "+15%",
      tone: "emerald",
    },
    {
      label: "Documentos emitidos",
      value: String(completed),
      trend: "+20%",
      tone: "blue",
    },
  ];

  return (
    <section className="cyber-card p-4">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-[14px] font-black text-white">Resumo rápido</h3>
          <p className="mt-1 text-[8px] text-slate-600">
            Receita aprovada: {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`metric-card metric-${metric.tone} rounded-xl border border-white/[0.06] bg-[#06111f]/80 p-3`}
            style={{ animationDelay: `${index * -0.5}s` }}
          >
            <span className="text-[8px] font-semibold text-slate-500">
              {metric.label}
            </span>
            <strong className="mt-2 block text-[21px] font-black text-white">
              {metric.value}
            </strong>
            <span
              className={`mt-1 inline-flex items-center gap-1 text-[8px] font-black ${
                metric.trend.startsWith("-") ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {metric.trend.startsWith("-") ? (
                <TrendingDown size={9} />
              ) : (
                <TrendingUp size={9} />
              )}
              {metric.trend}
            </span>
            <span className="metric-spark mt-3 block h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
          </div>
        ))}
      </div>
    </section>
  );
}

function LiveActivityFeed({
  requests,
}: {
  requests: ServiceRequest[];
}) {
  const items = requests
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  return (
    <section className="cyber-card overflow-hidden p-4">
      <h3 className="text-[14px] font-black text-white">
        Atividades em tempo real
      </h3>

      <div className="mt-4 flex min-w-0 items-center gap-2 overflow-x-auto dashboard-scroll pb-1">
        {items.length === 0 ? (
          <span className="text-[9px] text-slate-600">
            Nenhuma atividade recente.
          </span>
        ) : (
          items.map((request, index) => (
            <div key={request.id} className="flex shrink-0 items-center gap-2">
              <div className="activity-node min-w-[205px] rounded-xl border border-cyan-300/[0.08] bg-[#06111f]/80 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/[0.06] text-cyan-300 shadow-[0_0_20px_rgba(23,215,255,.08)]">
                    <Zap size={14} />
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-[9px] font-black text-white">
                      {STATUS_LABELS[request.status]}
                    </strong>
                    <span className="block truncate font-mono text-[8px] text-cyan-400">
                      {request.protocol}
                    </span>
                    <span className="block truncate text-[8px] text-slate-500">
                      {request.patient.fullName}
                    </span>
                  </div>
                </div>
              </div>
              {index < items.length - 1 && (
                <ChevronRight size={15} className="activity-arrow text-cyan-500/60" />
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-3">
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_1.4fr_0.8fr_0.9fr_0.8fr_0.6fr_0.8fr_0.5fr] gap-3 rounded-xl border border-cyan-400/[0.06] p-3"
          >
            {Array.from({ length: 8 }).map((__, cell) => (
              <div
                key={cell}
                className="h-4 animate-pulse rounded bg-cyan-400/[0.04]"
                style={{ animationDelay: `${(index + cell) * 45}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-left text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-2.5 align-middle text-[9px] text-slate-300">
      {children}
    </td>
  );
}

function DashboardStyles() {
  return (
    <style jsx global>{`
      @keyframes dashboardEnter {
        from {
          opacity: 0;
          transform: translateY(14px) scale(.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes tableRowEnter {
        from {
          opacity: 0;
          transform: translateX(-7px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes cyberTwinkle {
        0%,100% {
          opacity: .10;
          transform: scale(.7);
          box-shadow: 0 0 0 rgba(23,215,255,0);
        }
        50% {
          opacity: .85;
          transform: scale(1.35);
          box-shadow: 0 0 14px 3px rgba(23,215,255,.25);
        }
      }

      @keyframes cyberWaveA {
        0%,100% {
          transform: translate3d(-4%, 4%, 0) rotate(-9deg) scaleX(1);
          opacity: .24;
        }
        50% {
          transform: translate3d(8%, -7%, 0) rotate(-4deg) scaleX(1.12);
          opacity: .55;
        }
      }

      @keyframes cyberWaveB {
        0%,100% {
          transform: translate3d(4%, 0, 0) rotate(6deg) scale(1);
          opacity: .16;
        }
        50% {
          transform: translate3d(-8%, 6%, 0) rotate(10deg) scale(1.14);
          opacity: .42;
        }
      }

      @keyframes statScan {
        0% {
          transform: translateX(-80px) rotate(12deg);
          opacity: 0;
        }
        35% {
          opacity: .25;
        }
        100% {
          transform: translateX(420px) rotate(12deg);
          opacity: 0;
        }
      }

      @keyframes cardBreath {
        0%,100% {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.015),
            0 16px 55px rgba(0,0,0,.24);
        }
        50% {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025),
            0 18px 72px rgba(23,215,255,.045);
        }
      }

      @keyframes sparkMove {
        0%,100% {
          opacity: .35;
          transform: scaleX(.62);
        }
        50% {
          opacity: 1;
          transform: scaleX(1);
        }
      }

      @keyframes activityPulse {
        0%,100% {
          border-color: rgba(23,215,255,.08);
          transform: translateY(0);
        }
        50% {
          border-color: rgba(23,215,255,.20);
          transform: translateY(-2px);
        }
      }

      @keyframes arrowPulse {
        0%,100% { opacity: .22; transform: translateX(0); }
        50% { opacity: .9; transform: translateX(4px); }
      }

      @keyframes revenueDraw {
        from {
          stroke-dasharray: 520;
          stroke-dashoffset: 520;
        }
        to {
          stroke-dasharray: 520;
          stroke-dashoffset: 0;
        }
      }

      @keyframes chartDotPulse {
        0%,100% {
          r: 3.5;
          filter: drop-shadow(0 0 0 rgba(36,226,211,0));
        }
        50% {
          r: 5;
          filter: drop-shadow(0 0 5px rgba(36,226,211,.8));
        }
      }

      @keyframes donutSpin {
        0% { transform: rotate(0deg); filter: saturate(1); }
        50% { filter: saturate(1.22) brightness(1.08); }
        100% { transform: rotate(360deg); filter: saturate(1); }
      }

      .dashboard-enter {
        opacity: 0;
        animation: dashboardEnter 520ms cubic-bezier(.22,1,.36,1) forwards;
      }

      .table-row-enter {
        opacity: 0;
        animation: tableRowEnter 380ms ease-out forwards;
      }

      .cyber-card {
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(73,132,184,.14);
        border-radius: 15px;
        background:
          linear-gradient(180deg, rgba(7,19,33,.94), rgba(4,13,24,.94));
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.015),
          0 16px 55px rgba(0,0,0,.24);
        animation: cardBreath 5.5s ease-in-out infinite;
      }

      .cyber-card::before {
        content: "";
        pointer-events: none;
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 12% 0%, rgba(23,215,255,.035), transparent 25%),
          radial-gradient(circle at 100% 20%, rgba(145,92,255,.025), transparent 25%);
      }

      .cyber-grid {
        background-image:
          linear-gradient(rgba(38,140,255,.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(38,140,255,.035) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: radial-gradient(circle at 50% 40%, black, transparent 82%);
      }

      .cyber-wave {
        width: 720px;
        height: 180px;
        border-radius: 50%;
        border: 1px solid rgba(38,140,255,.13);
        box-shadow:
          0 0 22px rgba(38,140,255,.08),
          inset 0 0 22px rgba(23,215,255,.03);
        filter: blur(.2px);
      }

      .cyber-wave-a {
        left: -170px;
        top: 11%;
        animation: cyberWaveA 8s ease-in-out infinite;
      }

      .cyber-wave-b {
        right: -180px;
        top: 23%;
        border-color: rgba(145,92,255,.13);
        animation: cyberWaveB 10s ease-in-out infinite;
      }

      .cyber-wave-c {
        left: 18%;
        bottom: -80px;
        width: 980px;
        border-color: rgba(23,215,255,.10);
        animation: cyberWaveA 12s ease-in-out infinite reverse;
      }

      .cyber-star {
        animation: cyberTwinkle 3.4s ease-in-out infinite;
      }

      .brand-orb {
        animation: cardBreath 4s ease-in-out infinite;
      }

      .neon-stat {
        animation:
          dashboardEnter 520ms cubic-bezier(.22,1,.36,1) forwards,
          cardBreath 5.2s ease-in-out infinite;
      }

      .neon-stat:hover .neon-stat-scan {
        animation: statScan 1.1s ease-out;
      }

      .metric-card {
        animation: activityPulse 4s ease-in-out infinite;
      }

      .metric-spark {
        animation: sparkMove 2.4s ease-in-out infinite;
      }

      .activity-node {
        animation: activityPulse 3.8s ease-in-out infinite;
      }

      .activity-arrow {
        animation: arrowPulse 1.7s ease-in-out infinite;
      }

      .revenue-line {
        animation:
          revenueDraw 1.4s cubic-bezier(.22,1,.36,1) both;
      }

      .chart-dot {
        animation: chartDotPulse 2.2s ease-in-out infinite;
      }

      .donut-live {
        animation: donutSpin 22s linear infinite;
        box-shadow:
          0 0 30px rgba(38,140,255,.08),
          0 0 45px rgba(145,92,255,.06);
      }

      .dashboard-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(52,112,162,.34) transparent;
      }

      .dashboard-scroll::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }

      .dashboard-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .dashboard-scroll::-webkit-scrollbar-thumb {
        background: rgba(52,112,162,.34);
        border-radius: 999px;
      }

      @media (prefers-reduced-motion: reduce) {
        .dashboard-enter,
        .table-row-enter,
        .cyber-star,
        .cyber-wave,
        .neon-stat,
        .metric-card,
        .metric-spark,
        .activity-node,
        .activity-arrow,
        .revenue-line,
        .chart-dot,
        .donut-live {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}
