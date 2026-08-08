import {
  PaymentProofStatus,
  PaymentStatus,
  RequestStatus,
} from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readPatientSession } from "@/lib/server-session";

type RouteContext = { params: Promise<{ id: string }> };
const MAX_PROOF_BYTES = 12 * 1024 * 1024;

function safePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function ext(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return ".pdf";
  if (name.endsWith(".png") || file.type === "image/png") return ".png";
  return ".jpg";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await readPatientSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Entre novamente na sua conta para continuar." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const identifier = decodeURIComponent(id).trim();
    const formData = await request.formData();
    const file = formData.get("file");
    const patientNote = String(formData.get("patientNote") ?? "").trim().slice(0, 500);

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Selecione o comprovante de pagamento." },
        { status: 400 },
      );
    }

    const valid =
      file.type === "application/pdf" ||
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      /\.(pdf|png|jpe?g)$/i.test(file.name);

    if (!valid || file.size <= 0 || file.size > MAX_PROOF_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: !valid
            ? "Envie o comprovante em PDF, PNG, JPG ou JPEG."
            : "O comprovante deve ter no máximo 12 MB.",
        },
        { status: 400 },
      );
    }

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { OR: [{ id: identifier }, { protocol: identifier }] },
      select: {
        id: true,
        protocol: true,
        requestedByUserId: true,
        patient: { select: { userId: true, email: true } },
        payment: {
          select: { id: true, status: true, amountCents: true },
        },
      },
    });

    if (!serviceRequest || !serviceRequest.payment) {
      return NextResponse.json(
        { success: false, message: "Pagamento não encontrado." },
        { status: 404 },
      );
    }

    const owns =
      serviceRequest.requestedByUserId === session.userId ||
      serviceRequest.patient.userId === session.userId ||
      serviceRequest.patient.email.toLowerCase() === session.email.toLowerCase();

    if (!owns) {
      return NextResponse.json(
        { success: false, message: "Você não pode enviar comprovante para esta solicitação." },
        { status: 403 },
      );
    }

    const allowedPaymentStatuses: PaymentStatus[] = [
      PaymentStatus.PIX_SENT,
      PaymentStatus.WAITING_PAYMENT,
      PaymentStatus.REJECTED,
    ];

    if (!allowedPaymentStatuses.includes(serviceRequest.payment.status)) {
      return NextResponse.json(
        { success: false, message: "O comprovante ainda não pode ser enviado nesta etapa." },
        { status: 409 },
      );
    }

    const dir = path.join(process.cwd(), "public", "generated", "payment-proofs");
    await fs.mkdir(dir, { recursive: true });

    const filename = `${safePart(serviceRequest.protocol)}-comprovante-${Date.now()}${ext(file)}`;
    const storageKey = `/generated/payment-proofs/${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, filename), bytes);

    const now = new Date();

    const proof = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentProof.create({
        data: {
          paymentId: serviceRequest.payment!.id,
          status: PaymentProofStatus.SENT,
          originalName: file.name,
          storageKey,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: bytes.length,
          paidAmountCents: serviceRequest.payment!.amountCents,
          patientNote: patientNote || null,
        },
      });

      await tx.payment.update({
        where: { id: serviceRequest.payment!.id },
        data: {
          status: PaymentStatus.PROOF_SENT,
          rejectionReason: null,
        },
      });

      await tx.serviceRequest.update({
        where: { id: serviceRequest.id },
        data: { status: RequestStatus.PAYMENT_PROOF_SENT },
      });

      await tx.statusEvent.create({
        data: {
          requestId: serviceRequest.id,
          status: RequestStatus.PAYMENT_PROOF_SENT,
          note: "Comprovante enviado pelo paciente. Aguardando conferência administrativa.",
          visibleToPatient: true,
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: "Comprovante enviado. Aguardando conferência do pagamento.",
      proof,
    });
  } catch (error) {
    console.error("Erro ao enviar comprovante:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Não foi possível enviar o comprovante: ${error.message}`
            : "Não foi possível enviar o comprovante.",
      },
      { status: 500 },
    );
  }
}
