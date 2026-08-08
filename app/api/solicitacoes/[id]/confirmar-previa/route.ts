import {
  PaymentStatus,
  RequestStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readPatientSession } from "@/lib/server-session";

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
    const session =
      await readPatientSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entre novamente na sua conta para continuar.",
        },
        { status: 401 },
      );
    }

    const { id } =
      await context.params;

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
          requestedByUserId: true,
          patientConfirmedPreview: true,
          patient: {
            select: {
              userId: true,
              email: true,
            },
          },
          documents: {
            where: {
              type: "PREVIEW",
              active: true,
            },
            orderBy: {
              version: "desc",
            },
            take: 1,
            select: {
              id: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
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

    const ownsRequest =
      serviceRequest.requestedByUserId ===
        session.userId ||
      serviceRequest.patient.userId ===
        session.userId ||
      serviceRequest.patient.email.toLowerCase() ===
        session.email.toLowerCase();

    if (!ownsRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Você não pode confirmar esta solicitação.",
        },
        { status: 403 },
      );
    }

    if (
      serviceRequest.status ===
        RequestStatus.CANCELLED ||
      serviceRequest.status ===
        RequestStatus.COMPLETED
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Esta solicitação não pode mais ter a prévia confirmada.",
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
            "A prévia ainda não está disponível.",
        },
        { status: 409 },
      );
    }

    if (
      serviceRequest.patientConfirmedPreview
    ) {
      return NextResponse.json({
        success: true,
        message:
          "A prévia já foi confirmada.",
      });
    }

    const allowedStatuses: RequestStatus[] = [
      RequestStatus.PREVIEW_READY,
      RequestStatus.PREVIEW_SENT,
    ];

    if (
      !allowedStatuses.includes(
        serviceRequest.status,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A prévia ainda não está pronta para confirmação.",
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
            patientConfirmedPreview: true,
            previewConfirmedAt: now,
            status:
              RequestStatus.WAITING_PAYMENT_REQUEST,
          },
        });

        if (
          serviceRequest.payment &&
          serviceRequest.payment.status ===
            PaymentStatus.NOT_STARTED
        ) {
          await tx.payment.update({
            where: {
              id:
                serviceRequest.payment.id,
            },
            data: {
              status:
                PaymentStatus.PIX_REQUESTED,
            },
          });
        }

        await tx.statusEvent.create({
          data: {
            requestId:
              serviceRequest.id,
            status:
              RequestStatus.WAITING_PAYMENT_REQUEST,
            note:
              "Prévia conferida e aprovada pelo paciente. Aguardando envio dos dados PIX.",
            visibleToPatient: true,
          },
        });
      },
    );

    return NextResponse.json({
      success: true,
      message:
        "Prévia confirmada. Agora vamos para a etapa de pagamento.",
      request: {
        id: serviceRequest.id,
        protocol:
          serviceRequest.protocol,
        status:
          RequestStatus.WAITING_PAYMENT_REQUEST,
        patientConfirmedPreview: true,
        previewConfirmedAt:
          now.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Erro ao confirmar prévia:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Não foi possível confirmar a prévia: ${error.message}`
            : "Não foi possível confirmar a prévia.",
      },
      { status: 500 },
    );
  }
}
