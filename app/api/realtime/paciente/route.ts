import { prisma } from "@/lib/prisma";
import {
  encodeSse,
  sseHeaders,
} from "@/lib/sse";
import { readPatientSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

function sleep(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

export async function GET(
  request: Request,
) {
  const session =
    await readPatientSession();

  if (!session) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastFingerprint = "";

      const send = (
        event: string,
        data: unknown,
      ) => {
        controller.enqueue(
          encoder.encode(
            encodeSse(event, data),
          ),
        );
      };

      send("connected", {
        at: Date.now(),
      });

      try {
        while (!request.signal.aborted) {
          const patient =
            await prisma.patient.findFirst({
              where: {
                OR: [
                  {
                    userId:
                      session.userId,
                  },
                  {
                    email:
                      session.email,
                  },
                ],
              },
              select: {
                id: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            });

          const latest = patient
            ? await prisma.serviceRequest.findFirst(
                {
                  where: {
                    patientId:
                      patient.id,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                  select: {
                    id: true,
                    status: true,
                    updatedAt: true,
                    patientConfirmedPreview:
                      true,
                    previewConfirmedAt:
                      true,
                    payment: {
                      select: {
                        status: true,
                        updatedAt: true,
                      },
                    },
                    _count: {
                      select: {
                        documents: true,
                        statusHistory: true,
                      },
                    },
                  },
                },
              )
            : null;

          const fingerprint = latest
            ? [
                latest.id,
                latest.status,
                latest.updatedAt.getTime(),
                latest.patientConfirmedPreview
                  ? "1"
                  : "0",
                latest.previewConfirmedAt?.getTime() ??
                  0,
                latest.payment?.status ?? "",
                latest.payment?.updatedAt.getTime() ??
                  0,
                latest._count.documents,
                latest._count.statusHistory,
              ].join("|")
            : "empty";

          if (
            fingerprint !==
            lastFingerprint
          ) {
            lastFingerprint =
              fingerprint;

            send("patient-changed", {
              fingerprint,
              at: Date.now(),
            });
          }

          await sleep(1200);
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error(
            "Patient SSE error:",
            error,
          );
          send("stream-error", {
            at: Date.now(),
          });
        }
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: sseHeaders(),
  });
}
