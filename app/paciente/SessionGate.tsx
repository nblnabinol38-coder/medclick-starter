"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

type SessionResponse = {
  success: boolean;
  authenticated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "DOCTOR" | "PATIENT";
  };
};

export default function SessionGate({
  children,
}: {
  children: (
    user: NonNullable<SessionResponse["user"]>,
  ) => React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] =
    useState<SessionResponse["user"]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(
          "/api/auth/session",
          {
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as SessionResponse;

        if (
          !response.ok ||
          !data.authenticated ||
          !data.user
        ) {
          router.replace("/login");
          return;
        }

        setUser(data.user);
      } finally {
        setLoading(false);
      }
    }

    void loadSession();
  }, [router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8fc]">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-teal-600"
            size={32}
          />
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Carregando sua área...
          </p>
        </div>
      </main>
    );
  }

  return <>{children(user)}</>;
}
