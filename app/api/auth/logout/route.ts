import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
  PATIENT_SESSION_COOKIE,
  PENDING_APPROVAL_COOKIE,
} from "@/lib/session";

type LogoutBody = {
  context?: "patient" | "admin" | "all";
};

function clearCookie(
  response: NextResponse,
  name: string,
) {
  response.cookies.set({
    name,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV ===
      "production",
    path: "/",
    maxAge: 0,
  });
}

export async function POST(
  request: Request,
) {
  let body: LogoutBody = {};

  try {
    body =
      (await request.json()) as LogoutBody;
  } catch {
    body = {};
  }

  const headerContext =
    request.headers.get(
      "x-medclick-context",
    );

  const context =
    body.context ??
    (headerContext === "admin"
      ? "admin"
      : headerContext === "patient"
        ? "patient"
        : "all");

  const response =
    NextResponse.json({
      success: true,
      message: "Sessão encerrada.",
      context,
    });

  if (
    context === "patient" ||
    context === "all"
  ) {
    clearCookie(
      response,
      PATIENT_SESSION_COOKIE,
    );

    clearCookie(
      response,
      PENDING_APPROVAL_COOKIE,
    );
  }

  if (
    context === "admin" ||
    context === "all"
  ) {
    clearCookie(
      response,
      ADMIN_SESSION_COOKIE,
    );
  }

  /*
   * Remove também o cookie antigo,
   * se ainda existir no navegador.
   */
  clearCookie(
    response,
    LEGACY_SESSION_COOKIE,
  );

  return response;
}
