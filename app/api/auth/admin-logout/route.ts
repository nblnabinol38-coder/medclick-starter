import {
  NextResponse,
} from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
} from "@/lib/session";

export async function POST() {
  const response =
    NextResponse.json({
      success: true,
      message:
        "Sessão administrativa encerrada.",
    });

  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    },
  );

  response.cookies.set(
    LEGACY_SESSION_COOKIE,
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    },
  );

  return response;
}
