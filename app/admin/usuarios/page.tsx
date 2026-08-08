"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "DOCTOR" | "PATIENT";
  active: boolean;
  approvalStatus: ApprovalStatus;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = {
  success: boolean;
  message?: string;
  users?: UserItem[];
};

const statusLabels: Record<ApprovalStatus, string> = {
  PENDING: "Aguardando",
  APPROVED: "Liberado",
  REJECTED: "Recusado",
};

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | ApprovalStatus
  >("PENDING");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [workingId, setWorkingId] =
    useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadUsers(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const response = await fetch("/api/admin/usuarios", {
        cache: "no-store",
      });

      const data = (await response.json()) as UsersResponse;

      if (!response.ok || !data.success || !data.users) {
        throw new Error(
          data.message ||
            "Não foi possível carregar os usuários.",
        );
      }

      setUsers(data.users);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao carregar usuários.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function act(
    id: string,
    action: "approve" | "reject" | "reactivate",
  ) {
    try {
      setWorkingId(id);
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/admin/usuarios/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      const data =
        (await response.json()) as UsersResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Não foi possível atualizar o usuário.",
        );
      }

      setMessage(
        action === "reject"
          ? "Cadastro recusado."
          : "Acesso liberado com sucesso.",
      );

      await loadUsers(true);

      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("medclick-admin");
        channel.postMessage({
          type: "USERS_CHANGED",
          at: Date.now(),
        });
        channel.close();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao atualizar usuário.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  useEffect(() => {
    void loadUsers();

    const interval = window.setInterval(() => {
      void loadUsers(true);
    }, 3000);

    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("medclick-admin")
        : null;

    channel?.addEventListener("message", (event) => {
      if (
        event.data?.type === "USERS_CHANGED" ||
        event.data?.type === "REQUESTS_CHANGED"
      ) {
        void loadUsers(true);
      }
    });

    const focusHandler = () => {
      void loadUsers(true);
    };

    window.addEventListener("focus", focusHandler);

    return () => {
      window.clearInterval(interval);
      channel?.close();
      window.removeEventListener("focus", focusHandler);
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        filter === "ALL" ||
        user.approvalStatus === filter;

      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [users, search, filter]);

  const stats = useMemo(
    () => ({
      pending: users.filter(
        (user) => user.approvalStatus === "PENDING",
      ).length,
      approved: users.filter(
        (user) => user.approvalStatus === "APPROVED",
      ).length,
      rejected: users.filter(
        (user) => user.approvalStatus === "REJECTED",
      ).length,
      total: users.length,
    }),
    [users],
  );

  return (
    <main className="min-h-screen bg-[#f5f8fc] px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="users-enter mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-50 hover:text-teal-700"
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
          <span className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-[10px] font-black text-teal-700">
            <Users size={14} />
            Usuários
            {stats.pending > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] text-white">
                {stats.pending}
              </span>
            )}
          </span>
        </nav>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-700">
              Administração
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Liberação de usuários
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Analise novos cadastros e libere o acesso
              manualmente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"
            >
              <LayoutDashboard size={15} />
              Dashboard
            </Link>

            <button
              type="button"
              onClick={() => void loadUsers(true)}
              disabled={refreshing}
              className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"
            >
              {refreshing ? (
                <LoaderCircle
                  className="animate-spin"
                  size={15}
                />
              ) : (
                <RefreshCw
                  className="transition-transform duration-500 group-hover:rotate-180"
                  size={15}
                />
              )}
              Atualizar
            </button>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            icon={Clock3}
            label="Aguardando"
            value={stats.pending}
            tone="amber"
          />
          <Stat
            icon={UserCheck}
            label="Liberados"
            value={stats.approved}
            tone="emerald"
          />
          <Stat
            icon={Ban}
            label="Recusados"
            value={stats.rejected}
            tone="red"
          />
          <Stat
            icon={Users}
            label="Total"
            value={stats.total}
            tone="blue"
          />
        </section>

        <section className="users-enter mt-5 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.055)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black">
                Cadastros
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Liberação manual antes do primeiro acesso.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[240px_160px]">
              <label className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Buscar nome ou e-mail"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-[11px] outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100/60"
                />
              </label>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target.value as
                      | "ALL"
                      | ApprovalStatus,
                  )
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 outline-none"
              >
                <option value="PENDING">
                  Aguardando
                </option>
                <option value="APPROVED">
                  Liberados
                </option>
                <option value="REJECTED">
                  Recusados
                </option>
                <option value="ALL">Todos</option>
              </select>
            </div>
          </div>

          {message && (
            <div className="mx-4 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11px] text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mx-4 mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
              <AlertCircle
                className="shrink-0"
                size={15}
              />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <LoaderCircle
                  className="mx-auto animate-spin text-teal-600"
                  size={30}
                />
                <p className="mt-3 text-xs text-slate-500">
                  Carregando cadastros...
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center p-6 text-center">
              <div>
                <ShieldCheck
                  className="mx-auto text-slate-300"
                  size={36}
                />
                <h3 className="mt-3 text-sm font-black">
                  Nenhum cadastro nesta fila
                </h3>
                <p className="mt-1 text-[10px] text-slate-500">
                  Novas solicitações aparecerão aqui
                  automaticamente.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 p-4 lg:grid-cols-2">
              {filtered.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  index={index}
                  working={workingId === user.id}
                  onApprove={() =>
                    void act(
                      user.id,
                      user.approvalStatus ===
                        "REJECTED"
                        ? "reactivate"
                        : "approve",
                    )
                  }
                  onReject={() =>
                    void act(user.id, "reject")
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <UsersStyles />
    </main>
  );
}

function UserCard({
  user,
  index,
  working,
  onApprove,
  onReject,
}: {
  user: UserItem;
  index: number;
  working: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article
      className="user-card-enter group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 text-sm font-black text-blue-700 ring-4 ring-slate-50">
          {initials(user.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <strong className="block truncate text-sm font-black">
                {user.name}
              </strong>
              <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                {user.email}
              </span>
            </div>

            <span
              className={`rounded-full border px-2 py-1 text-[8px] font-black ${
                user.approvalStatus === "PENDING"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : user.approvalStatus === "APPROVED"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {statusLabels[user.approvalStatus]}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniInfo
              label="Tipo"
              value={
                user.role === "PATIENT"
                  ? "Paciente"
                  : user.role === "DOCTOR"
                    ? "Médico"
                    : "Administrador"
              }
            />
            <MiniInfo
              label="Cadastro"
              value={formatDate(user.createdAt)}
            />
          </div>

          <div className="mt-3 flex gap-2">
            {user.approvalStatus !== "APPROVED" && (
              <button
                type="button"
                disabled={working}
                onClick={onApprove}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-[10px] font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
              >
                {working ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={13}
                  />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                Liberar acesso
              </button>
            )}

            {user.approvalStatus !== "REJECTED" && (
              <button
                type="button"
                disabled={working}
                onClick={onReject}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                <Ban size={13} />
                Recusar
              </button>
            )}

            {user.approvalStatus === "APPROVED" && (
              <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[10px] font-black text-emerald-700">
                <Check size={13} />
                Conta ativa
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "amber" | "emerald" | "red" | "blue";
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <article className="users-enter rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={16} />
        </span>
        <div>
          <span className="block text-[9px] font-bold text-slate-400">
            {label}
          </span>
          <strong className="text-xl font-black">
            {value}
          </strong>
        </div>
      </div>
    </article>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <span className="block text-[8px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <strong className="mt-0.5 block truncate text-[9.5px] text-slate-700">
        {value}
      </strong>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function UsersStyles() {
  return (
    <style jsx global>{`
      @keyframes usersEnter {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes userCardEnter {
        from {
          opacity: 0;
          transform: translateX(-8px) scale(0.99);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      .users-enter {
        animation: usersEnter 430ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .user-card-enter {
        opacity: 0;
        animation: userCardEnter 360ms ease-out
          forwards;
      }

      @media (prefers-reduced-motion: reduce) {
        .users-enter,
        .user-card-enter {
          animation: none !important;
          opacity: 1 !important;
        }
      }
    `}</style>
  );
}
