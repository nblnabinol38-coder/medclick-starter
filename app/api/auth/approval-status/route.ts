import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  PATIENT_SESSION_COOKIE,
  PENDING_APPROVAL_COOKIE,
  verifyPendingApprovalToken,
} from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const pendingToken = cookieStore.get(
      PENDING_APPROVAL_COOKIE,
    )?.value;

    const pending =
      verifyPendingApprovalToken(pendingToken);

    if (!pending) {
      return NextResponse.json(
        {
          success: false,
          status: "NO_PENDING_SESSION",
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: pending.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        approvalStatus: true,
      },
    });

    if (!user || user.email !== pending.email) {
      return NextResponse.json(
        {
          success: false,
          status: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (user.approvalStatus === "REJECTED") {
      const response = NextResponse.json({
        success: true,
        status: "REJECTED",
      });

      response.cookies.set({
        name: PENDING_APPROVAL_COOKIE,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    if (
      user.approvalStatus !== "APPROVED" ||
      !user.active
    ) {
      return NextResponse.json({
        success: true,
        status: "PENDING",
      });
    }

    const sessionToken = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      status: "APPROVED",
      redirectTo:
        user.role === "PATIENT"
          ? "/paciente"
          : "/admin",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: PATIENT_SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set({
      name: PENDING_APPROVAL_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error(
      "Erro ao verificar liberação de acesso:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        status: "ERROR",
        message:
          "Não foi possível verificar a liberação agora.",
      },
      { status: 500 },
    );
  }
}
