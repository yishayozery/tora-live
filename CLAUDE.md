# TORA_LIVE — הנחיות לסוכנים

פלטפורמת שיעורי תורה אונליין לרבנים. אפיון מלא: `אפיון.md`.

## כללי ברזל
1. **RTL תמיד** — `dir="rtl"` כבר ב-root layout. כל קומפוננטה חייבת להיות תקינה ב-RTL.
2. **Mobile-first** — רוב הצופים בנייד. הגדרות ברירת מחדל למובייל, `sm:` ומעלה לדסקטופ.
3. **אבטחה** — מייל/טלפון של רבנים **לעולם לא נחשפים לציבור**. לא להחזיר `rabbi.email`/`rabbi.phone` מ-API ציבורי.
4. **נגישות** — WCAG 2.1 AA: קונטרסט 4.5:1, `focus-visible`, תוויות aria, HTML סמנטי.
5. **חסימה היא חוויה, לא שגיאה** — תלמיד חסום רואה הודעה ברורה, לא 500.
6. **ביצועים** — `next/image` לכל תמונה, lazy לסרטונים ו-PDFs.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · Prisma + PostgreSQL (Supabase) · NextAuth (credentials).

## מבנה
- `app/(public)` — עמודים ציבוריים (בית, רב/[slug], שיעור, תרומה)
- `app/(auth)` — login/register
- `app/(rabbi)` — דשבורד רב פרטי
- `app/(admin)` — ממשק אדמין
- `components/ui` — primitives (Button, Card…)
- `lib/` — db, auth, utils, integrations
- `prisma/schema.prisma` — מקור האמת של ה-DB

## פלטת צבעים (Tailwind)
- `primary` — כחול ירושלים #1E40AF (CTA)
- `gold` — #B8862F (הדגשות, לוח כבוד)
- `live` — #059669 (שידור חי)
- `danger` — #8B1E2D
- `ink` — טקסט, `paper` — רקעים, `border` — גבולות
- כותרות: `hebrew-serif` (Frank Ruhl Libre). גוף: Assistant.

## Phases
1. MVP — רב/תלמיד/אדמין, דף רב, שיעורים, דשבורד.
2. Calendar + Chat — סנכרון יומנים, צ'אט שאלות.
3. Donations — Tranzila/Cardcom + קבלות PDF.
4. AI — Whisper לתמלול.

## הרצה
```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

## מי מייצג את מי (ריטואל צוותי)
- **קוד** — מקפיד על TypeScript strict, Zod validation בגבולות.
- **UI/UX** — בודק כל מסך ב-RTL ובמובייל לפני merge.
- **שיווק** — כל עמוד חדש צריך כותרת ותיאור SEO בעברית.
- **"הרבנים"** — פרטיות תחילה, כבוד התורה, פשטות הממשק.
- **הקהל** — עמוד בית טעון < 2s, צפייה ללא הרשמה.
