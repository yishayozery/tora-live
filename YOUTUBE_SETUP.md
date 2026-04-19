# הקמת YOUTUBE_API_KEY — מדריך 5 דקות

הסוכן `lesson-scout` (והקריאה `/api/cron/discover-lessons`) דורשים מפתח ל-YouTube Data API v3. **חינם לחלוטין** עד 10,000 quota units ליום (מספיק לסריקת כ-100 ערוצים בכל יום).

## שלבים

### 1. כנס ל-Google Cloud Console
🔗 https://console.cloud.google.com/

התחבר עם חשבון Gmail. אם אין פרויקט — צור אחד:
- שם: `tora-live`
- Location: `No organization` או כל אופציה זמינה

### 2. הפעל את YouTube Data API v3
- בתפריט: **APIs & Services** → **Library**
- חפש: `YouTube Data API v3`
- לחץ **Enable**

### 3. צור API Key
- בתפריט: **APIs & Services** → **Credentials**
- לחץ **+ Create Credentials** → **API key**
- העתק את המפתח שמופיע (מתחיל ב-`AIza...`)

### 4. הגבל את המפתח (חשוב!)
באותו מסך Credentials — לחץ על המפתח החדש:

**Application restrictions**:
- בחר `HTTP referrers` (ל-Vercel) או `None` (לפיתוח מקומי)
- אם Vercel: הוסף `https://torah-live-rho.vercel.app/*` + `https://tora-live.co.il/*`

**API restrictions**:
- בחר `Restrict key`
- בחר רק: `YouTube Data API v3`
- שמור

### 5. הוסף ל-`.env`
```
YOUTUBE_API_KEY=AIzaSy...שלך
```

### 6. הוסף ב-Vercel
1. https://vercel.com/ → Project → Settings → Environment Variables
2. Name: `YOUTUBE_API_KEY`
3. Value: המפתח
4. Environments: Production, Preview, Development — ✅ כולם
5. Save → Redeploy

### 7. בדיקה
```bash
# מקומית
tsx scripts/resolve-channel-id.ts @machonmeir

# אם רואה רשימת ערוצים — הכל עובד ✅
```

---

## Quota + תכנון

YouTube נותן **10,000 units/יום** (חינם). פירוט צריכה:
- `search.list` (`upcoming`/`live`/`recent`) = 100 units כל אחד
- `videos.list` (עד 50 video בקריאה) = 1 unit

סריקה של **100 ערוצים**:
- 3 חיפושים × 100 ערוצים × 100 units = 30,000 units ❌

לכן — בסריקה היומית אנחנו מעדיפים עד **30 ערוצים** (9,000 units).

### אופטימיזציות לעתיד
1. **Caching** — שמירת תוצאות ל-24 שעות
2. **ETag** — שימוש ב-`If-None-Match` headers
3. **Upload playlist** (`playlistItems.list`) — 1 unit במקום 100 של search
4. **שדרוג Quota** — בקשה חינמית ל-Google להעלאה ל-1M units (לוקח כשבוע)

---

## פתרון בעיות

### "403 Forbidden"
- המפתח לא מוגבל ל-YouTube Data API v3 → חזור לשלב 4
- Referrer restriction לא מכיל את הדומיין שלך → הוסף

### "quotaExceeded"
- חרגת מ-10K units היום. מחכים עד חצות Pacific Time.
- או: יוצרים פרויקט Google Cloud שני ומפתח נוסף (חוקי).

### "API key not valid"
- שכחת להוסיף ל-Vercel env
- ה-referrer restriction חוסם — בפיתוח מקומי השתמש ב-`None`

---

## קבצים רלוונטיים

- `lib/youtube.ts` — wrapper ל-API
- `lib/discovery.ts` — לוגיקה
- `scripts/lesson-scout.ts` — CLI
- `scripts/resolve-channel-id.ts` — עזר לזיהוי channelId
- `app/api/cron/discover-lessons/route.ts` — cron daily
- `app/api/cron/detect-live/route.ts` — cron לזיהוי התחלת שידור (GitHub Actions)
- `app/(admin)/admin/sources/page.tsx` — דף ניהול ערוצים
