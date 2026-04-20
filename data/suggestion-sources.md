# מקורות מידע לסוכן הצעות (`social-scout`)

מסמך זה מפרט מאיפה הסוכן יכול לשאוב הצעות לשיעורים ואירועי תורה.
אלה המקורות שצריך להוסיף בשלב הבא של פיתוח הסוכן.

---

## 🟢 מקורות שעובדים כבר

### Telegram public channels
האחרונים שאומתו (HTTP 200):
- `harbracha` — חדשות יישוב הר ברכה (לא תמיד שיעורים)
- `torahlive` — קטן, לא פעיל
- `dailytora` — בעלים לא פעיל

**הערה**: הקהל דתי-לאומי / חרדל"י עובד יותר ב-WhatsApp, לא טלגרם.

### Manual paste (האדמין)
- `/admin/suggestions` → טופס "הדבק קישור"
- שולף Open Graph (כותרת, תמונה, תיאור) מכל URL
- עובד עם פייסבוק (חלקית), אינסטגרם, אתרים רגילים

---

## 🟡 מקורות שצריך לבנות

### 1. אתרי ישיבות + מוסדות

| אתר | URL | מה לסרוק | קושי |
|---|---|---|---|
| ישיבה.אורג.אילן | https://www.yeshiva.org.il/calendar | לוח שיעורים יומי | ⚠️ 403 בוטים |
| הר עציון | https://www.haretzion.org/calendar | אירועים | ⚠️ 403 |
| מכון מאיר | https://www.machonmeir.org.il/ | events page | ⚠️ Connection refused |
| מרכז הרב | https://www.merkazharav.org/ | shiurim | ⚠️ 403 |
| הר ברכה | https://yhb.org.il/ | shiurim schedule | ⚠️ 403 |
| מכון הר"צ | https://har-tzvi.com/ | events | ⚠️ |
| בני דוד עלי | https://www.bneidavid.org.il/ | events | ⚠️ |

**פתרון**: צריך **headless browser** (Browserless / Playwright).
- Browserless חינם: 100 דק'/חודש (3 סריקות יומיות מ-5 אתרים)
- עלות: $50/חודש לתשלום

### 2. אתרי חדשות דתיות (event sections)

| אתר | URL | תוכן רלוונטי |
|---|---|---|
| Srugim | https://www.srugim.co.il/ | אירועים שבועיים, פרשת שבוע |
| Kipa | https://www.kipa.co.il/ | "אירועים" + "שיעורים" sections |
| INN / ערוץ 7 | https://www.inn.co.il/ | "סדר היום" |
| מקור ראשון | https://www.makorrishon.co.il/ | אירועי קהילה |
| BeChadrei Charedim | https://www.bhol.co.il/ | (גובל אבל לפעמים רלוונטי) |

**גישה**: חלק מהם RSS, חלק blocked. צריך לבדוק כל אחד.

### 3. פלטפורמות אירועים

| שירות | API/RSS | הערה |
|---|---|---|
| **Eventbrite Israel** | ✅ API חינם | יש קטגוריית "Spirituality + Religion" |
| **Hebcal** | ✅ ICS feed | זמני חגים בלבד, לא אירועים |
| **Time2Pray** | iCal אופציונלי | לפעמים שיעורים |
| **Google Calendar ציבוריים** | ICS feed | יש ישיבות שמפרסמות יומן פתוח |

### 4. YouTube — שיעורים מתוזמנים
**כבר מטופל** דרך `lesson-scout` עם YouTube API.

### 5. Facebook Events
- דורש Facebook App + Graph API → 2-6 שבועות אישור
- אלטרנטיבה: manual paste (כבר קיים)

### 6. Instagram
- אין דרך נקייה (ה-API פרטי + dubious)
- אלטרנטיבה: manual paste

### 7. TikTok / X
- לא רלוונטי לקהל

---

## 🔴 מה לא לסרוק (אסור)

- **קבוצות WhatsApp פרטיות** — חוקי + אתי
- **קבוצות Telegram סגורות** — דורש חברות
- **דפי פייסבוק פרטיים**
- **אימיילים אישיים**
- **ערוצי YouTube של רבנים שלא הסכימו** — אם רב מבקש להוריד, מסירים מיד

---

## 🛠️ סדר עדיפויות לפיתוח

### עדיפות 1 (השבוע)
- ✅ **Manual paste** — כבר עובד
- 🔄 **Eventbrite API** — חינם, מובנה, קל. ~3 שעות פיתוח.

### עדיפות 2 (החודש)
- 🔄 **Headless scraping** של 5-10 אתרי ישיבות גדולות. עלות: $50/חודש Browserless. פיתוח: 8-12 שעות.

### עדיפות 3 (אחרי traction)
- 🔄 **Facebook Graph API** — אחרי שיש לנו 50+ רבנים מאושרים
- 🔄 **WhatsApp Business** — לקבוצות שמסכימים שהבוט יקרא

---

## 💡 רעיון נוסף — User-Generated Suggestions

במקום שהסוכן יחפש לבד, **לאפשר לתלמידים להגיש הצעות**:

1. בעמוד הציבורי `/lessons` → כפתור "🔔 ראיתי שיעור באינטרנט — אפשר להוסיף?"
2. תלמיד מדביק URL + פרטים בסיסיים
3. הופך ל-`LessonSuggestion` עם `source: "user-submitted"`
4. אדמין מאשר/דוחה כרגיל

**יתרון עצום**: scaling חינמי דרך הקהילה. כל תלמיד = scout.

זמן פיתוח: ~3 שעות.
