import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string; sourceId: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      req.signal.addEventListener("abort", close);

      const send = (obj: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          close();
        }
      };

      let lastPage: number | null = null;
      let lastLive: boolean | null = null;

      try {
        while (!closed) {
          const source = await db.lessonSource.findUnique({
            where: { id: params.sourceId },
            select: { id: true, lessonId: true, currentPage: true, isLiveFollow: true },
          });

          if (!source || source.lessonId !== params.id) {
            send({ error: "not_found" });
            close();
            break;
          }

          if (source.currentPage !== lastPage || source.isLiveFollow !== lastLive) {
            lastPage = source.currentPage;
            lastLive = source.isLiveFollow;
            send({ currentPage: source.currentPage, isLiveFollow: source.isLiveFollow });
          } else {
            // heartbeat comment keeps connection alive through proxies
            try {
              controller.enqueue(encoder.encode(`: ping\n\n`));
            } catch {
              close();
              break;
            }
          }

          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
