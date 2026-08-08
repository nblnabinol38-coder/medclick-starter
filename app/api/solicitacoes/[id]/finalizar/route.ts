import { RequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readAdminSession } from "@/lib/server-session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await readAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entre novamente no painel administrativo.",
        },
        { status: 401 },
      );
    }

    const actor =
      await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          active: true,
          role: true,
        },
      });

    if (
      !actor?.active ||
      (actor.role !== "ADMIN" &&
        actor.role !== "DOCTOR")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sua conta não possui permissão para finalizar solicitações.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const identifier =
      decodeURIComponent(id).trim();

    const serviceRequest =
      await prisma.serviceRequest.findFirst({
        where: {
          OR: [
            { id: identifier },
            { protocol: identifier },
          ],
        },
        select: {
          id: true,
          protocol: true,
          status: true,
          payment: {
            select: {
              status: true,
            },
          },
          documents: {
            where: {
              type: {
                in: ["FINAL", "SIGNED_FINAL"],
              },
              active: true,
            },
            orderBy: {
              version: "desc",
            },
            take: 1,
            select: {
              id: true,
              originalName: true,
              storageKey: true,
            },
          },
        },
      });

    if (!serviceRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Solicitação não encontrada.",
        },
        { status: 404 },
      );
    }

    if (
      serviceRequest.status ===
      RequestStatus.COMPLETED
    ) {
      return NextResponse.json({
        success: true,
        message:
          "Esta solicitação já está finalizada.",
      });
    }

    if (
      serviceRequest.status ===
      RequestStatus.CANCELLED
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Uma solicitação cancelada não pode ser finalizada.",
        },
        { status: 409 },
      );
    }

    if (
      serviceRequest.payment?.status !==
      "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O pagamento precisa estar aprovado.",
        },
        { status: 409 },
      );
    }

    if (
      serviceRequest.documents.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anexe o documento final antes de finalizar.",
        },
        { status: 409 },
      );
    }

    if (
      serviceRequest.status !==
      RequestStatus.FINAL_DOCUMENT_SENT
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Envie o documento final ao paciente antes de finalizar.",
        },
        { status: 409 },
      );
    }

    const now = new Date();

    await prisma.$transaction(
      async (tx) => {
        await tx.serviceRequest.update({
          where: {
            id: serviceRequest.id,
          },
          data: {
            status:
              RequestStatus.COMPLETED,
          },
        });

        await tx.statusEvent.create({
          data: {
            requestId:
              serviceRequest.id,
            status:
              RequestStatus.COMPLETED,
            note:
              "Atendimento finalizado. Documento final entregue ao paciente.",
            changedById: actor.id,
            visibleToPatient: true,
          },
        });
      },
    );

    return NextResponse.json({
      success: true,
      message:
        "Atendimento finalizado com sucesso.",
      completedAt:
        now.toISOString(),
    });
  } catch (error) {
    console.error(
      "Erro ao finalizar solicitação:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Não foi possível finalizar a solicitação: ${error.message}`
            : "Não foi possível finalizar a solicitação.",
      },
      { status: 500 },
    );
  }
}
