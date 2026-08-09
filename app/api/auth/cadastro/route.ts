import {
  AccountApprovalStatus,
  UserRole,
} from "@prisma/client";
import { NextResponse } from "next/server";

import {
  createPendingApprovalToken,
  PENDING_APPROVAL_COOKIE,
} from "@/lib/session";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  let stage = "START";

  try {
    stage = "READ_BODY";

    const body = (await request.json()) as RegisterBody;

    const name = body.name?.trim() ?? "";
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";
    const confirmPassword =
      body.confirmPassword ?? "";

    stage = "VALIDATE_INPUT";

    if (name.length < 3) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_NAME",
          message: "Informe seu nome completo.",
        },
        { status: 400 },
      );
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_EMAIL",
          message: "Informe um e-mail válido.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PASSWORD",
          message:
            "A senha precisa ter pelo menos 8 caracteres.",
        },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          code: "PASSWORD_MISMATCH",
          message: "As senhas não conferem.",
        },
        { status: 400 },
      );
    }

    stage = "CHECK_EXISTING_USER";

    const existing = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        approvalStatus: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          code:
            existing.approvalStatus ===
            AccountApprovalStatus.PENDING
              ? "PENDING_APPROVAL"
              : "EMAIL_ALREADY_EXISTS",
          message:
            existing.approvalStatus ===
            AccountApprovalStatus.PENDING
              ? "Este cadastro já está aguardando aprovação."
              : "Já existe uma conta com este e-mail.",
        },
        { status: 409 },
      );
    }

    stage = "HASH_PASSWORD";

    const passwordHash =
      await hashPassword(password);

    stage = "CREATE_USER";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: UserRole.PATIENT,
        active: false,
        approvalStatus:
          AccountApprovalStatus.PENDING,
        approvedAt: null,
        rejectedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        approvalStatus: true,
        createdAt: true,
      },
    });

    stage = "CREATE_PENDING_TOKEN";

    const pendingToken =
      createPendingApprovalToken({
        userId: user.id,
        email: user.email,
      });

    stage = "CREATE_RESPONSE";

    const response = NextResponse.json(
      {
        success: true,
        message:
          "Cadastro enviado para aprovação.",
        user,
      },
      { status: 201 },
    );

    stage = "SET_PENDING_COOKIE";

    response.cookies.set({
      name: PENDING_APPROVAL_COOKIE,
      value: pendingToken,
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    stage = "SUCCESS";

    return response;
  } catch (error) {
    console.error(
      `Erro ao criar usuário - etapa ${stage}:`,
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