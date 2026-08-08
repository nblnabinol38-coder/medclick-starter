"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

type PreviewVerification = {
  code: string;
  status: "AGUARDANDO_PAGAMENTO";
};

type AuthenticatedVerification = {
  code: string;
  status: "AUTENTICADO";
  documentNumber: string;
  documentType:
    | "MEDICAL_CERTIFICATE"
    | "PRESCRIPTION"
    | "MEDICAL_REPORT";
  patientName: string;
  patientCpf: string;
  doctorName: string;
  crm: string;
  crmState: string;
  certificateDays: number | null;
  generatedAt: string;
  authenticatedAt: string;
  signedAt: string | null;
};

type VerificationResponse =
  | {
      success: true;
      state: "PREVIEW";
      verification: PreviewVerification;
    }
  | {
      success: true;
      state: "AUTHENTICATED";
      verification: AuthenticatedVerification;
    }
  | {
      success: false;
      message?: string;
    };

const DOCUMENT_LABELS = {
  MEDICAL_CERTIFICATE: "Atestado médico",
  PRESCRIPTION: "Receita médica",
  MEDICAL_REPORT: "Laudo médico",
} as const;

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VerifyDocumentPage() {
  const params = useParams<{ codigo: string }>();
  const code = useMemo(
    () => decodeURIComponent(params.codigo ?? ""),
    [params.codigo],
  );

  const [result, setResult] =
    useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyDocument() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/verificar/${encodeURIComponent(code)}`,
          { cache: "no-store" },
        );

        const data = (await response.json()) as VerificationResponse;
        setResult(data);
      } catch {
        setResult({
          success: false,
          message: "Não foi possível verificar este documento.",
        });
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      void verifyDocument();
    }
  }, [code]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-sky-600"
            size={42}
            aria-hidden="true"
          />
          <p className="mt-4 font-medium text-slate-600">
            Verificando documento...
          </p>
        </div>
      </main>
    );
  }

  if (!result || !result.success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
        <section className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Documento não encontrado
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            {result?.message ??
              "Não foi possível localizar este código de verificação."}
          </p>
        </section>
      </main>
    );
  }

  if (result.state === "PREVIEW") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
        <section className="verification-enter w-full max-w-xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
          <div className="h-2 bg-sky-500" />
          <div className="p-8 text-center sm:p-12">
            <Brand />

            <div className="mx-auto mt-9 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Clock3 className="preview-pulse" size={38} />
            </div>

            <h1 className="mt-7 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              PRÉVIA DO DOCUMENTO
            </h1>

            <p className="mt-7 text-lg font-semibold text-slate-800">
              Este QR Code ainda não está ativo.
            </p>

            <p className="mx-auto mt-5 max-w-md whitespace-pre-line text-base leading-8 text-slate-600">
              {"Após a confirmação do pagamento,\no documento será autenticado\ne este QR passará a validar\na autenticidade do documento."}
            </p>

            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Status
              </span>
              <strong className="mt-2 block text-lg text-amber-900">
                Aguardando pagamento
              </strong>
            </div>
          </div>
        </section>
        <AnimationStyles />
      </main>
    );
  }

  const verification = result.verification;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 sm:py-14">
      <section className="verification-enter mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
        <div className="h-2 bg-emerald-500" />
        <div className="p-7 sm:p-10">
          <div className="text-center">
            <Brand />

            <div className="success-ring mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check
                className="success-check"
                size={48}
                strokeWidth={3}
              />
            </div>

            <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-slate-900">
              DOCUMENTO AUTENTICADO
            </h1>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={17} />
              Autenticado
            </div>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            <DataCard label="Paciente" value={verification.patientName} />
            <DataCard label="CPF" value={verification.patientCpf} />
            <DataCard
              label="Documento"
              value={DOCUMENT_LABELS[verification.documentType]}
            />
            <DataCard label="Número" value={verification.documentNumber} />

            {verification.certificateDays !== null && (
              <DataCard
                label="Dias de afastamento"
                value={`${verification.certificateDays} ${
                  verification.certificateDays === 1 ? "dia" : "dias"
                }`}
              />
            )}

            <DataCard label="Médico" value={verification.doctorName} />
            <DataCard
              label="CRM / UF"
              value={
                verification.crm
                  ? `${verification.crm}/${verification.crmState}`
                  : "—"
              }
            />
            <DataCard
              label="Autenticado em"
              value={formatDate(verification.authenticatedAt)}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-emerald-600"
                size={22}
              />
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Código de autenticação
                </span>
                <strong className="mt-2 block break-all text-lg text-slate-900">
                  {verification.code}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimationStyles />
    </main>
  );
}

function Brand() {
  return (
    <div className="flex justify-center">
      <img
        src="/memed-logo.png"
        alt="Memed"
        className="h-16 w-auto max-w-[240px] object-contain sm:h-20"
      />
    </div>
  );
}

function DataCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <strong className="mt-2 block break-words text-slate-900">
        {value}
      </strong>
    </div>
  );
}

function AnimationStyles() {
  return (
    <style jsx global>{`
      @keyframes verificationEnter {
        from {
          opacity: 0;
          transform: translateY(16px) scale(0.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes previewPulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.08);
          opacity: 0.7;
        }
      }

      @keyframes successRing {
        0% {
          transform: scale(0.72);
          opacity: 0;
        }
        70% {
          transform: scale(1.08);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes successCheck {
        from {
          transform: scale(0.5) rotate(-10deg);
          opacity: 0;
        }
        to {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
      }

      .verification-enter {
        animation: verificationEnter 480ms ease-out both;
      }

      .preview-pulse {
        animation: previewPulse 1.8s ease-in-out infinite;
      }

      .success-ring {
        animation: successRing 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .success-check {
        animation: successCheck 360ms ease-out 180ms both;
      }

      @media (prefers-reduced-motion: reduce) {
        .verification-enter,
        .preview-pulse,
        .success-ring,
        .success-check {
          animation: none !important;
        }
      }
    `}</style>
  );
}