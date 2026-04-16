# TORA_LIVE

פלטפורמת שיעורי תורה אונליין לרבנים — Next.js 14 + Prisma + Tailwind (RTL).

## התקנה
```bash
npm install
cp .env.example .env
# ערוך את DATABASE_URL ו-ADMIN_EMAIL
npx prisma db push
npx prisma db seed
npm run dev
```

פתוח בדפדפן: http://localhost:3000

## מבנה
ראה `CLAUDE.md` ו-`אפיון.md`.

## סטטוס
**Phase 1 — MVP** (בפיתוח):
- [x] Scaffold + Prisma schema
- [x] Layout ציבורי + דף בית + דשבורד ציבורי
- [x] דף רב ציבורי `/rabbi/[slug]`
- [ ] Auth (login/register לרב ולתלמיד)
- [ ] דשבורד רב פרטי + CRUD שיעורים
- [ ] ממשק אדמין (אישור רבנים)
- [ ] העלאת PDF (R2)

## לסוכנים
לפני קוד — קרא את `CLAUDE.md`.
