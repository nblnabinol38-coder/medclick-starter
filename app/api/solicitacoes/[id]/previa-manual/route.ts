import {
  DocumentFileType,
  RequestStatus,
} from "@prisma/client";

import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readAdminSession } from "@/lib/server-session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

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
    // SESSÃO ADMINISTRATIVA
    // =====================================================

    const session =
      await readAdminSession();

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
    // SOLICITAÇÃO
    // =====================================================

    const { id } =
      await context.params;

    const identifier =
      decodeURIComponent(id).trim();

    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Solicitação não informada.",
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
              type:
                DocumentFileType.PREVIEW,
            },

            select: {
              id: true,
              version: true,
              active: true,
            },

            orderBy: {
              version: "desc",
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
        {
          status: 404,
        },
      );
    }

    // =====================================================
    // ARQUIVO
    // =====================================================

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selecione o PDF da prévia.",
        },
        {
          status: 400,
        },
      );
    }

    const isPdf =
      file.type ===
        "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A prévia precisa estar em PDF.",
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
          message:
            "O PDF enviado está vazio.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O PDF deve ter no máximo 20 MB.",
        },
        {
          status: 400,
        },
      );
    }

    // =====================================================
    // PREPARA ARQUIVO
    // =====================================================

    const bytes =
      Buffer.from(
        await file.arrayBuffer(),
      );

    const version =
      (serviceRequest
        .documents[0]
        ?.version ?? 0) + 1;

    const filename = `${safePart(
      serviceRequest.protocol,
    )}-previa-v${version}-${Date.now()}.pdf`;

    const relativeDirectory =
      path.join(
        "generated",
        "previews",
      );

    const outputDirectory =
      path.join(
        process.cwd(),
        "public",
        relativeDirectory,
      );

    await fs.mkdir(
      outputDirectory,
      {
        recursive: true,
      },
    );

    const outputPath =
      path.join(
        outputDirectory,
        filename,
      );

    await fs.writeFile(
      outputPath,
      bytes,
    );

    const storageKey =
      `/generated/previews/${filename}`;

    // =====================================================
    // BANCO
    // =====================================================

    const documentFile =
      await prisma.$transaction(
        async (tx) => {
          // Desativa prévias antigas.
          await tx.documentFile.updateMany({
            where: {
              requestId:
                serviceRequest.id,

              type:
                DocumentFileType.PREVIEW,

              active: true,
            },

            data: {
              active: false,
            },
          });

          // Cria nova prévia.
          const created =
            await tx.documentFile.create({
              data: {
                requestId:
                  serviceRequest.id,

                uploadedById:
                  session.userId,

                type:
                  DocumentFileType.PREVIEW,

                originalName:
                  file.name,

                storageKey,

                mimeType:
                  "application/pdf",

                sizeBytes:
                  bytes.length,

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

          // Atualiza o atendimento.
          await tx.serviceRequest.update({
            where: {
              id:
                serviceRequest.id,
            },

            data: {
              status:
                RequestStatus.PREVIEW_READY,
            },
          });

          // Histórico.
          await tx.statusEvent.create({
            data: {
              requestId:
                serviceRequest.id,

              status:
                RequestStatus.PREVIEW_READY,

              note:
                "Prévia em PDF anexada pelo administrador.",

              visibleToPatient:
                false,

              changedById:
                session.userId,
            },
          });

          return created;
        },
      );

    // =====================================================
    // RESPOSTA
    // =====================================================

    return NextResponse.json({
      success: true,

      message:
        "Prévia anexada com sucesso.",

      documentFile,
    });
  } catch (error) {
    console.error(
      "Erro ao anexar prévia manual:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? `Não foi possível anexar a prévia: ${error.message}`
            : "Não foi possível anexar a prévia.",
      },

      {
        status: 500,
      },
    );
  }
}