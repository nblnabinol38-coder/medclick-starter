import {
  PaymentProofStatus,
  PaymentStatus,
  RequestStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readAdminSession } from "@/lib/server-session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
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
      select: { id: true, active: true, role: true },
    });

    if (!actor?.active || (actor.role !== "ADMIN" && actor.role !== "DOCTOR")) {
      return NextResponse.json(
        { success: false, message: "Você não possui permissão para aprovar pagamentos." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const identifier = decodeURIComponent(id).trim();

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { OR: [{ id: identifier }, { protocol: identifier }] },
      select: {
        id: true,
        payment: {
          select: {
            id: true,
            status: true,
            proofs: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    if (!serviceRequest?.payment) {
      return NextResponse.json(
        { success: false, message: "Pagamento não encontrado." },
        { status: 404 },
      );
    }

    if (serviceRequest.payment.status === PaymentStatus.APPROVED) {
      return NextResponse.json({
        success: true,
        message: "O pagamento já está aprovado.",
      });
    }

    const proof = serviceRequest.payment.proofs[0];

    if (!proof || proof.status === PaymentProofStatus.REJECTED) {
      return NextResponse.json(
        {
          success: false,
          message: proof
            ? "O comprovante mais recente está recusado."
            : "O paciente ainda não enviou um comprovante.",
        },
        { status: 409 },
      );
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.paymentProof.update({
        where: { id: proof.id },
        data: {
          status: PaymentProofStatus.APPROVED,
          reviewedById: actor.id,
          reviewedAt: now,
          approvedAt: now,
          rejectionReason: null,
        },
      });

      await tx.payment.update({
        where: { id: serviceRequest.payment!.id },
        data: {
          status: PaymentStatus.APPROVED,
          reviewedById: actor.id,
          reviewedAt: now,
          approvedAt: now,
          rejectionReason: null,
        },
      });

      await tx.serviceRequest.update({
        where: { id: serviceRequest.id },
        data: { status: RequestStatus.PAYMENT_APPROVED },
      });

      await tx.statusEvent.create({
        data: {
          requestId: serviceRequest.id,
          status: RequestStatus.PAYMENT_APPROVED,
          note: "Pagamento confirmado. Documento final entrando em preparação.",
          changedById: actor.id,
          visibleToPatient: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Pagamento aprovado com sucesso.",
      approvedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao aprovar pagamento:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Não foi possível aprovar o pagamento: ${error.message}`
            : "Não foi possível aprovar o pagamento.",
      },
      { status: 500 },
    );
  }
}
