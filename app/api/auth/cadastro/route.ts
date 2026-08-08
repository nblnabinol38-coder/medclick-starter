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
  try {
    const body = (await request.json()) as RegisterBody;

    const name = body.name?.trim() ?? "";
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (name.length < 3) {
      return NextResponse.json(
        {
          success: false,
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
          message: "Informe um e-mail válido.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
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
          message: "As senhas não conferem.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        approvalStatus: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            existing.approvalStatus ===
            AccountApprovalStatus.PENDING
              ? "Este cadastro já está aguardando aprovação."
              : "Já existe uma conta com este e-mail.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

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

    const pendingToken = createPendingApprovalToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Cadastro enviado para aprovação.",
        user,
      },
      { status: 201 },
    );

    response.cookies.set({
      name: PENDING_APPROVAL_COOKIE,
      value: pendingToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível criar sua conta agora.",
      },
      { status: 500 },
    );
  }
}
