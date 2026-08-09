import { AccountApprovalStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  ADMIN_SESSION_COOKIE,
  createPendingApprovalToken,
  createSessionToken,
  PATIENT_SESSION_COOKIE,
  PENDING_APPROVAL_COOKIE,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let stage = "START";

  try {
    stage = "READ_BODY";

    const body = (await request.json()) as LoginBody;

    const email =
      body.email?.trim().toLowerCase() ?? "";

    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          message: "Informe e-mail e senha.",
        },
        { status: 400 },
      );
    }

    stage = "DATABASE_LOOKUP";

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        active: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          message: "E-mail ou senha inválidos.",
        },
        { status: 401 },
      );
    }

    stage = "VERIFY_PASSWORD";

    const passwordOk = await verifyPassword(
      password,
      user.passwordHash,
    );

    if (!passwordOk) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CREDENTIALS",
          message: "E-mail ou senha inválidos.",
        },
        { status: 401 },
      );
    }

    stage = "CHECK_APPROVAL";

    if (
      user.approvalStatus ===
      AccountApprovalStatus.PENDING
    ) {
      stage = "CREATE_PENDING_TOKEN";

      const pendingToken =
        createPendingApprovalToken({
          userId: user.id,
          email: user.email,
        });

      const pendingResponse =
        NextResponse.json(
          {
            success: false,
            code: "PENDING_APPROVAL",
            message:
              "Seu cadastro ainda está aguardando liberação pelo administrador.",
          },
          { status: 403 },
        );

      pendingResponse.cookies.set({
        name: PENDING_APPROVAL_COOKIE,
        value: pendingToken,
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return pendingResponse;
    }

    if (
      user.approvalStatus ===
      AccountApprovalStatus.REJECTED
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "REJECTED",
          message:
            "Este cadastro não está autorizado para acesso.",
        },
        { status: 403 },
      );
    }

    if (!user.active) {
      return NextResponse.json(
        {
          success: false,
          code: "INACTIVE",
          message:
            "Sua conta está temporariamente desativada.",
        },
        { status: 403 },
      );
    }

    stage = "CREATE_SESSION_TOKEN";

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    stage = "CREATE_RESPONSE";

    const response = NextResponse.json({
      success: true,
      message: "Login realizado com sucesso.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectTo:
        user.role === "ADMIN" ||
        user.role === "DOCTOR"
          ? "/admin"
          : "/paciente",
    });

    const sessionCookieName =
      user.role === "PATIENT"
        ? PATIENT_SESSION_COOKIE
        : ADMIN_SESSION_COOKIE;

    stage = "SET_COOKIE";

    response.cookies.set({
      name: sessionCookieName,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    stage = "SUCCESS";

    return response;
  } catch (error) {
    console.error(
      `Erro no login - etapa ${stage}:`,
      error,
    );

    const detail =
      error instanceof Error
        ? error.message
        : String(error);

    const prismaCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String(
            (error as { code?: unknown }).code ??
              "",
          )
        : "";

    return NextResponse.json(
      {
        success: false,
        code: "SERVER_ERROR",

        // TEMPORÁRIO PARA DIAGNÓSTICO
        stage,
        prismaCode:
          prismaCode || undefined,
        detail,

        message:
          "Erro interno identificado. Veja stage e detail.",
      },
      { status: 500 },
    );
  }
}