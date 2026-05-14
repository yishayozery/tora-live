# הקמת Cloudflare Stream — מדריך 10 דקות

זה מה שצריך כדי שרבנים יוכלו לשדר חי ישירות מהדפדפן (WHIP / WebRTC).

## עלות (חשוב לדעת מראש)

Cloudflare Stream הוא **חבילה בתשלום** (לא בחינם):
- **$5 לחודש בסיס** — מאפשר עד 1000 דקות אחסון של הקלטות
- **$1 לכל 1000 דקות צפייה** (delivery)
- **$5 לכל 1000 דקות אחסון נוספות**

לדוגמה: 50 שיעורים של שעה בחודש + 5000 דקות צפייה ≈ **$15-20 לחודש**. שווה לאן שאתה מכוון.

חלופות לעתיד (אם הופך יקר):
- LiveKit Cloud (~$10/חודש לבסיס)
- Mux Live (~$0.04/דקה streaming)
- שרת RTMP עצמי עם nginx-rtmp (חינם, אבל דורש תחזוקה)

---

## 1. פתיחת חשבון + הפעלת Stream (5 דקות)

1. **https://dash.cloudflare.com/sign-up** — צור חשבון (אם אין). תקבל אישור במייל.
2. אחרי כניסה — תפריט שמאלי → **Stream** → **Subscribe** ($5/חודש).
3. מלא פרטי תשלום (כרטיס אשראי).

---

## 2. השגת ה-Account ID (30 שניות)

1. בדאשבורד של Cloudflare → תפריט שמאלי → **Stream**
2. בצד ימין (למעלה) — כפתור **Copy Account ID** או תיבה עם המזהה. ההעתק.

זה ה-`CLOUDFLARE_ACCOUNT_ID` שלך — שורת hex של 32 תווים.

---

## 3. יצירת API Token (3 דקות)

1. בפינה ימנית עליונה — לחץ על אווטר המשתמש → **My Profile** → **API Tokens**
2. **Create Token** → גלול עד **Create Custom Token** → **Get started**
3. שם הטוקן: `tora-live-stream`
4. הרשאות (Permissions):
   - בחר: **Account** | **Stream** | **Edit**
   - לחץ **Add more** → **Account** | **Stream** | **Read** (אופציונלי, כדי שתוכל גם לקרוא)
5. **Account Resources**: השאר על "Include — All accounts" (או בחר את החשבון שלך)
6. **TTL**: השאר ריק (אל תפוג)
7. **Continue to summary** → **Create Token**
8. **חשוב מאוד** — תקבל מחרוזת ארוכה. **תעתיק אותה עכשיו** — לא תוכל לראות אותה שוב. אם איבדת, תיצור טוקן חדש.

זה ה-`CLOUDFLARE_STREAM_TOKEN` שלך.

---

## 4. הוספת המפתחות ל-Vercel (2 דקות)

1. https://vercel.com → הפרויקט שלך → **Settings** → **Environment Variables**
2. הוסף 2 משתנים (לסביבת **Production, Preview, Development**):

| Name | Value |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | (מה שהעתקת בצעד 2) |
| `CLOUDFLARE_STREAM_TOKEN` | (מה שהעתקת בצעד 3) |

3. שמור — Vercel ידרוש redeploy. תלחץ **Deployments** → על ה-deploy האחרון → **... → Redeploy**.

---

## 5. (אופציונלי, מומלץ) הגדרת Webhook לסיום שידור

המערכת כבר תומכת ב-webhook שמזהה אוטומטית מתי שידור נגמר (גם אם הרב סגר את הדפדפן באמצע). כדי להפעיל:

1. בדאשבורד Cloudflare → **Stream** → **Webhooks**
2. **Add Webhook**
3. URL: `https://<your-vercel-domain>/api/webhooks/cloudflare`
4. **Create**. Cloudflare יחזיר לך **Webhook secret** — העתק.
5. בחזרה ל-Vercel → Environment Variables → הוסף:

| Name | Value |
|---|---|
| `CLOUDFLARE_STREAM_WEBHOOK_SECRET` | (ה-secret מהשלב הקודם) |

6. Redeploy.

---

## 6. הוספת המפתחות גם ל-`.env.prod.txt` המקומי (לעתיד)

כדי שתוכל להריץ סקריפטים מקומיים שמגיעים ל-Cloudflare, ערוך את הקובץ:

```env
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_STREAM_TOKEN=...
CLOUDFLARE_STREAM_WEBHOOK_SECRET=...
```

(הקובץ הזה לא נדחף ל-Git — בדוק שהוא ב-`.gitignore` אם לא בטוח.)

---

## בדיקה שהכל עובד

אחרי שעשית את כל זה, פתח את עמוד דשבורד השידור הח של רב באתר:

1. צור שיעור עתידי
2. לחץ "**שדר מהדפדפן**" (אם כתוב "בקרוב" — סימן שעוד לא יישמנו את WHIP, חכה ל-PR ההמשך)
3. אם הופיע מסך מצלמה והכל תקין — מצוין
4. לחץ "**התחל שידור בפועל**"
5. פתח חלון נוסף ב-Chrome (Incognito) ולך לעמוד השיעור הציבורי כצופה
6. אמורה לראות את עצמך בשידור עם השהייה של 2-5 שניות

אם הופיע "שגיאת מצלמה" / "אין הרשאות" — הדפדפן חוסם. בכרום: לחץ על המנעול ליד ה-URL → אפשר מצלמה+מיקרופון.

---

## בעיות נפוצות

| בעיה | פתרון |
|---|---|
| `Cloudflare Stream API error: Stream subscription required` | לא נרשמת ל-$5/חודש בצעד 1. חזור לדף Stream וחזור על Subscribe. |
| `403 Forbidden` ב-build | ה-API Token לא נכון או שאין לו הרשאת Edit. צור טוקן חדש. |
| שידור עובד אבל אין צפייה | בדוק שבוטל ה-flag `isPublic: false` בשיעור, וש-`approvalStatus = APPROVED`. |
| Webhook לא מגיע | בדוק שה-URL ב-Cloudflare מצביע ל-production domain (לא ל-vercel.app). |

---

תעדכן אותי שסיימת את הצעדים 1-4 (Stream + ENV vars). ה-Webhook (5) אפשר אחר כך.
