"use client";

import {
  LoaderCircle,
  LogOut,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] =
    useState(false);

  async function logout() {
    try {
      setLoading(true);

      await fetch(
        "/api/auth/admin-logout",
        {
          method: "POST",
        },
      );
    } finally {
      router.replace(
        "/admin/login",
      );
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={loading}
      className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-500/8 px-3 py-2.5 text-[10px] font-black text-red-300 transition hover:border-red-400/30 hover:bg-red-500/15 hover:text-red-200 disabled:opacity-60"
    >
      {loading ? (
        <LoaderCircle
          size={14}
          className="animate-spin"
        />
      ) : (
        <LogOut
          size={14}
          className="transition group-hover:-translate-x-0.5"
        />
      )}

      {loading
        ? "Saindo..."
        : "Deslogar da conta"}
    </button>
  );
}
