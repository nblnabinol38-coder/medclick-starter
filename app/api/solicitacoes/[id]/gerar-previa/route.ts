import {
  GeneratedDocumentStatus,
  RequestStatus,
  VerificationStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { generatePreviewPdf } from "@/lib/generate-preview-pdf";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function generateToken(prefix: string) {
  const year = new Date().getFullYear();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

async function uniqueDocumentNumber() {
  let value = generateToken("MCD");
  while (await prisma.generatedDocument.findUnique({ where: { documentNumber: value }, select: { id: true } })) {
    value = generateToken("MCD");
  }
  return value;
}

async function uniqueVerificationCode() {
  let value = generateToken("MCV");
  while (await prisma.generatedDocument.findUnique({ where: { verificationCode: value }, select: { id: true } })) {
    value = generateToken("MCV");
  }
  return value;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const identifier = decodeURIComponent(id).trim();

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        OR: [{ id: identifier }, { protocol: identifier }],
      },
      include: {
        patient: true,
        assignedDoctor: {
          select: {
            id: true,
            name: true,
            active: true,
            doctorProfile: {
              select: {
                crm: true,
                crmState: true,
                active: true,
              },
            },
          },
        },
        medications: {
          orderBy: { position: "asc" },
        },
        generatedDocuments: {
          select: { version: true },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ success: false, message: "Solicitação não encontrada." }, { status: 404 });
    }

    if (!serviceRequest.assignedDoctorId || !serviceRequest.assignedDoctor?.active) {
      return NextResponse.json(
        { success: false, message: "Atribua um médico ativo antes de gerar a prévia." },
        { status: 400 },
      );
    }

    if (serviceRequest.documentType === "PRESCRIPTION" && serviceRequest.unitType !== "UNIMED") {
      return NextResponse.json(
        { success: false, message: "Receita médica utiliza o modelo Unimed." },
        { status: 400 },
      );
    }

    const documentNumber = await uniqueDocumentNumber();
    const verificationCode = await uniqueVerificationCode();
    const version = (serviceRequest.generatedDocuments[0]?.version ?? 0) + 1;

    const origin = new URL(request.url).origin;
    const verificationUrl = `${origin}/verificar/${encodeURIComponent(verificationCode)}`;
    const verificationQrCode = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 420,
    });

    const now = new Date();

    const preview = await generatePreviewPdf({
      documentNumber,
      verificationCode,
      verificationQrCode,
      documentType: serviceRequest.documentType,
      unitType: serviceRequest.unitType,
      unitName: serviceRequest.unitName,
      patientName: serviceRequest.patient.fullName,
      patientCpf: serviceRequest.patient.cpf,
      patientBirthDate: serviceRequest.patient.birthDate,
      patientMotherName: serviceRequest.patient.motherName,
      patientAddress: serviceRequest.patient.address,
      patientCity: serviceRequest.patient.city,
      patientState: serviceRequest.patient.state,
      patientPostalCode: serviceRequest.patient.postalCode,
      cid: serviceRequest.cid,
      certificateDays: serviceRequest.certificateDays,
      reportPurpose: serviceRequest.reportPurpose,
      reportDescription: serviceRequest.reportDescription,
      symptoms: serviceRequest.symptoms,
      medications: serviceRequest.medications,
      doctorName: serviceRequest.assignedDoctor.name,
      doctorCrm: serviceRequest.assignedDoctor.doctorProfile?.crm,
      doctorCrmState: serviceRequest.assignedDoctor.doctorProfile?.crmState,
      createdAt: now,
    });

    const generatedDocument = await prisma.$transaction(async (transaction) => {
      const document = await transaction.generatedDocument.create({
        data: {
          requestId: serviceRequest.id,
          documentType: serviceRequest.documentType,
          template: serviceRequest.unitType,
          status: GeneratedDocumentStatus.PREVIEW_READY,
          documentNumber,
          version,
          generatedById: serviceRequest.assignedDoctorId!,
          previewStorageKey: preview.relativePath,
          previewMimeType: preview.mimeType,
          previewGeneratedAt: now,
          previewWatermark: "PRÉVIA — SEM VALIDADE",
          previewDownloadAllowed: false,
          previewPrintAllowed: false,
          previewHasValidQrCode: false,
          verificationCode,
          verificationUrl,
          verificationQrCode,
          verificationStatus: VerificationStatus.INACTIVE,
          authenticationActive: false,
        },
      });

      await transaction.serviceRequest.update({
        where: { id: serviceRequest.id },
        data: { status: RequestStatus.PREVIEW_READY },
      });

      await transaction.statusEvent.create({
        data: {
          requestId: serviceRequest.id,
          status: RequestStatus.PREVIEW_READY,
          note: `Prévia ${version} gerada a partir do PDF original do modelo.`,
          visibleToPatient: false,
        },
      });

      return document;
    });

    return NextResponse.json(
      { success: true, message: "Prévia completa gerada com sucesso.", document: generatedDocument },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao gerar prévia completa:", error);
    return NextResponse.json(
      { success: false, message: "Não foi possível gerar a prévia completa." },
      { status: 500 },
    );
  }
}
