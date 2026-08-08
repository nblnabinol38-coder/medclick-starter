import { DocumentFileType, RequestStatus } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
const MAX_PDF_BYTES = 20 * 1024 * 1024;

function safePart(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const identifier = decodeURIComponent(id).trim();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Selecione o PDF do documento final." }, { status: 400 });
    }
    if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      return NextResponse.json({ success: false, message: "O documento final precisa estar em PDF." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ success: false, message: "O PDF deve ter entre 1 byte e 20 MB." }, { status: 400 });
    }

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { OR: [{ id: identifier }, { protocol: identifier }] },
      include: {
        payment: { select: { status: true } },
        generatedDocuments: {
          orderBy: [{ version: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: { id: true },
        },
      },
    });
    if (!serviceRequest) {
      return NextResponse.json({ success: false, message: "Solicitação não encontrada." }, { status: 404 });
    }

    const paymentApproved = serviceRequest.payment?.status === "APPROVED" || [
      "PAYMENT_APPROVED", "FINAL_DOCUMENT_IN_PREPARATION", "FINAL_DOCUMENT_SIGNED",
      "FINAL_DOCUMENT_AUTHENTICATED", "FINAL_DOCUMENT_AVAILABLE", "FINAL_DOCUMENT_SENT", "COMPLETED",
    ].includes(serviceRequest.status);

    if (!paymentApproved) {
      return NextResponse.json({ success: false, message: "Aprovação do pagamento é necessária antes do documento final." }, { status: 409 });
    }

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN", active: true }, select: { id: true } });
    if (!admin) {
      return NextResponse.json({ success: false, message: "Nenhum administrador ativo encontrado." }, { status: 409 });
    }

    const previous = await prisma.documentFile.findFirst({
      where: { requestId: serviceRequest.id, type: DocumentFileType.FINAL },
      orderBy: { version: "desc" }, select: { version: true },
    });
    const version = (previous?.version ?? 0) + 1;
    const filename = `${safePart(serviceRequest.protocol)}-final-v${version}.pdf`;
    const outputDirectory = path.join(process.cwd(), "public", "generated", "final");
    await fs.mkdir(outputDirectory, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(outputDirectory, filename), bytes);
    const storageKey = `/generated/final/${filename}`;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      await tx.documentFile.updateMany({
        where: { requestId: serviceRequest.id, type: DocumentFileType.FINAL, active: true },
        data: { active: false },
      });
      const documentFile = await tx.documentFile.create({
        data: {
          requestId: serviceRequest.id, uploadedById: admin.id, type: DocumentFileType.FINAL,
          originalName: file.name, storageKey, mimeType: "application/pdf", sizeBytes: bytes.length,
          version, active: true,
        },
      });

      const generated = serviceRequest.generatedDocuments[0];
      if (generated) {
        await tx.generatedDocument.update({
          where: { id: generated.id },
          data: { finalStorageKey: storageKey, finalMimeType: "application/pdf", finalSizeBytes: bytes.length, finalGeneratedAt: now },
        });
      }

      await tx.serviceRequest.update({ where: { id: serviceRequest.id }, data: { status: RequestStatus.FINAL_DOCUMENT_AVAILABLE } });
      await tx.statusEvent.create({
        data: { requestId: serviceRequest.id, status: RequestStatus.FINAL_DOCUMENT_AVAILABLE, note: `Documento final anexado manualmente — versão ${version}.`, changedById: admin.id, visibleToPatient: false },
      });
      return documentFile;
    });

    return NextResponse.json({ success: true, message: "Documento final anexado com sucesso.", documentFile: result });
  } catch (error) {
    console.error("Erro ao anexar documento final:", error);
    return NextResponse.json({ success: false, message: "Não foi possível anexar o documento final." }, { status: 500 });
  }
}
