import {
  DocumentType,
  RequestStatus,
  UnitType,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readPatientSession } from "@/lib/server-session";

type MedicationInput = {
  name?: string;
  dosage?: string;
  pharmaceuticalForm?: string;
  boxQuantity?: number;
  instructions?: string;
  notes?: string;
};

type CreateRequestBody = {
  fullName?: string;
  cpf?: string;
  birthDate?: string;
  motherName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  documentType?: "ATESTADO" | "RECEITA" | "LAUDO";

  certificatePeriod?: string;
  certificateDays?: number;

  reportPurpose?: string;
  reportDescription?: string;

  medications?: MedicationInput[];

  cid?: string;
  symptoms?: string;
  preferredTime?: string;
  additionalNotes?: string;

  unitType?: "UPA" | "UNIMED";
  providerNetwork?: "UPA" | "UNIMED" | "HAPVIDA";
  unitName?: string;

  priceCents?: number;
};

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function isValidCpf(value: string) {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split("").map(Number);

  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    sum += digits[index] * (10 - index);
  }

  let firstDigit = (sum * 10) % 11;

  if (firstDigit === 10) {
    firstDigit = 0;
  }

  if (firstDigit !== digits[9]) {
    return false;
  }

  sum = 0;

  for (let index = 0; index < 10; index += 1) {
    sum += digits[index] * (11 - index);
  }

  let secondDigit = (sum * 10) % 11;

  if (secondDigit === 10) {
    secondDigit = 0;
  }

  return secondDigit === digits[10];
}

function mapDocumentType(value: CreateRequestBody["documentType"]) {
  switch (value) {
    case "ATESTADO":
      return DocumentType.MEDICAL_CERTIFICATE;

    case "RECEITA":
      return DocumentType.PRESCRIPTION;

    case "LAUDO":
      return DocumentType.MEDICAL_REPORT;

    default:
      return null;
  }
}

function mapUnitType(value: CreateRequestBody["unitType"]) {
  switch (value) {
    case "UPA":
      return UnitType.UPA;

    case "UNIMED":
      return UnitType.UNIMED;

    default:
      return null;
  }
}

function generateProtocol() {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `MC-${year}-${randomPart}`;
}

function getCertificateDays(body: CreateRequestBody) {
  if (
    Number.isInteger(body.certificateDays) &&
    Number(body.certificateDays) >= 1 &&
    Number(body.certificateDays) <= 14
  ) {
    return Number(body.certificateDays);
  }

  const period = body.certificatePeriod?.trim();

  if (!period) {
    return null;
  }

  const match = period.match(/\d+/);

  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 14) {
    return null;
  }

  return parsed;
}

function validateMedications(
  medications: MedicationInput[] | undefined,
) {
  if (!Array.isArray(medications)) {
    return "Informe pelo menos um medicamento para a receita.";
  }

  if (medications.length < 1 || medications.length > 3) {
    return "A receita deve conter de 1 a 3 medicamentos.";
  }

  for (let index = 0; index < medications.length; index += 1) {
    const medication = medications[index];
    const number = index + 1;

    if (!medication.name?.trim()) {
      return `Informe o nome do medicamento ${number}.`;
    }

    if (!medication.dosage?.trim()) {
      return `Informe a dosagem do medicamento ${number}.`;
    }

    if (!medication.pharmaceuticalForm?.trim()) {
      return `Informe a forma farmacêutica do medicamento ${number}.`;
    }

    if (
      !Number.isInteger(medication.boxQuantity) ||
      Number(medication.boxQuantity) < 1
    ) {
      return `Informe uma quantidade de caixas válida para o medicamento ${number}.`;
    }

    if (!medication.instructions?.trim()) {
      return `Informe as orientações de uso do medicamento ${number}.`;
    }
  }

  return null;
}

function validateBody(body: CreateRequestBody) {
  const requiredFields: Array<keyof CreateRequestBody> = [
    "fullName",
    "cpf",
    "birthDate",
    "motherName",
    "documentType",
    "symptoms",
    "unitType",
    "unitName",
    "priceCents",
  ];

  for (const field of requiredFields) {
    const value = body[field];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return `O campo "${field}" é obrigatório.`;
    }
  }

  if (!isValidCpf(body.cpf ?? "")) {
    return "Informe um CPF válido.";
  }

  const needsUnimedPrescriptionContact =
    body.documentType === "RECEITA" &&
    body.providerNetwork === "UNIMED";

  if (needsUnimedPrescriptionContact) {
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Informe um e-mail válido para a Receita Médica Unimed.";
    }

    if (normalizePhone(body.phone ?? "").length < 10) {
      return "Informe um telefone válido para a Receita Médica Unimed.";
    }

    if (!body.address?.trim() || !body.city?.trim() || !body.state?.trim() || !body.postalCode?.trim()) {
      return "Informe endereço residencial, cidade, UF e CEP para a Receita Médica Unimed.";
    }
  }

  if (
    !Number.isInteger(body.priceCents) ||
    Number(body.priceCents) <= 0
  ) {
    return "O valor da solicitação é inválido.";
  }

  if (
    body.providerNetwork === "HAPVIDA" &&
    body.documentType !== "ATESTADO"
  ) {
    return "Na Hapvida, somente Atestado Médico está disponível.";
  }

  if (body.documentType === "ATESTADO") {
    const certificateDays = getCertificateDays(body);

    if (!certificateDays) {
      return "Informe a quantidade de dias do atestado, de 1 a 14 dias.";
    }
  }

  if (body.documentType === "RECEITA") {
    const medicationError = validateMedications(body.medications);

    if (medicationError) {
      return medicationError;
    }
  }

  if (body.documentType === "LAUDO") {
    if (!body.reportPurpose?.trim()) {
      return "Informe a finalidade do laudo.";
    }

    if (!body.reportDescription?.trim()) {
      return "Informe como você deseja que o laudo seja elaborado.";
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const session = await readPatientSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entre na sua conta para criar uma solicitação.",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as CreateRequestBody;
    const validationError = validateBody(body);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        {
          status: 400,
        },
      );
    }

    const documentType = mapDocumentType(body.documentType);
    const unitType =
      body.providerNetwork === "HAPVIDA"
        ? UnitType.UNIMED
        : mapUnitType(body.unitType);

    if (!documentType || !unitType) {
      return NextResponse.json(
        {
          success: false,
          message: "Tipo de documento ou unidade inválida.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      documentType === DocumentType.PRESCRIPTION &&
      unitType !== UnitType.UNIMED
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Receitas médicas estão disponíveis somente para atendimento Unimed.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedCpf = normalizeCpf(body.cpf!);
    const normalizedPhone = normalizePhone(body.phone ?? "");
    const normalizedEmail = body.email?.trim().toLowerCase() ?? "";
    const normalizedAddress = body.address?.trim() ?? "";
    const birthDate = new Date(`${body.birthDate!}T12:00:00`);

    if (Number.isNaN(birthDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "A data de nascimento é inválida.",
        },
        {
          status: 400,
        },
      );
    }

    const certificateDays =
      body.documentType === "ATESTADO"
        ? getCertificateDays(body)
        : null;

    let protocol = generateProtocol();

    while (
      await prisma.serviceRequest.findUnique({
        where: {
          protocol,
        },
        select: {
          id: true,
        },
      })
    ) {
      protocol = generateProtocol();
    }

    const result = await prisma.$transaction(async (transaction) => {
      const patient = await transaction.patient.upsert({
        where: {
          cpf: normalizedCpf,
        },
        update: {
          fullName: body.fullName!.trim(),
          birthDate,
          motherName: body.motherName!.trim(),
          ...(normalizedPhone ? { phone: normalizedPhone } : {}),
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
          ...(normalizedAddress ? { address: normalizedAddress } : {}),
          ...(body.city?.trim() ? { city: normalizeText(body.city) } : {}),
          ...(body.state?.trim() ? { state: normalizeText(body.state)?.toUpperCase() ?? null } : {}),
          ...(body.postalCode?.trim() ? { postalCode: normalizeText(body.postalCode) } : {}),
          active: true,
          ...(normalizedEmail && normalizedEmail ===
          session.email.toLowerCase()
            ? {
                userId: session.userId,
                isPrimary: true,
              }
            : {}),
        },
        create: {
          fullName: body.fullName!.trim(),
          cpf: normalizedCpf,
          birthDate,
          motherName: body.motherName!.trim(),
          phone: normalizedPhone,
          email: normalizedEmail,
          address: normalizedAddress,
          city: normalizeText(body.city),
          state: normalizeText(body.state)?.toUpperCase() ?? null,
          postalCode: normalizeText(body.postalCode),
          active: true,
          ...(normalizedEmail && normalizedEmail ===
          session.email.toLowerCase()
            ? {
                userId: session.userId,
                isPrimary: true,
              }
            : {}),
        },
      });

      const serviceRequest = await transaction.serviceRequest.create({
        data: {
          protocol,
          patientId: patient.id,
          requestedByUserId: session.userId,
          documentType,
          status: RequestStatus.RECEIVED,

          certificatePeriod:
            body.documentType === "ATESTADO"
              ? `${certificateDays} ${
                  certificateDays === 1 ? "dia" : "dias"
                }`
              : null,

          certificateDays:
            body.documentType === "ATESTADO"
              ? certificateDays
              : null,

          reportPurpose:
            body.documentType === "LAUDO"
              ? body.reportPurpose!.trim()
              : null,

          reportDescription:
            body.documentType === "LAUDO"
              ? body.reportDescription!.trim()
              : null,

          cid:
            body.documentType === "RECEITA"
              ? null
              : normalizeText(body.cid),

          symptoms: body.symptoms!.trim(),

          preferredTime:
            normalizeText(body.preferredTime) ?? "",

          additionalNotes:
            body.documentType === "ATESTADO"
              ? null
              : normalizeText(body.additionalNotes),

          unitType,
          unitName:
            body.providerNetwork === "HAPVIDA"
              ? (
                  body.unitName!.trim().toLowerCase().startsWith("hapvida")
                    ? body.unitName!.trim()
                    : `Hapvida · ${body.unitName!.trim()}`
                )
              : body.unitName!.trim(),
          priceCents: Number(body.priceCents),

          medications:
            body.documentType === "RECEITA"
              ? {
                  create: body.medications!.map(
                    (medication, index) => ({
                      position: index + 1,
                      name: medication.name!.trim(),
                      dosage: medication.dosage!.trim(),
                      pharmaceuticalForm:
                        medication.pharmaceuticalForm!.trim(),
                      boxQuantity: Number(
                        medication.boxQuantity,
                      ),
                      instructions:
                        medication.instructions!.trim(),
                      notes: normalizeText(medication.notes),
                    }),
                  ),
                }
              : undefined,

          payment: {
            create: {
              amountCents: Number(body.priceCents),
            },
          },

          statusHistory: {
            create: {
              status: RequestStatus.RECEIVED,
              note: "Solicitação enviada pelo paciente.",
              visibleToPatient: true,
            },
          },
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

          medications: {
            orderBy: {
              position: "asc",
            },
          },

          payment: {
            select: {
              id: true,
              status: true,
              amountCents: true,
            },
          },

          statusHistory: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return serviceRequest;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Solicitação registrada com sucesso.",
        request: result,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Erro ao registrar solicitação:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível registrar a solicitação. Tente novamente.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  try {
    const requests = await prisma.serviceRequest.findMany({
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

        medications: {
          orderBy: {
            position: "asc",
          },
        },

        payment: {
          select: {
            id: true,
            status: true,
            amountCents: true,
            qrCodeSentAt: true,
            approvedAt: true,
          },
        },

        _count: {
          select: {
            attachments: true,
            generatedDocuments: true,
            statusHistory: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Erro ao consultar solicitações:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível consultar as solicitações.",
      },
      {
        status: 500,
      },
    );
  }
}
