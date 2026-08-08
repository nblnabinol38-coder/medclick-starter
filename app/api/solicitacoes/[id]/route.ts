import {
  PaymentStatus,
  RequestStatus,
  UserRole,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateRequestBody = {
  status?: RequestStatus;
  assignedDoctorId?: string | null;
  correctionReason?: string | null;
  note?: string | null;
  visibleToPatient?: boolean;
};

function isRequestStatus(value: unknown): value is RequestStatus {
  return (
    typeof value === "string" &&
    Object.values(RequestStatus).includes(value as RequestStatus)
  );
}

async function findRequestIdentifier(identifier: string) {
  return prisma.serviceRequest.findFirst({
    where: {
      OR: [{ id: identifier }, { protocol: identifier }],
    },
    select: {
      id: true,
    },
  });
}

export async function GET(
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
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                active: true,
                createdAt: true,
              },
            },
          },
        },

        assignedDoctor: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
            role: true,
            doctorProfile: {
              select: {
                id: true,
                crm: true,
                crmState: true,
                specialty: true,
                phone: true,
                signatureProvider: true,
                certificateSerial: true,
                certificateIssuer: true,
                certificateValidUntil: true,
                memedDoctorId: true,
                authorizedToSign: true,
                active: true,
              },
            },
          },
        },

        medications: {
          orderBy: {
            position: "asc",
          },
        },

        attachments: {
          orderBy: {
            createdAt: "desc",
          },
        },

        documents: {
          orderBy: [
            { version: "desc" },
            { createdAt: "desc" },
          ],
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },

        generatedDocuments: {
          orderBy: [
            { version: "desc" },
            { createdAt: "desc" },
          ],
          include: {
            generatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            approvedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            signature: {
              include: {
                signedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    doctorProfile: {
                      select: {
                        crm: true,
                        crmState: true,
                        specialty: true,
                        authorizedToSign: true,
                        active: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        payment: {
          include: {
            reviewedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            proofs: {
              orderBy: {
                createdAt: "desc",
              },
              include: {
                reviewedBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        },

        statusHistory: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
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

    return NextResponse.json({
      success: true,
      request: serviceRequest,
    });
  } catch (error) {
    console.error("Erro ao consultar solicitação:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Não foi possível carregar os dados da solicitação.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
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

    const body = (await request.json()) as UpdateRequestBody;

    if (
      body.status !== undefined &&
      !isRequestStatus(body.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "O status informado é inválido.",
        },
        { status: 400 },
      );
    }

    const existingRequest =
      await findRequestIdentifier(identifier);

    if (!existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Solicitação não encontrada.",
        },
        { status: 404 },
      );
    }

    if (body.assignedDoctorId) {
      const doctor = await prisma.user.findFirst({
        where: {
          id: body.assignedDoctorId,
          role: UserRole.DOCTOR,
          active: true,
          doctorProfile: {
            is: {
              active: true,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!doctor) {
        return NextResponse.json(
          {
            success: false,
            message:
              "O médico selecionado não existe ou não está ativo.",
          },
          { status: 400 },
        );
      }
    }

    const updatedRequest = await prisma.$transaction(
      async (transaction) => {
        const currentRequest =
          await transaction.serviceRequest.findUnique({
            where: {
              id: existingRequest.id,
            },
            select: {
              id: true,
              status: true,
              assignedDoctorId: true,
              correctionReason: true,
            },
          });

        if (!currentRequest) {
          throw new Error("REQUEST_NOT_FOUND");
        }

        const nextStatus =
          body.status ?? currentRequest.status;

        const statusChanged =
          nextStatus !== currentRequest.status;

        const cleanNote = body.note?.trim() || null;
        const cleanCorrectionReason =
          body.correctionReason?.trim() || null;

        await transaction.serviceRequest.update({
          where: {
            id: currentRequest.id,
          },
          data: {
            status: nextStatus,

            assignedDoctorId:
              body.assignedDoctorId !== undefined
                ? body.assignedDoctorId
                : currentRequest.assignedDoctorId,

            correctionReason:
              body.correctionReason !== undefined
                ? cleanCorrectionReason
                : currentRequest.correctionReason,

            patientConfirmedPreview:
              nextStatus === RequestStatus.PREVIEW_APPROVED
                ? true
                : nextStatus ===
                    RequestStatus.CORRECTION_REQUESTED
                  ? false
                  : undefined,

            previewConfirmedAt:
              nextStatus === RequestStatus.PREVIEW_APPROVED
                ? new Date()
                : nextStatus ===
                    RequestStatus.CORRECTION_REQUESTED
                  ? null
                  : undefined,

            paymentRequestedAt:
              nextStatus === RequestStatus.PAYMENT_REQUESTED ||
              nextStatus ===
                RequestStatus.PIX_QR_CODE_GENERATED ||
              nextStatus === RequestStatus.PIX_QR_CODE_SENT
                ? new Date()
                : undefined,

            paymentApprovedAt:
              nextStatus === RequestStatus.PAYMENT_APPROVED
                ? new Date()
                : undefined,

            completedAt:
              nextStatus === RequestStatus.COMPLETED
                ? new Date()
                : undefined,

            cancelledAt:
              nextStatus === RequestStatus.CANCELLED
                ? new Date()
                : undefined,
          },
        });

        if (statusChanged || cleanNote) {
          await transaction.statusEvent.create({
            data: {
              requestId: currentRequest.id,
              status: nextStatus,
              note:
                cleanNote ??
                `Status alterado de ${currentRequest.status} para ${nextStatus}.`,
              visibleToPatient:
                body.visibleToPatient ?? true,
            },
          });
        }

        if (
          nextStatus === RequestStatus.PAYMENT_APPROVED
        ) {
          await transaction.payment.updateMany({
            where: {
              requestId: currentRequest.id,
            },
            data: {
              status: PaymentStatus.APPROVED,
              approvedAt: new Date(),
              reviewedAt: new Date(),
              rejectionReason: null,
            },
          });
        }

        if (
          nextStatus === RequestStatus.PAYMENT_REJECTED
        ) {
          await transaction.payment.updateMany({
            where: {
              requestId: currentRequest.id,
            },
            data: {
              status: PaymentStatus.REJECTED,
              reviewedAt: new Date(),
              rejectionReason:
                cleanNote ??
                "Pagamento rejeitado pelo administrador.",
            },
          });
        }

        if (
          nextStatus ===
          RequestStatus.PAYMENT_UNDER_REVIEW
        ) {
          await transaction.payment.updateMany({
            where: {
              requestId: currentRequest.id,
            },
            data: {
              status: PaymentStatus.UNDER_REVIEW,
            },
          });
        }

        if (
          nextStatus === RequestStatus.PIX_QR_CODE_SENT
        ) {
          await transaction.payment.updateMany({
            where: {
              requestId: currentRequest.id,
            },
            data: {
              status: PaymentStatus.PIX_SENT,
              qrCodeSentAt: new Date(),
            },
          });
        }

        if (
          nextStatus === RequestStatus.WAITING_PAYMENT
        ) {
          await transaction.payment.updateMany({
            where: {
              requestId: currentRequest.id,
            },
            data: {
              status: PaymentStatus.WAITING_PAYMENT,
            },
          });
        }

        if (
          nextStatus === RequestStatus.PAYMENT_PROOF_SENT
        ) {
          await transaction.payment.updateMany({
            where: {
              requestId: currentRequest.id,
            },
            data: {
              status: PaymentStatus.PROOF_SENT,
            },
          });
        }

        return transaction.serviceRequest.findUnique({
          where: {
            id: currentRequest.id,
          },
          include: {
            patient: true,

            assignedDoctor: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                doctorProfile: {
                  select: {
                    crm: true,
                    crmState: true,
                    specialty: true,
                    authorizedToSign: true,
                    active: true,
                  },
                },
              },
            },

            medications: {
              orderBy: {
                position: "asc",
              },
            },

            attachments: {
              orderBy: {
                createdAt: "desc",
              },
            },

            payment: {
              include: {
                proofs: {
                  orderBy: {
                    createdAt: "desc",
                  },
                },
              },
            },

            generatedDocuments: {
              orderBy: {
                createdAt: "desc",
              },
              include: {
                signature: true,
              },
            },

            statusHistory: {
              orderBy: {
                createdAt: "asc",
              },
              include: {
                changedBy: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
              },
            },
          },
        });
      },
    );

    return NextResponse.json({
      success: true,
      message: "Solicitação atualizada com sucesso.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Erro ao atualizar solicitação:", error);

    if (
      error instanceof Error &&
      error.message === "REQUEST_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Solicitação não encontrada.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível atualizar a solicitação.",
      },
      { status: 500 },
    );
  }
}