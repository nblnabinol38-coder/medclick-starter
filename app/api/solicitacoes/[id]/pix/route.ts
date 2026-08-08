import {
  PaymentStatus,
  RequestStatus,
} from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { readAdminSession } from "@/lib/server-session";

type RouteContext = { params: Promise<{ id: string }> };

type PixBody = {
  pixKey?: string;
  receiverName?: string;
  receiverDocument?: string;
  qrCodePayload?: string;
};

function safePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await readAdminSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Entre novamente no painel administrativo." },
        { status: 401 },
      );
    }

    const actor = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, active: true },
    });

    if (!actor?.active || (actor.role !== "ADMIN" && actor.role !== "DOCTOR")) {
      return NextResponse.json(
        { success: false, message: "Sua conta não possui permissão para enviar PIX." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const identifier = decodeURIComponent(id).trim();
    const body = (await request.json()) as PixBody;

    const pixKey = body.pixKey?.trim() ?? "";
    const receiverName = body.receiverName?.trim() ?? "";
    const receiverDocument = body.receiverDocument?.trim() ?? "";
    const qrCodePayload = body.qrCodePayload?.trim() || pixKey;

    if (!pixKey || !receiverName) {
      return NextResponse.json(
        {
          success: false,
          message: !pixKey ? "Informe a chave PIX." : "Informe o nome do recebedor.",
        },
        { status: 400 },
      );
    }

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { OR: [{ id: identifier }, { protocol: identifier }] },
      select: {
        id: true,
        protocol: true,
        status: true,
        patientConfirmedPreview: true,
        payment: { select: { id: true } },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, message: "Solicitação não encontrada." },
        { status: 404 },
      );
    }

    if (!serviceRequest.patientConfirmedPreview) {
      return NextResponse.json(
        { success: false, message: "O paciente ainda não confirmou a prévia." },
        { status: 409 },
      );
    }

    if (!serviceRequest.payment) {
      return NextResponse.json(
        { success: false, message: "Pagamento não encontrado." },
        { status: 409 },
      );
    }

    const dir = path.join(process.cwd(), "public", "generated", "pix");
    await fs.mkdir(dir, { recursive: true });

    const filename = `${safePart(serviceRequest.protocol)}-pix-${Date.now()}.png`;
    const absolutePath = path.join(dir, filename);

    await QRCode.toFile(absolutePath, qrCodePayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 560,
    });

    const storageKey = `/generated/pix/${filename}`;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: serviceRequest.payment!.id },
        data: {
          status: PaymentStatus.PIX_SENT,
          pixKey,
          receiverName,
          receiverDocument: receiverDocument || null,
          qrCodePayload,
          qrCodeStorageKey: storageKey,
          qrCodeGeneratedAt: now,
          qrCodeSentAt: now,
          rejectionReason: null,
        },
      });

      await tx.serviceRequest.update({
        where: { id: serviceRequest.id },
        data: { status: RequestStatus.PIX_QR_CODE_SENT },
      });

      await tx.statusEvent.create({
        data: {
          requestId: serviceRequest.id,
          status: RequestStatus.PIX_QR_CODE_SENT,
          note: "Dados PIX disponibilizados no Portal do Paciente.",
          changedById: actor.id,
          visibleToPatient: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "PIX disponibilizado ao paciente.",
      payment: {
        pixKey,
        receiverName,
        receiverDocument: receiverDocument || null,
        qrCodePayload,
        qrCodeStorageKey: storageKey,
        qrCodeSentAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao disponibilizar PIX:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Não foi possível disponibilizar o PIX: ${error.message}`
            : "Não foi possível disponibilizar o PIX.",
      },
      { status: 500 },
    );
  }
}
