import { RequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readAdminSession } from "@/lib/server-session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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
        where: {
          id: session.userId,
        },
        select: {
          id: true,
          role: true,
          active: true,
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
            "Sua conta não possui permissão para enviar o documento final.",
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
            {
              id: identifier,
            },
            {
              protocol: identifier,
            },
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
              type: "FINAL",
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
              version: true,
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
      RequestStatus.CANCELLED
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Uma solicitação cancelada não pode receber documento final.",
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
            "Confirme o pagamento antes de enviar o documento final.",
        },
        { status: 409 },
      );
    }

    const finalDocument =
      serviceRequest.documents[0];

    if (!finalDocument) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anexe o documento final antes de enviá-lo ao paciente.",
        },
        { status: 409 },
      );
    }

    if (
      serviceRequest.status ===
        RequestStatus.FINAL_DOCUMENT_SENT ||
      serviceRequest.status ===
        RequestStatus.COMPLETED
    ) {
      return NextResponse.json({
        success: true,
        message:
          "O documento final já foi enviado ao paciente.",
        document: finalDocument,
      });
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
              RequestStatus.FINAL_DOCUMENT_SENT,
          },
        });

        await tx.statusEvent.create({
          data: {
            requestId:
              serviceRequest.id,
            status:
              RequestStatus.FINAL_DOCUMENT_SENT,
            note:
              `Documento final "${finalDocument.originalName}" disponibilizado ao paciente.`,
            changedById: actor.id,
            visibleToPatient: true,
          },
        });
      },
    );

    return NextResponse.json({
      success: true,
      message:
        "Documento final enviado ao paciente com sucesso.",
      sentAt: now.toISOString(),
      document: finalDocument,
    });
  } catch (error) {
    console.error(
      "Erro ao enviar documento final:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Não foi possível enviar o documento final: ${error.message}`
            : "Não foi possível enviar o documento final.",
      },
      { status: 500 },
    );
  }
}
