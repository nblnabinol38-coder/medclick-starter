import { DocumentFileType, RequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { id } = await context.params;
    const identifier = decodeURIComponent(id).trim();

    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          message: "Identificador da solicitação não informado.",
        },
        { status: 400 },
      );
    }

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        OR: [{ id: identifier }, { protocol: identifier }],
      },
      include: {
        documents: {
          where: {
            type: DocumentFileType.PREVIEW,
            active: true,
          },
          orderBy: [
            { version: "desc" },
            { createdAt: "desc" },
          ],
          take: 1,
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Solicitação não encontrada.",
        },
        { status: 404 },
      );
    }

    const preview = serviceRequest.documents[0];

    if (!preview) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anexe uma prévia antes de disponibilizá-la no Portal do Paciente.",
        },
        { status: 409 },
      );
    }

    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        active: true,
      },
      select: {
        id: true,
      },
    });

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.serviceRequest.update({
        where: {
          id: serviceRequest.id,
        },
        data: {
          status: RequestStatus.PREVIEW_SENT,
        },
      });

      await tx.statusEvent.create({
        data: {
          requestId: serviceRequest.id,
          status: RequestStatus.PREVIEW_SENT,
          note:
            "Prévia disponibilizada no Portal do Paciente para conferência.",
          changedById: admin?.id ?? null,
          visibleToPatient: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        "Prévia disponibilizada no Portal do Paciente.",
      preview: {
        storageKey: preview.storageKey,
        documentNumber: serviceRequest.protocol,
        previewSentAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Erro ao disponibilizar prévia no portal:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível disponibilizar a prévia no portal.",
      },
      { status: 500 },
    );
  }
}
