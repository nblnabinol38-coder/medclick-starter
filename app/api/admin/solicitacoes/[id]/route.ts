import {
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";
import {
  readAdminSession,
} from "@/lib/server-session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session =
      await readAdminSession();

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

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Somente administradores podem excluir solicitações.",
        },
        { status: 403 },
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

    /*
     * No schema atual, os relacionamentos da ServiceRequest
     * usam onDelete: Cascade para medicamentos, anexos,
     * documentos, documentos gerados, pagamento e histórico.
     */
    await prisma.serviceRequest.delete({
      where: {
        id: serviceRequest.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        `Solicitação ${serviceRequest.protocol} excluída definitivamente.`,
    });
  } catch (error) {
    console.error(
      "Erro ao excluir solicitação:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Não foi possível excluir a solicitação: ${error.message}`
            : "Não foi possível excluir a solicitação.",
      },
      { status: 500 },
    );
  }
}
