import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readPatientSession } from "@/lib/server-session";

export async function GET() {
  try {
    const session =
      await readPatientSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entre na sua conta para continuar.",
        },
        { status: 401 },
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: session.userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          active: true,
          patientProfiles: {
            where: {
              active: true,
            },
            orderBy: [
              {
                isPrimary: "desc",
              },
              {
                createdAt: "asc",
              },
            ],
            take: 1,
            select: {
              id: true,
              fullName: true,
              cpf: true,
              birthDate: true,
              motherName: true,
              phone: true,
              email: true,
              address: true,
              city: true,
              state: true,
              postalCode: true,
              active: true,
              isPrimary: true,
              userId: true,
            },
          },
        },
      });

    if (!user || !user.active) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sua conta não está disponível.",
        },
        { status: 401 },
      );
    }

    let patient =
      user.patientProfiles[0] ?? null;

    /*
     * Compatibilidade com cadastros antigos:
     * tenta localizar o titular pelo mesmo e-mail.
     */
    if (!patient) {
      const patientByEmail =
        await prisma.patient.findFirst({
          where: {
            email: {
              equals: user.email,
            },
            active: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            fullName: true,
            cpf: true,
            birthDate: true,
            motherName: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
            active: true,
            isPrimary: true,
            userId: true,
          },
        });

      if (
        patientByEmail &&
        !patientByEmail.userId
      ) {
        patient =
          await prisma.patient.update({
            where: {
              id:
                patientByEmail.id,
            },
            data: {
              userId: user.id,
              isPrimary: true,
            },
            select: {
              id: true,
              fullName: true,
              cpf: true,
              birthDate: true,
              motherName: true,
              phone: true,
              email: true,
              address: true,
              city: true,
              state: true,
              postalCode: true,
              active: true,
              isPrimary: true,
              userId: true,
            },
          });
      } else if (
        patientByEmail?.userId ===
        user.id
      ) {
        patient = patientByEmail;
      }
    }

    /*
     * NOVO:
     * a solicitação pertence à CONTA que a criou.
     * Portanto ela aparece mesmo quando o atendimento
     * foi preenchido com dados de outra pessoa.
     *
     * O segundo OR mantém compatibilidade com solicitações
     * antigas que foram vinculadas apenas pelo Patient.userId.
     */
    const latestRequest =
      await prisma.serviceRequest.findFirst({
        where: {
          OR: [
            {
              requestedByUserId:
                user.id,
            },
            {
              patient: {
                userId: user.id,
              },
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              cpf: true,
              phone: true,
              email: true,
            },
          },

          documents: {
            where: {
              active: true,
            },
            orderBy: {
              version: "desc",
            },
            select: {
              id: true,
              type: true,
              originalName: true,
              storageKey: true,
              version: true,
              createdAt: true,
            },
          },

          payment: {
            select: {
              id: true,
              status: true,
              amountCents: true,
              pixKey: true,
              receiverName: true,
              receiverDocument: true,
              qrCodePayload: true,
              qrCodeStorageKey: true,
              qrCodeSentAt: true,
              rejectionReason: true,
              reviewedAt: true,
              approvedAt: true,
              proofs: {
                orderBy: { createdAt: "desc" },
                take: 3,
                select: {
                  id: true,
                  status: true,
                  originalName: true,
                  storageKey: true,
                  mimeType: true,
                  sizeBytes: true,
                  patientNote: true,
                  rejectionReason: true,
                  reviewedAt: true,
                  approvedAt: true,
                  createdAt: true,
                },
              },
            },
          },

          statusHistory: {
            where: {
              visibleToPatient:
                true,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              status: true,
              note: true,
              createdAt: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },

      patient,

      request: latestRequest,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar área do paciente:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Não foi possível carregar sua solicitação: ${error.message}`
            : "Não foi possível carregar sua solicitação.",
      },
      { status: 500 },
    );
  }
}
