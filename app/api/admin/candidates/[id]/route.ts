import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";

/**
 * POST /api/admin/candidates/[id]
 * body: { action: "approve_trusted" | "approve_pending" | "reject" | "defer" | "reopen", notes?: string }
 *
 * approve_* → יוצר RabbiSource + מעדכן SourceCandidate לסטטוס APPROVED
 * reject    → SourceCandidate.reviewStatus = REJECTED (לא יוצר RabbiSource)
 * defer     → SourceCandidate.reviewStatus = DEFERRED
 * reopen    → חזרה ל-PENDING
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action as string;
  const notes = typeof body?.notes === "string" ? body.notes : undefined;

  const candidate = await db.sourceCandidate.findUnique({ where: { id: params.id } });
  if (!candidate) return NextResponse.json({ error: "not found" }, { status: 404 });

  // --- REOPEN ---
  if (action === "reopen") {
    await db.sourceCandidate.update({
      where: { id: candidate.id },
      data: { reviewStatus: "PENDING", reviewedAt: null, approvedSourceId: null },
    });
    return NextResponse.json({ ok: true, status: "PENDING" });
  }

  // --- DEFER ---
  if (action === "defer") {
    await db.sourceCandidate.update({
      where: { id: candidate.id },
      data: { reviewStatus: "DEFERRED", reviewedAt: new Date(), reviewNotes: notes },
    });
    return NextResponse.json({ ok: true, status: "DEFERRED" });
  }

  // --- REJECT ---
  if (action === "reject") {
    await db.sourceCandidate.update({
      where: { id: candidate.id },
      data: { reviewStatus: "REJECTED", reviewedAt: new Date(), reviewNotes: notes },
    });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  // --- APPROVE (trusted or pending) ---
  if (action === "approve_trusted" || action === "approve_pending") {
    if (!candidate.handle) {
      return NextResponse.json({
        error: "אין @handle/URL למקור — לא ניתן לאשר עד שתתוקן זהות הערוץ. סמן 'דחה להחלטה' או עדכן את הקובץ seed-candidates.ts.",
      }, { status: 400 });
    }

    // פתרון ל-channelId באמצעות YouTube API
    const apiKey = process.env.YOUTUBE_API_KEY;
    let channelId: string | null = null;
    let channelTitle = candidate.name;
    let channelUrl = candidate.channelUrl || "";

    // זיהוי מהיר אם ה-handle כבר מכיל channelId (UC...)
    const directMatch = candidate.handle.match(/UC[a-zA-Z0-9_-]{20,}/);
    if (directMatch) {
      channelId = directMatch[0];
      channelUrl = `https://www.youtube.com/channel/${channelId}`;
    } else if (apiKey) {
      // נסה לפתור @handle דרך ה-API
      let handleQuery = candidate.handle.trim();
      const m = handleQuery.match(/@([^\s/]+)/);
      if (m) handleQuery = m[1];
      else handleQuery = handleQuery.replace(/^@/, "").replace(/^youtube\.com\/(user\/|channel\/|@)?/, "");

      try {
        const url = new URL("https://www.googleapis.com/youtube/v3/search");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("q", `@${handleQuery}`);
        url.searchParams.set("type", "channel");
        url.searchParams.set("maxResults", "1");
        url.searchParams.set("key", apiKey);

        const res = await fetch(url.toString());
        if (res.ok) {
          const data: any = await res.json();
          const item = data.items?.[0];
          if (item) {
            channelId = item.snippet.channelId;
            channelTitle = item.snippet.title;
            channelUrl = `https://www.youtube.com/channel/${channelId}`;
          }
        }
      } catch (e: any) {
        console.error("YouTube API lookup failed:", e.message);
      }
    }

    if (!channelId) {
      return NextResponse.json({
        error: `לא נמצא channelId עבור "${candidate.handle}". נסה לאמת ידנית ב-YouTube, או עדכן את ה-handle. חסר YOUTUBE_API_KEY?`,
      }, { status: 400 });
    }

    // בדוק אם כבר קיים
    const existing = await db.rabbiSource.findUnique({
      where: { platform_channelId: { platform: "YOUTUBE", channelId } },
    });

    let sourceId: string;
    if (existing) {
      // עדכן trusted אם נדרש
      await db.rabbiSource.update({
        where: { id: existing.id },
        data: {
          enabled: true,
          trusted: action === "approve_trusted",
          notes: candidate.content ?? existing.notes,
        },
      });
      sourceId = existing.id;
    } else {
      const created = await db.rabbiSource.create({
        data: {
          platform: "YOUTUBE",
          channelId,
          channelTitle,
          channelUrl,
          notes: candidate.content ?? null,
          enabled: true,
          trusted: action === "approve_trusted",
        },
      });
      sourceId = created.id;
    }

    await db.sourceCandidate.update({
      where: { id: candidate.id },
      data: {
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
        reviewNotes: notes,
        approvedSourceId: sourceId,
      },
    });

    return NextResponse.json({ ok: true, status: "APPROVED", sourceId, channelId });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
