import {
  DocumentFileType,
  RequestStatus,
} from "@prisma/client";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readAdminSession } from "@/lib/server-session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_FILE_SIZE = 4 * 1024 * 1024;

function safePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    // =====================================================
    // 1. VALIDA SESSÃO ADMINISTRATIVA
    // =====================================================

    const session = await readAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sua sessão administrativa expirou. Entre novamente.",
        },
        {
          status: 401,
        },
      );
    }

    // =====================================================
    // 2. IDENTIFICA A SOLICITAÇÃO
    // =====================================================

    const { id } = await context.params;

    const identifier = decodeURIComponent(id).trim();

    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          message: "Solicitação não informada.",
        },
        {
          status: 400,
        },
      );
    }

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

          documents: {
            where: {
              type: DocumentFileType.PREVIEW,
            },

            select: {
              version: true,
            },

            orderBy: {
              version: "desc",
            },

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
        {
          status: 404,
        },
      );
    }

    // =====================================================
    // 3. LÊ O PDF ENVIADO
    // =====================================================

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Selecione o PDF da prévia.",
        },
        {
          status: 400,
        },
      );
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        {
          success: false,
          message: "A prévia precisa estar em PDF.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "O PDF enviado está vazio.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Nesta etapa, envie uma prévia de até 4 MB.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // 4. DEFINE VERSÃO E NOME DO ARQUIVO
    // =====================================================

    const currentVersion =
      serviceRequest.documents[0]?.version ?? 0;

    const version = currentVersion + 1;

    const safeProtocol = safePart(
      serviceRequest.protocol,
    );

    const filename = `${safeProtocol}-previa-v${version}-${Date.now()}.pdf`;

    const pathname = `medclick/previews/${safeProtocol}/${filename}`;

    // =====================================================
    // 5. ENVIA PDF PARA O VERCEL BLOB
    // =====================================================

    const blob = await put(
      pathname,
      file,
      {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/pdf",
      },
    );

    // =====================================================
    // 6. DESATIVA PRÉVIAS ANTIGAS
    //
    // Sem transaction interativa.
    // Isso evita o erro:
    // "Unable to start a transaction in the given time"
    // =====================================================

    await prisma.documentFile.updateMany({
      where: {
        requestId: serviceRequest.id,
        type: DocumentFileType.PREVIEW,
        active: true,
      },

      data: {
        active: false,
      },
    });

    // =====================================================
    // 7. REGISTRA A NOVA PRÉVIA
    // =====================================================

    const documentFile =
      await prisma.documentFile.create({
        data: {
          requestId: serviceRequest.id,

          uploadedById: session.userId,

          type: DocumentFileType.PREVIEW,

          originalName: file.name,

          storageKey: blob.pathname,

          mimeType: "application/pdf",

          sizeBytes: file.size,

          version,

          active: true,
        },

        select: {
          id: true,
          requestId: true,
          type: true,
          originalName: true,
          storageKey: true,
          mimeType: true,
          sizeBytes: true,
          version: true,
          active: true,
          createdAt: true,
        },
      });

    // =====================================================
    // 8. ATUALIZA STATUS DA SOLICITAÇÃO
    // =====================================================

    await prisma.serviceRequest.update({
      where: {
        id: serviceRequest.id,
      },

      data: {
        status: RequestStatus.PREVIEW_READY,
      },
    });

    // =====================================================
    // 9. REGISTRA NO HISTÓRICO
    // =====================================================

    await prisma.statusEvent.create({
      data: {
        requestId: serviceRequest.id,

        status: RequestStatus.PREVIEW_READY,

        note:
          "Prévia em PDF anexada pelo administrador.",

        visibleToPatient: false,

        changedById: session.userId,
      },
    });

    // =====================================================
    // 10. RETORNO PARA O FRONTEND
    // =====================================================

    return NextResponse.json({
      success: true,

      message:
        "Prévia anexada com sucesso.",

      documentFile: {
        ...documentFile,

        blobPathname:
          blob.pathname,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao anexar prévia manual:",
      error,
    );

    const detail =
      error instanceof Error
        ? error.message
        : "Erro interno desconhecido.";

    return NextResponse.json(
      {
        success: false,

        message:
          `Não foi possível anexar a prévia: ${detail}`,
      },
      {
        status: 500,
      },
    );
  }
}