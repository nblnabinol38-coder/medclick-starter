"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import AdminSoundAlerts from "@/components/admin/AdminSoundAlerts";

type Props = {
  children: ReactNode;
};

export default function AdminAccessGate({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(pathname !== "/admin/login");
  const [allowed, setAllowed] = useState(pathname === "/admin/login");

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAllowed(true);
      setChecking(false);
      return;
    }

    let active = true;

    async function verify() {
      setChecking(true);

      try {
        const response = await fetch("/api/auth/session?context=admin", {
          cache: "no-store",
        });

        if (!active) return;

        if (!response.ok) {
          setAllowed(false);
          router.replace("/admin/login");
          return;
        }

        setAllowed(true);
      } catch {
        if (!active) return;
        setAllowed(false);
        router.replace("/admin/login");
      } finally {
        if (active) setChecking(false);
      }
    }

    void verify();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06111d] text-white">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
          <LoaderCircle className="animate-spin" size={20} />
          Validando sessão administrativa...
        </div>
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <>
      {pathname !== "/admin/login" ? <AdminSoundAlerts /> : null}
      {children}
    </>
  );
}
