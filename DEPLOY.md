# מדריך העלאה ל-Production — TORA_LIVE

מסלול MVP + Cloudflare. זמן משוער: 2-3 שעות לדריסה ראשונה, פלוס יום-יומיים להגדרת דומיין ומיילים.

---

## שלב 1 — פתיחת חשבונות (~30 דקות)

לפני שאתה ניגש לקוד, פתח חשבונות בכל אחד מהשירותים. רובם חינם.

### 1.1 Vercel — Hosting + Cron Jobs ✅ חינם
1. https://vercel.com/signup → התחבר עם GitHub
2. צור org/account אישי (לא צריך תשלום)

### 1.2 Supabase — Postgres DB ✅ חינם 500MB
1. https://supabase.com → Start your project → התחבר עם GitHub
2. **New Project**:
   - Name: `tora-live`
   - DB Password: צור סיסמה חזקה ושמור (תזדקק לה!)
   - Region: `Europe West (eu-west-1)` או `Europe Central` — הכי קרוב לישראל
   - Plan: Free
3. המתן 2 דקות ליצירת ה-DB.
4. Settings → Database → Connection string:
   - **Transaction pooler** (port 6543) → זה ה-`DATABASE_URL`
   - **Session pooler** (port 5432) → זה ה-`DIRECT_URL`

### 1.3 Resend — מיילים אמיתיים ✅ חינם 3000/חודש
1. https://resend.com/signup
2. API Keys → Create API Key → שמור (`re_...`)
3. Domains → Add Domain → `tora-live.co.il` (תוכל לאמת אחרי שיהיה לך הדומיין; עד אז Resend נותן `onboarding@resend.dev` לבדיקות)

### 1.4 Cloudflare — Stream + R2 ✅ חינם בסיסי
1. https://dash.cloudflare.com/sign-up
2. אחרי כניסה, מהדשבורד הראשי תראה את ה-**Account ID** מימין למטה — שמור.
3. **R2 (אחסון קבצים)**:
   - בתפריט שמאלי → R2 → Enable R2 (חינם 10GB)
   - Create bucket: `tora-live`
   - Manage R2 API Tokens → Create API Token → Permissions: Object Read & Write
   - שמור: `Access Key ID`, `Secret Access Key`, ו-`endpoint` (יראה כמו `https://abc123.r2.cloudflarestorage.com`)
4. **Stream (שידור חי + הקלטה)** — $5/חודש:
   - בתפריט שמאלי → Stream → Subscribe ($5/month base + $1 per 1000 minutes delivered)
   - My Profile (פינה ימנית עליונה) → API Tokens → Create Token
   - Use template: "Custom" → Permissions: `Account → Stream → Edit`
   - שמור את ה-token

### 1.5 דומיין `tora-live.co.il` — ~50₪/שנה (אפשר לדחות לסוף)
1. https://www.isoc.org.il/domains או דרך רשם מורשה (gandi.net, namecheap.com וכו')
2. רק אחרי ש-Vercel deploy ראשון מצליח — תקנה את הדומיין.

---

## שלב 2 — הכנת הקוד (~10 דקות)

### 2.1 החלפת SQLite ל-Postgres
```bash
cd C:/Users/ASUS/Desktop/TORA_LIVE
cp prisma/schema.postgres.prisma prisma/schema.prisma
```

### 2.2 GitHub repo
אם הקוד עוד לא ב-GitHub:
```bash
cd C:/Users/ASUS/Desktop/TORA_LIVE
git init
git add .
git commit -m "Initial commit"
```
צור repo ב-GitHub (פרטי או ציבורי) ועלה:
```bash
git remote add origin https://github.com/USER/tora-live.git
git push -u origin main
```

---

## שלב 3 — הגדרת Supabase + Migration ראשון (~10 דקות)

```bash
# 1. עדכן את .env (מקומי) עם DATABASE_URL ו-DIRECT_URL מ-Supabase
# 2. דחוף את הסכמה ל-Supabase
npx prisma db push

# 3. תזרע נתונים בסיסיים (אם רוצה)
npx prisma db seed
```

אם הצליח — היכנס ל-Supabase → Table Editor → תראה את כל הטבלאות.

---

## שלב 4 — Deploy ל-Vercel (~15 דקות)

### 4.1 New Project
1. https://vercel.com/new → Import את ה-GitHub repo
2. Framework Preset: **Next.js** (אוטומטי)
3. **Build & Output Settings**:
   - Build Command: `prisma generate && next build`
   - (השאר את שאר ההגדרות default)

### 4.2 Environment Variables
הדבק ב-Vercel את כל ה-env (מ-Settings → Environment Variables):

```
ADMIN_EMAIL=admin@tora-live.co.il
DATABASE_URL=postgresql://postgres.xxx:....pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:....pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://tora-live.vercel.app
CRON_SECRET=<openssl rand -base64 24>

RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@resend.dev
EMAIL_FROM_NAME=TORA_LIVE

CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_STREAM_TOKEN=...
CLOUDFLARE_R2_BUCKET=tora-live
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...
CLOUDFLARE_R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
```

> **NEXTAUTH_SECRET**: פתח טרמינל והרץ `openssl rand -base64 32` (או באתר https://generate-secret.vercel.app/32)

### 4.3 Deploy
לחץ **Deploy**. תוך 2-3 דקות יש לך URL כמו `https://tora-live-abc.vercel.app`.

### 4.4 בדיקה
1. גש ל-URL — דף הבית צריך לעלות
2. הירשם כתלמיד — אמור לעבוד
3. בדוק ב-Supabase שהמשתמש נשמר
4. אם משהו לא עובד: Vercel Dashboard → Deployments → Functions Logs

---

## שלב 5 — מימוש R2 + Resend בקוד

עד עכשיו `lib/notify.ts` רק לוגג מיילים, ו-`lib/r2.ts` לא קיים. כשתסיים שלב 4 (יש URL פעיל), נחליף את ה-stubs במימוש אמיתי. **זה שלב נפרד שאני יכול לעשות לך כשתבקש** — דורש את ה-keys שיהיו לך.

---

## שלב 6 — דומיין מותאם (אחרי שיש לך אותו)

1. **Vercel**: Project Settings → Domains → Add `tora-live.co.il`
2. Vercel ייתן לך 2 רשומות DNS להגדיר:
   - `A` record: `76.76.21.21` (או דומה)
   - `CNAME` record: `cname.vercel-dns.com`
3. אצל רשם הדומיין → DNS Management → הוסף את הרשומות
4. המתן עד 24 שעות (בדרך כלל 10 דקות)
5. **Vercel env**: עדכן `NEXTAUTH_URL=https://tora-live.co.il` → Redeploy
6. **Resend**: Add Domain → `tora-live.co.il` → אמת DNS records → עדכן `EMAIL_FROM=noreply@tora-live.co.il`

---

## עלות חודשית משוערת

| שירות | חינם עד | תשלום אם עוברים |
|---|---|---|
| Vercel | 100GB bandwidth, hobby projects | $20/חודש Pro |
| Supabase | 500MB DB, 2GB bandwidth | $25/חודש Pro |
| Resend | 3000 מיילים/חודש, 100/יום | $20/חודש |
| Cloudflare R2 | 10GB אחסון | $0.015 ל-GB מעבר |
| Cloudflare Stream | — | $5/חודש קבוע + $1 ל-1000 דקות |
| דומיין | — | ~50₪/שנה |

**סה"כ למינימום**: ~$5/חודש (Stream) + $4/חודש (דומיין) = **~$9/חודש**

---

## בעיות נפוצות

**`prisma db push` נכשל עם "Can't reach database"**:
- וודא שה-`DATABASE_URL` כולל `?pgbouncer=true` (transaction pooler)
- שה-`DIRECT_URL` הוא port 5432 ולא 6543
- בדוק שה-IP שלך לא חסום ב-Supabase (Settings → Database → Network restrictions)

**Vercel build נכשל**:
- בדוק ש-Build Command הוא `prisma generate && next build`
- שכל ה-env מוגדרים (חסרים → build fails)

**מייל לא נשלח**:
- ודא ש-`RESEND_API_KEY` מוגדר
- ב-Resend Dashboard → Logs → תראה ניסיונות שליחה
- אם הדומיין לא אומת עדיין — חייב להשתמש ב-`EMAIL_FROM=onboarding@resend.dev`

**שידור חי לא מתחיל**:
- ודא `CLOUDFLARE_ACCOUNT_ID` ו-`CLOUDFLARE_STREAM_TOKEN` מוגדרים
- ב-Cloudflare → Stream → Live Inputs — תראה אם נוצר input חדש

---

## הצעד הבא

ברגע שיש לך accounts + keys מ-3 השירותים הקריטיים (Vercel, Supabase, Resend) — תגיד לי, ואני:
1. ממיר את `schema.prisma` ל-Postgres
2. כותב את המימוש האמיתי של Resend ב-`lib/notify.ts`
3. בונה את `lib/r2.ts` + endpoint להעלאת קבצים
4. עוזר לך עם ה-deploy הראשון

קישורים מהירים:
- Vercel: https://vercel.com/signup
- Supabase: https://supabase.com
- Resend: https://resend.com/signup
- Cloudflare: https://dash.cloudflare.com/sign-up
