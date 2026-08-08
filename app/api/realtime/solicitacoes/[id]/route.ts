import { prisma } from "@/lib/prisma";
import {
  encodeSse,
  sseHeaders,
} from "@/lib/sse";
import { readAdminSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function sleep(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  const session =
    await readAdminSession();

  if (
    !session ||
    (session.role !== "ADMIN" &&
      session.role !== "DOCTOR")
  ) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const { id } = await context.params;
  const identifier =
    decodeURIComponent(id).trim();

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
          const item =
            await prisma.serviceRequest.findFirst({
              where: {
                OR: [
                  { id: identifier },
                  { protocol: identifier },
                ],
              },
              select: {
                id: true,
                status: true,
                updatedAt: true,
                patientConfirmedPreview:
                  true,
                previewConfirmedAt: true,
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
            });

          if (!item) {
            send("deleted", {
              at: Date.now(),
            });
            break;
          }

          const fingerprint =
            [
              item.status,
              item.updatedAt.getTime(),
              item.patientConfirmedPreview
                ? "1"
                : "0",
              item.previewConfirmedAt?.getTime() ??
                0,
              item.payment?.status ?? "",
              item.payment?.updatedAt.getTime() ??
                0,
              item._count.documents,
              item._count.statusHistory,
            ].join("|");

          if (
            fingerprint !==
            lastFingerprint
          ) {
            lastFingerprint =
              fingerprint;

            send("request-changed", {
              requestId: item.id,
              fingerprint,
              at: Date.now(),
            });
          }

          await sleep(1200);
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error(
            "Request SSE error:",
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
