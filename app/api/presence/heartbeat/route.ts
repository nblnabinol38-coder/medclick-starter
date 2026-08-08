import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  PATIENT_SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/session";
import { touchPresence } from "@/lib/presence";

type HeartbeatBody = {
  path?: string;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(
      PATIENT_SESSION_COOKIE,
    )?.value;
    const session = verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sessão inválida." },
        { status: 401 },
      );
    }

    const body = (await request
      .json()
      .catch(() => ({}))) as HeartbeatBody;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { success: false, message: "Usuário indisponível." },
        { status: 401 },
      );
    }

    const presence = touchPresence({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      path:
        typeof body.path === "string"
          ? body.path.slice(0, 180)
          : "/",
    });

    return NextResponse.json({
      success: true,
      lastSeenAt: new Date(
        presence.lastSeenAt,
      ).toISOString(),
    });
  } catch (error) {
    console.error("Erro no heartbeat:", error);

    return NextResponse.json(
      { success: false, message: "Heartbeat indisponível." },
      { status: 500 },
    );
  }
}
