// העלאת פוסטר ליום עיון / שיעור — Vercel Blob.
// מקבל קובץ multipart, מאמת סוג + גודל, מחזיר URL ציבורי לשמירה ב-DB.
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireSession } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — מספיק לפוסטר/PDF דקיק
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_UPLOADS_PER_WINDOW = 10;
const UPLOAD_WINDOW_SEC = 10 * 60;

export async function POST(req: Request) {
  // רק משתמש מחובר — מונע ספאם בלתי-מזוהה
  const session = await requireSession();

  // env check ראשון — לא רוצים לבזבז זמן על parsing של formData אם אין לאן להעלות
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "העלאת קבצים לא מוגדרת בשרת. צור קשר עם האדמין." },
      { status: 503 },
    );
  }

  const ok = await rateLimit(`upload-poster:${session.user.id}`, MAX_UPLOADS_PER_WINDOW, UPLOAD_WINDOW_SEC);
  if (!ok) {
    return NextResponse.json({ error: "יותר מדי העלאות. נסה שוב בעוד כמה דקות." }, { status: 429 });
  }

  // בדיקת Content-Length מוקדמת — חוסך parsing של 100MB body שמייד יידחה
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_BYTES + 1024) { // +1KB ל-multipart overhead
    return NextResponse.json({ error: "הקובץ גדול מדי — מקסימום 8MB" }, { status: 413 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "חסר קובץ" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "סוג קובץ לא נתמך. תמונה (JPG/PNG/WebP/GIF) או PDF בלבד." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "הקובץ גדול מדי — מקסימום 8MB" }, { status: 413 });
  }

  // שם ייחודי — uid של המשתמש + timestamp + שם מקורי "נקי"
  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 60) || "file";
  const key = `posters/${session.user.id}/${Date.now()}-${safeName}`;

  const blob = await put(key, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return NextResponse.json({ url: blob.url });
}
