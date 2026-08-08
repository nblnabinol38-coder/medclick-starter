import {
  AccountApprovalStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ActionBody = {
  action?: "approve" | "reject" | "reactivate";
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as ActionBody;

    if (
      body.action !== "approve" &&
      body.action !== "reject" &&
      body.action !== "reactivate"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Ação inválida.",
        },
        { status: 400 },
      );
    }

    const current = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não encontrado.",
        },
        { status: 404 },
      );
    }

    const now = new Date();

    const update =
      body.action === "approve" ||
      body.action === "reactivate"
        ? {
            active: true,
            approvalStatus:
              AccountApprovalStatus.APPROVED,
            approvedAt: now,
            rejectedAt: null,
          }
        : {
            active: false,
            approvalStatus:
              AccountApprovalStatus.REJECTED,
            approvedAt: null,
            rejectedAt: now,
          };

    const user = await prisma.user.update({
      where: { id },
      data: update,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        approvalStatus: true,
        approvedAt: true,
        rejectedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        body.action === "reject"
          ? "Cadastro recusado."
          : "Cadastro liberado com sucesso.",
      user,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar aprovação do usuário:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível atualizar este cadastro.",
      },
      { status: 500 },
    );
  }
}
