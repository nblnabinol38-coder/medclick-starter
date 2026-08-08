import { createHmac, timingSafeEqual } from "node:crypto";

export const PATIENT_SESSION_COOKIE =
  "medclick_patient_session";

export const ADMIN_SESSION_COOKIE =
  "medclick_admin_session";

export const PENDING_APPROVAL_COOKIE =
  "medclick_pending_approval";

/*
 * Compatibilidade temporária:
 * não usamos mais este cookie para novos logins.
 */
export const LEGACY_SESSION_COOKIE =
  "medclick_session";

export type UserRole =
  | "ADMIN"
  | "DOCTOR"
  | "PATIENT";

export type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
};

export type PendingApprovalPayload = {
  userId: string;
  email: string;
  purpose: "approval";
  exp: number;
};

function secret() {
  const value =
    process.env.SESSION_SECRET?.trim();

  if (value && value.length >= 32) {
    return value;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "SESSION_SECRET ausente ou curta. Usando chave local temporária apenas em desenvolvimento.",
    );

    return "medclick-local-development-session-secret-2026";
  }

  throw new Error(
    "SESSION_SECRET precisa existir em produção e ter pelo menos 32 caracteres.",
  );
}

function encode(input: string) {
  return Buffer.from(input).toString(
    "base64url",
  );
}

function decode(input: string) {
  return Buffer.from(
    input,
    "base64url",
  ).toString("utf8");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", secret())
    .update(encodedPayload)
    .digest("base64url");
}

function createSignedToken<T extends object>(
  payload: T,
  maxAgeSeconds: number,
) {
  const complete = {
    ...payload,
    exp:
      Math.floor(Date.now() / 1000) +
      maxAgeSeconds,
  };

  const encodedPayload = encode(
    JSON.stringify(complete),
  );

  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySignedToken<
  T extends { exp: number },
>(
  token: string | undefined | null,
): T | null {
  if (!token) return null;

  const [
    encodedPayload,
    providedSignature,
  ] = token.split(".");

  if (
    !encodedPayload ||
    !providedSignature
  ) {
    return null;
  }

  const expectedSignature =
    sign(encodedPayload);

  const a = Buffer.from(
    providedSignature,
  );

  const b = Buffer.from(
    expectedSignature,
  );

  if (
    a.length !== b.length ||
    !timingSafeEqual(a, b)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decode(encodedPayload),
    ) as T;

    if (
      !payload.exp ||
      payload.exp <=
        Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(
  payload: Omit<
    SessionPayload,
    "exp"
  >,
  maxAgeSeconds =
    60 * 60 * 24 * 7,
) {
  return createSignedToken(
    payload,
    maxAgeSeconds,
  );
}

export function verifySessionToken(
  token: string | undefined | null,
) {
  return verifySignedToken<SessionPayload>(
    token,
  );
}

export function createPendingApprovalToken(
  payload: Omit<
    PendingApprovalPayload,
    "exp" | "purpose"
  >,
  maxAgeSeconds =
    60 * 60 * 24,
) {
  return createSignedToken(
    {
      ...payload,
      purpose: "approval" as const,
    },
    maxAgeSeconds,
  );
}

export function verifyPendingApprovalToken(
  token: string | undefined | null,
) {
  const payload =
    verifySignedToken<PendingApprovalPayload>(
      token,
    );

  if (
    !payload ||
    payload.purpose !== "approval"
  ) {
    return null;
  }

  return payload;
}

export function cookieNameForRole(
  role: UserRole,
) {
  return role === "PATIENT"
    ? PATIENT_SESSION_COOKIE
    : ADMIN_SESSION_COOKIE;
}
