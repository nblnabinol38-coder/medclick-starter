import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  readAdminSession,
  readPatientSession,
} from "@/lib/server-session";

export async function GET(
  request: Request,
) {
  try {
    const url =
      new URL(request.url);

    const context =
      url.searchParams.get(
        "context",
      );

    const session =
      context === "admin"
        ? await readAdminSession()
        : await readPatientSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
        },
        { status: 401 },
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: session.userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          approvalStatus: true,
        },
      });

    if (
      !user ||
      !user.active ||
      user.approvalStatus !==
        "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
        },
        { status: 401 },
      );
    }

    if (
      context === "admin" &&
      user.role !== "ADMIN" &&
      user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
        },
        { status: 403 },
      );
    }

    if (
      context !== "admin" &&
      user.role !== "PATIENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error(
      "Erro ao consultar sessão:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
      },
      { status: 500 },
    );
  }
}
