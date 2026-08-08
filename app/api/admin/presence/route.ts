import { NextResponse } from "next/server";

import {
  ONLINE_WINDOW_MS,
  isOnline,
  listPresence,
} from "@/lib/presence";
import { readAdminSession } from "@/lib/server-session";

export async function GET() {
  const session = await readAdminSession();

  if (
    !session ||
    (session.role !== "ADMIN" &&
      session.role !== "DOCTOR")
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Acesso administrativo necessário.",
      },
      { status: 403 },
    );
  }

  const users = listPresence()
    .filter((entry) => entry.role === "PATIENT")
    .map((entry) => ({
      userId: entry.userId,
      name: entry.name,
      email: entry.email,
      path: entry.path,
      online: isOnline(entry),
      lastSeenAt: new Date(
        entry.lastSeenAt,
      ).toISOString(),
    }));

  return NextResponse.json({
    success: true,
    onlineWindowMs: ONLINE_WINDOW_MS,
    onlineCount: users.filter((user) => user.online)
      .length,
    users,
  });
}
