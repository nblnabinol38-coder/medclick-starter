import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
  PATIENT_SESSION_COOKIE,
  SessionPayload,
  verifySessionToken,
} from "@/lib/session";

export async function readAdminSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();

  const primary = verifySessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (
    primary &&
    (primary.role === "ADMIN" ||
      primary.role === "DOCTOR")
  ) {
    return primary;
  }

  /*
   * Migração suave dos cookies das versões anteriores.
   * Só aceitamos o cookie antigo se ele for realmente ADMIN/DOCTOR.
   * Um cookie antigo de PATIENT nunca vira sessão administrativa.
   */
  const legacy = verifySessionToken(
    cookieStore.get(LEGACY_SESSION_COOKIE)?.value,
  );

  if (
    legacy &&
    (legacy.role === "ADMIN" ||
      legacy.role === "DOCTOR")
  ) {
    return legacy;
  }

  return null;
}

export async function readPatientSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();

  const primary = verifySessionToken(
    cookieStore.get(PATIENT_SESSION_COOKIE)?.value,
  );

  if (primary?.role === "PATIENT") {
    return primary;
  }

  /*
   * Compatibilidade temporária para paciente ainda usando cookie antigo.
   */
  const legacy = verifySessionToken(
    cookieStore.get(LEGACY_SESSION_COOKIE)?.value,
  );

  if (legacy?.role === "PATIENT") {
    return legacy;
  }

  return null;
}
