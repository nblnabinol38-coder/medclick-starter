"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    try {
      setLoading(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-medclick-context": "patient",
        },
        body: JSON.stringify({
          context: "patient",
        }),
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={loading}
      className={
        compact
          ? "flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
          : "flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-[11px] font-black text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
      }
    >
      {loading ? (
        <LoaderCircle className="animate-spin" size={15} />
      ) : (
        <LogOut size={15} />
      )}
      {!compact && "Sair"}
    </button>
  );
}
