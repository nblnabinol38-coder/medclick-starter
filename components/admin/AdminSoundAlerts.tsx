"use client";

import { BellRing, FileText, UserPlus, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type DocumentType = "MEDICAL_CERTIFICATE" | "PRESCRIPTION" | "MEDICAL_REPORT";

type RequestItem = {
  id: string;
  protocol: string;
  documentType: DocumentType;
  createdAt: string;
  patient?: { fullName?: string };
};

type UserItem = {
  id: string;
  name?: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
};

type Notice = {
  id: string;
  title: string;
  text: string;
  kind: "user" | DocumentType;
};

const LABEL: Record<DocumentType, string> = {
  MEDICAL_CERTIFICATE: "Atestado médico",
  PRESCRIPTION: "Receita médica",
  MEDICAL_REPORT: "Laudo médico",
};

function toneFor(kind: Notice["kind"]) {
  if (kind === "user") return [740, 920, 1180];
  if (kind === "MEDICAL_CERTIFICATE") return [520, 700];
  if (kind === "PRESCRIPTION") return [660, 660, 860];
  return [440, 620, 820, 1040];
}

export default function AdminSoundAlerts() {
  const [enabled, setEnabled] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const baselineReadyRef = useRef(false);
  const checkingRef = useRef(false);
  const seenRequestsRef = useRef<Set<string>>(new Set());
  const seenPendingUsersRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("medclick-admin-sounds");
    if (stored === "off") setEnabled(false);
  }, []);

  const unlockAudio = useCallback(async () => {
    try {
      const Ctx = window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioRef.current) audioRef.current = new Ctx();
      if (audioRef.current.state === "suspended") await audioRef.current.resume();
    } catch {
      // O painel continua funcionando mesmo se o navegador bloquear áudio.
    }
  }, []);

  useEffect(() => {
    const unlock = () => void unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [unlockAudio]);

  const play = useCallback(async (kind: Notice["kind"]) => {
    if (!enabled) return;
    await unlockAudio();
    const ctx = audioRef.current;
    if (!ctx || ctx.state !== "running") return;

    const frequencies = toneFor(kind);
    const now = ctx.currentTime;

    frequencies.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + index * 0.115;
      const duration = kind === "MEDICAL_REPORT" ? 0.18 : 0.14;

      oscillator.type = kind === "user" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  }, [enabled, unlockAudio]);

  const showNotice = useCallback((next: Notice) => {
    setNotice(next);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setNotice(null), 7000);
  }, []);

  const check = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      const [requestsResponse, usersResponse] = await Promise.all([
        fetch("/api/solicitacoes", { cache: "no-store" }),
        fetch("/api/admin/usuarios", { cache: "no-store" }),
      ]);

      const requestsData = await requestsResponse.json() as {
        success?: boolean;
        requests?: RequestItem[];
      };
      const usersData = await usersResponse.json() as {
        success?: boolean;
        users?: UserItem[];
      };

      const requests = requestsData.success ? requestsData.requests ?? [] : [];
      const pendingUsers = (usersData.success ? usersData.users ?? [] : [])
        .filter((user) => user.approvalStatus === "PENDING");

      if (!baselineReadyRef.current) {
        seenRequestsRef.current = new Set(requests.map((item) => item.id));
        seenPendingUsersRef.current = new Set(pendingUsers.map((item) => item.id));
        baselineReadyRef.current = true;
        return;
      }

      const newUsers = pendingUsers.filter((user) => !seenPendingUsersRef.current.has(user.id));
      const newRequests = requests
        .filter((item) => !seenRequestsRef.current.has(item.id))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      pendingUsers.forEach((item) => seenPendingUsersRef.current.add(item.id));
      requests.forEach((item) => seenRequestsRef.current.add(item.id));

      if (newUsers.length) {
        const last = newUsers[newUsers.length - 1];
        await play("user");
        showNotice({
          id: `user-${last.id}-${Date.now()}`,
          title: newUsers.length > 1 ? `${newUsers.length} novos cadastros` : "Novo cadastro para liberar",
          text: last.name ? `${last.name} está aguardando liberação de acesso.` : "Há um novo usuário aguardando liberação.",
          kind: "user",
        });
      }

      for (const item of newRequests) {
        await play(item.documentType);
        showNotice({
          id: `request-${item.id}-${Date.now()}`,
          title: `Nova solicitação: ${LABEL[item.documentType]}`,
          text: `${item.protocol}${item.patient?.fullName ? ` • ${item.patient.fullName}` : ""}`,
          kind: item.documentType,
        });
        if (newRequests.length > 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 420));
        }
      }
    } catch {
      // Alertas são complementares e não podem derrubar o painel.
    } finally {
      checkingRef.current = false;
    }
  }, [play, showNotice]);

  useEffect(() => {
    void check();
    const interval = window.setInterval(() => void check(), 4500);

    const events = new EventSource("/api/realtime/admin");
    const sync = () => void check();
    events.addEventListener("requests-changed", sync);

    return () => {
      window.clearInterval(interval);
      events.close();
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [check]);

  function toggleSound() {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem("medclick-admin-sounds", next ? "on" : "off");
    if (next) {
      void unlockAudio().then(() => play("user"));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleSound}
        className="fixed right-3 top-3 z-[110] flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/90 px-3 py-2 text-[10px] font-black text-white shadow-2xl backdrop-blur transition hover:-translate-y-0.5 sm:right-5 sm:top-5"
        title={enabled ? "Desativar alertas sonoros" : "Ativar alertas sonoros"}
      >
        {enabled ? <Volume2 size={15} className="text-emerald-400" /> : <VolumeX size={15} className="text-slate-400" />}
        <span className="hidden sm:inline">Sons {enabled ? "ativos" : "desativados"}</span>
      </button>

      {notice && (
        <div className="admin-alert-enter fixed right-3 top-16 z-[120] w-[330px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[22px] border border-cyan-300/20 bg-[#071b2b]/95 p-4 text-white shadow-[0_24px_80px_rgba(2,132,199,.28)] backdrop-blur-xl sm:right-5 sm:top-20">
          <div className="flex items-start gap-3">
            <span className="admin-alert-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-950/30">
              {notice.kind === "user" ? <UserPlus size={20} /> : <FileText size={20} />}
            </span>
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.15em] text-cyan-300">
                <BellRing size={11} /> MedClick em tempo real
              </span>
              <strong className="mt-1.5 block text-[12px] font-black">{notice.title}</strong>
              <p className="mt-1 text-[10px] leading-4 text-slate-300">{notice.text}</p>
            </div>
            <button type="button" onClick={() => setNotice(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Fechar alerta">
              <X size={14} />
            </button>
          </div>
          <div className="admin-alert-progress mt-3 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />
        </div>
      )}

      <style jsx>{`
        @keyframes alertEnter { from { opacity: 0; transform: translate3d(24px,-8px,0) scale(.96); } to { opacity: 1; transform: translate3d(0,0,0) scale(1); } }
        @keyframes alertPulse { 0%,100% { transform: scale(1); box-shadow: 0 0 0 rgba(34,211,238,0); } 50% { transform: scale(1.06); box-shadow: 0 0 28px rgba(34,211,238,.28); } }
        @keyframes alertProgress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        .admin-alert-enter { animation: alertEnter .32s cubic-bezier(.22,1,.36,1) both; }
        .admin-alert-icon { animation: alertPulse 1.8s ease-in-out infinite; }
        .admin-alert-progress { transform-origin: left; animation: alertProgress 7s linear both; }
        @media (prefers-reduced-motion: reduce) { .admin-alert-enter,.admin-alert-icon,.admin-alert-progress { animation: none !important; } }
      `}</style>
    </>
  );
}
