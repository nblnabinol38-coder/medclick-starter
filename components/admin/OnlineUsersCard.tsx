"use client";

import {
  Activity,
  LoaderCircle,
  Radio,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PresenceUser = {
  userId: string;
  name: string;
  email: string;
  path: string;
  online: boolean;
  lastSeenAt: string;
};

type PresenceResponse = {
  success: boolean;
  onlineCount?: number;
  users?: PresenceUser[];
};

function relativeTime(value: string) {
  const seconds = Math.max(
    0,
    Math.round(
      (Date.now() - new Date(value).getTime()) /
        1000,
    ),
  );

  if (seconds < 8) return "agora";
  if (seconds < 60) return `há ${seconds}s`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `há ${minutes} min`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function OnlineUsersCard() {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPresence() {
    try {
      const response = await fetch(
        "/api/admin/presence",
        { cache: "no-store" },
      );

      const data =
        (await response.json()) as PresenceResponse;

      if (
        response.ok &&
        data.success &&
        data.users
      ) {
        setUsers(data.users);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPresence();

    const events =
      new EventSource(
        "/api/realtime/admin",
      );

    const syncPresence = () => {
      void loadPresence();
    };

    events.addEventListener(
      "presence-changed",
      syncPresence,
    );

    const focusHandler = () => {
      void loadPresence();
    };

    window.addEventListener(
      "focus",
      focusHandler,
    );

    return () => {
      events.close();
      window.removeEventListener(
        "focus",
        focusHandler,
      );
    };
  }, []);

  const online = useMemo(
    () => users.filter((user) => user.online),
    [users],
  );

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio
              size={14}
              className="text-emerald-500"
            />
            <strong className="text-[12px] font-black text-slate-900">
              Usuários online
            </strong>
          </div>
          <span className="mt-0.5 block text-[10px] text-slate-400">
            Presença no MedClick
          </span>
        </div>

        <span className="flex min-w-7 items-center justify-center rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">
          {loading ? (
            <LoaderCircle
              className="animate-spin"
              size={12}
            />
          ) : (
            online.length
          )}
        </span>
      </div>

      <div className="max-h-64 space-y-1.5 overflow-y-auto p-2.5">
        {!loading && online.length === 0 ? (
          <div className="py-6 text-center">
            <Activity
              className="mx-auto text-slate-300"
              size={26}
            />
            <p className="mt-2 text-[10px] font-bold text-slate-400">
              Nenhum paciente online agora
            </p>
          </div>
        ) : (
          online.slice(0, 8).map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-2.5 py-2"
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
                <UserRound size={14} />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>

              <div className="min-w-0 flex-1">
                <strong className="block truncate text-[9.5px] text-slate-800">
                  {user.name}
                </strong>
                <span className="block truncate text-[8px] text-slate-400">
                  {user.path}
                </span>
              </div>

              <span className="shrink-0 text-[8px] font-bold text-emerald-600">
                {relativeTime(user.lastSeenAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
