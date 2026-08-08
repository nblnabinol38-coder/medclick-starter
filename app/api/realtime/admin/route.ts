import { prisma } from "@/lib/prisma";
import {
  isOnline,
  listPresence,
} from "@/lib/presence";
import {
  encodeSse,
  sseHeaders,
} from "@/lib/sse";
import { readAdminSession } from "@/lib/server-session";

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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastRequestFingerprint = "";
      let lastPresenceFingerprint = "";

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
          const latest =
            await prisma.serviceRequest.findFirst({
              orderBy: [
                { updatedAt: "desc" },
                { createdAt: "desc" },
              ],
              select: {
                id: true,
                status: true,
                updatedAt: true,
              },
            });

          const total =
            await prisma.serviceRequest.count();

          const requestFingerprint =
            `${total}|${latest?.id ?? ""}|${
              latest?.status ?? ""
            }|${
              latest?.updatedAt.getTime() ?? 0
            }`;

          if (
            requestFingerprint !==
            lastRequestFingerprint
          ) {
            lastRequestFingerprint =
              requestFingerprint;

            send("requests-changed", {
              fingerprint:
                requestFingerprint,
              at: Date.now(),
            });
          }

          const online = listPresence()
            .filter(
              (entry) =>
                entry.role === "PATIENT" &&
                isOnline(entry),
            )
            .map((entry) => ({
              userId: entry.userId,
              name: entry.name,
              email: entry.email,
              path: entry.path,
              lastSeenAt:
                entry.lastSeenAt,
            }));

          const presenceFingerprint =
            online
              .map(
                (item) =>
                  `${item.userId}:${item.path}:${Math.floor(
                    item.lastSeenAt / 5000,
                  )}`,
              )
              .join("|");

          if (
            presenceFingerprint !==
            lastPresenceFingerprint
          ) {
            lastPresenceFingerprint =
              presenceFingerprint;

            send("presence-changed", {
              onlineCount:
                online.length,
              at: Date.now(),
            });
          }

          // Server-side watcher only.
          // No visible client refresh.
          await sleep(1500);
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error(
            "Admin SSE error:",
            error,
          );
          send("stream-error", {
            at: Date.now(),
          });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: sseHeaders(),
  });
}
