# TORA_LIVE — אסטרטגיית SEO ו-AI Search

**גרסה 1.0 · אפריל 2026 · קהל דתי-לאומי + חרדל"י**

---

## חלק 1 — SEO Audit: 10 שינויים מיידיים

כל שינוי מדורג לפי השפעה (1-5) וקלות ביצוע (1-5).

---

### #1 — title tag ו-description ייחודיים לכל דף רב

**קובץ**: `app/(public)/rabbi/[slug]/page.tsx`

**בעיה**: דפי רבנים ככל הנראה יורשים את ה-metadata הגנרי מה-root layout.

**מה לשנות**: ייצא `generateMetadata` דינמי לכל דף רב:

```ts
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const rabbi = await getRabbiBySlug(params.slug);
  return {
    title: `הרב ${rabbi.name} — שיעורי תורה בשידור חי | TORA_LIVE`,
    description: `האזינו לשיעורים של הרב ${rabbi.name} — ${rabbi.shortBio?.slice(0, 80) ?? "שיעורי תורה, פרשת שבוע, הלכה ועוד"}. חינם, ללא הרשמה.`,
    alternates: { canonical: `https://tora-live.co.il/rabbi/${rabbi.slug}` },
    openGraph: {
      title: `הרב ${rabbi.name} | TORA_LIVE`,
      images: [rabbi.imageUrl ?? "/og-default.jpg"],
    },
  };
}
```

**השפעה**: 5/5 — כל דף רב מתחרה על "הרב X שיעורים" בגוגל.
**קלות**: 4/5 — 30 דקות עבודה.

---

### #2 — title tag ייחודי לכל שיעור

**קובץ**: `app/(public)/lesson/[id]/page.tsx`

**בעיה**: title גנרי לכל 5,000+ שיעורים בסיטמאפ.

**מה לשנות**:

```ts
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const lesson = await getLessonById(params.id);
  const title = `${lesson.title} — הרב ${lesson.rabbi.name} | TORA_LIVE`;
  return {
    title: title.slice(0, 60),
    description: `האזינו לשיעור "${lesson.title}" מאת הרב ${lesson.rabbi.name}. ${lesson.description?.slice(0, 80) ?? "שיעור תורה בחינם"}`,
    alternates: { canonical: `https://tora-live.co.il/lesson/${lesson.id}` },
  };
}
```

**השפעה**: 5/5 — אלפי long-tail keywords ("שיעור פרשת בהר הרב X").
**קלות**: 4/5.

---

### #3 — JSON-LD מלא לדפי רבנים (Person + ProfilePage)

**קובץ**: `app/(public)/rabbi/[slug]/page.tsx`

**בעיה**: structured data חלקי.

**מה להוסיף** (בתוך `<script type="application/ld+json">`):

```json
{
  "@context": "https://schema.org",
  "@type": ["Person", "Teacher"],
  "name": "הרב [שם]",
  "jobTitle": "רב קהילה / ראש ישיבה",
  "url": "https://tora-live.co.il/rabbi/[slug]",
  "image": "[imageUrl]",
  "description": "[bio]",
  "sameAs": [],
  "knowsAbout": ["תורה", "הלכה", "פרשת שבוע"],
  "memberOf": {
    "@type": "Organization",
    "name": "TORA_LIVE",
    "url": "https://tora-live.co.il"
  }
}
```

**השפעה**: 5/5 — מאפשר Knowledge Panel בגוגל.
**קלות**: 3/5.

---

### #4 — JSON-LD לשיעורים (Course + VideoObject)

**קובץ**: `app/(public)/lesson/[id]/page.tsx`

**מה להוסיף**:

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "[lesson.title]",
  "description": "[lesson.description]",
  "thumbnailUrl": "[thumbnail]",
  "uploadDate": "[lesson.createdAt]",
  "duration": "PT[X]M",
  "author": {
    "@type": "Person",
    "name": "הרב [שם]"
  },
  "publisher": {
    "@type": "Organization",
    "name": "TORA_LIVE",
    "logo": { "@type": "ImageObject", "url": "https://tora-live.co.il/logo.png" }
  },
  "contentUrl": "[streamUrl]",
  "embedUrl": "https://tora-live.co.il/lesson/[id]"
}
```

**השפעה**: 5/5 — Video Rich Results בגוגל.
**קלות**: 3/5.

---

### #5 — robots.txt: הוספת llms.txt ותיקון הדומיין

**קובץ**: `app/robots.ts`

**בעיה נוכחית**: הסיטמאפ מפנה ל-`torah-live-rho.vercel.app` במקום `tora-live.co.il`.

**מה לשנות**:

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/dashboard/", "/api/", "/my/"] },
      { userAgent: "GPTBot", allow: ["/", "/rabbi/", "/lesson/", "/llms.txt"] },
      { userAgent: "Claude-Web", allow: ["/", "/rabbi/", "/lesson/", "/llms.txt"] },
      { userAgent: "PerplexityBot", allow: ["/", "/rabbi/", "/lesson/", "/llms.txt"] },
    ],
    sitemap: "https://tora-live.co.il/sitemap.xml",
    host: "https://tora-live.co.il",
  };
}
```

**השפעה**: 4/5 — תיקון canonical domain + פתיחה לAI crawlers.
**קלות**: 5/5 — שינוי של 5 שורות.

---

### #6 — sitemap.ts: תיקון SITE URL + הוספת דפי blog

**קובץ**: `app/sitemap.ts`

**בעיה**: `SITE = "https://torah-live-rho.vercel.app"` — כתובת ה-Vercel הזמנית.

**מה לשנות**: החלף `SITE` ל-`"https://tora-live.co.il"` והוסף דפי בלוג סטטיים:

```ts
const SITE = "https://tora-live.co.il";

// Blog pages (static slugs)
const blogSlugs = [
  "shier-tora-online-madrich",
  "shiur-hayomi-daf-hashavua",
  "rav-online-elef-talmidim",
  "siddur-parasha-online",
  "shiur-halacha-yomit",
];
const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
  url: `${SITE}/blog/${slug}`,
  lastModified: new Date(),
  changeFrequency: "monthly" as const,
  priority: 0.7,
}));
```

**השפעה**: 4/5.
**קלות**: 5/5.

---

### #7 — Open Graph image דינמי לדפי רבנים ושיעורים

**קובץ**: `app/(public)/rabbi/[slug]/opengraph-image.tsx` (קובץ חדש)

**בעיה**: חסרה תמונה OG ייחודית — WhatsApp ופייסבוק מציגים תמונה גנרית.

**מה לעשות**: צור `opengraph-image.tsx` עם Next.js ImageResponse:

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };

export default async function OgImage({ params }: { params: { slug: string } }) {
  const rabbi = await getRabbiBySlug(params.slug);
  return new ImageResponse(
    <div style={{ ... }}>
      <img src={rabbi.imageUrl} />
      <h1>הרב {rabbi.name}</h1>
      <p>TORA_LIVE</p>
    </div>
  );
}
```

**השפעה**: 4/5 — CTR מ-WhatsApp/פייסבוק עולה.
**קלות**: 3/5.

---

### #8 — meta description לדף הבית: שיפור keyword density

**קובץ**: `app/layout.tsx`

**בעיה הנוכחית**: description לא כולל מילות מפתח ראשיות.

**שינוי**:

```ts
description: "שיעורי תורה אונליין בשידור חי — מאות רבנים מהמגזר הדתי-לאומי. האזינו לשיעורים, פרשת שבוע, דף יומי והלכה יומית. חינם, ללא הרשמה."
```

מילות מפתח: "שיעורי תורה אונליין", "שידור חי", "פרשת שבוע", "דף יומי", "הלכה יומית".

**השפעה**: 4/5.
**קלות**: 5/5 — שינוי שורה אחת.

---

### #9 — hreflang תקין ב-sitemap (לא רק ב-layout)

**קובץ**: `app/sitemap.ts`

**בעיה**: hreflang מוגדר ב-layout אבל לא בסיטמאפ — גוגל מעדיף שיהיה גם שם.

**מה להוסיף**: בפונקציית sitemap, לכל דף סטטי הוסף alternateRefs:

```ts
{
  url: `${SITE}/`,
  alternates: {
    languages: {
      "he": `${SITE}/`,
      "en": `${SITE}/en`,
    }
  }
}
```

Next.js 14 תומך ב-`alternates.languages` ב-MetadataRoute.Sitemap.

**השפעה**: 3/5 — חשוב לחיפושים מחו"ל.
**קלות**: 4/5.

---

### #10 — breadcrumbs ב-JSON-LD לדפי שיעורים

**קובץ**: `app/(public)/lesson/[id]/page.tsx`

**בעיה**: אין breadcrumbs — גוגל לא מציג נתיב ניווט ב-SERP.

**מה להוסיף**:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "בית", "item": "https://tora-live.co.il" },
    { "@type": "ListItem", "position": 2, "name": "שיעורים", "item": "https://tora-live.co.il/lessons" },
    { "@type": "ListItem", "position": 3, "name": "הרב [שם]", "item": "https://tora-live.co.il/rabbi/[slug]" },
    { "@type": "ListItem", "position": 4, "name": "[שם השיעור]" }
  ]
}
```

**השפעה**: 3/5 — Rich Results + CTR.
**קלות**: 4/5.

---

## חלק 2 — AI Search Strategy

### llms.txt — קובץ מוכן להעתקה

```
# TORA_LIVE

> פלטפורמת שיעורי תורה אונליין לקהל הדתי-לאומי וחרדל"י בישראל.
> מאות רבנים, אלפי שיעורים, שידורים חיים — חינם, ללא הרשמה.

TORA_LIVE היא פלטפורמה ישראלית המאפשרת לרבנים ומגידי שיעור לפרסם שיעורי תורה, לשדר בשידור חי ולנהל קהילת לומדים. הפלטפורמה מיועדת לקהל הדתי-לאומי והחרדי-לאומי (חרדל"י) בישראל.

## מה הפלטפורמה מציעה

- **לרבנים**: דף אישי חינמי, ניהול שיעורים, שידור חי, ריכוז פניות תלמידים
- **לתלמידים**: צפייה ללא הרשמה, עקיבה אחרי רבנים, התראות על שיעורים חדשים
- **נושאים**: פרשת שבוע, דף יומי (דף א-דף צה+), הלכה יומית, מחשבת ישראל, תנ"ך, נושאים עונתיים
- **שפה**: עברית בלבד (ממשק + תוכן)

## קהל היעד

ציבור דתי-לאומי וחרדל"י, גילאי 18-65, המחפש תוכן תורני איכותי מרבנים מוכרים.

## רבנים ומוסדות

הפלטפורמה פתוחה לכל רב מאושר מהמגזר. רבנים נרשמים בכתובת:
https://tora-live.co.il/register/rabbi

## קישורים מרכזיים

- דף הבית: https://tora-live.co.il
- כל הרבנים: https://tora-live.co.il/rabbis
- כל השיעורים: https://tora-live.co.il/lessons
- תרומה לפיתוח: https://tora-live.co.il/donate
- ממשק באנגלית: https://tora-live.co.il/en
- תרומה (אנגלית): https://tora-live.co.il/en/donate

## מדיניות נגישות תוכן

כל השיעורים זמינים לצפייה חינם ללא הרשמה.
שיעורים פרטיים מצריכים אישור הרב.

## AI Crawlers

פלטפורמה זו מאפשרת ל-AI crawlers לגשת לכל התוכן הציבורי.
אין להשתמש בתוכן למטרות מסחריות ללא אישור.

## יצירת קשר

https://tora-live.co.il/contact
```

---

### Schema.org Types רלוונטיים לפלטפורמה

#### 1. Organization (דף הבית + כל הדפים)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TORA_LIVE",
  "alternateName": "תורה לייב",
  "url": "https://tora-live.co.il",
  "logo": "https://tora-live.co.il/logo.png",
  "description": "פלטפורמת שיעורי תורה אונליין לקהל הדתי-לאומי בישראל",
  "foundingDate": "2024",
  "areaServed": "IL",
  "inLanguage": "he",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "url": "https://tora-live.co.il/contact"
  }
}
```

#### 2. Person (דף רב)

```json
{
  "@context": "https://schema.org",
  "@type": ["Person", "Teacher"],
  "name": "הרב [שם מלא]",
  "honorificPrefix": "הרב",
  "jobTitle": "[תפקיד: רב קהילה / ראש ישיבה / מגיד שיעור]",
  "url": "https://tora-live.co.il/rabbi/[slug]",
  "image": "[URL תמונה]",
  "description": "[ביוגרפיה קצרה]",
  "knowsAbout": ["תורה", "הלכה", "פרשת שבוע", "תלמוד"],
  "memberOf": { "@type": "Organization", "name": "TORA_LIVE" }
}
```

#### 3. VideoObject + Course (דף שיעור)

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "[שם השיעור]",
  "description": "[תיאור]",
  "thumbnailUrl": "[URL תמונה ממוזערת]",
  "uploadDate": "[ISO 8601]",
  "duration": "PT[X]M[Y]S",
  "inLanguage": "he",
  "author": { "@type": "Person", "name": "הרב [שם]" },
  "publisher": { "@type": "Organization", "name": "TORA_LIVE", "url": "https://tora-live.co.il" },
  "contentUrl": "[URL סטרים]",
  "embedUrl": "https://tora-live.co.il/lesson/[id]",
  "isAccessibleForFree": true
}
```

#### 4. Event (שיעור/שידור חי עתידי)

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "[שם האירוע]",
  "startDate": "[ISO 8601]",
  "endDate": "[ISO 8601]",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
  "location": {
    "@type": "VirtualLocation",
    "url": "https://tora-live.co.il/lesson/[id]"
  },
  "organizer": { "@type": "Person", "name": "הרב [שם]" },
  "isAccessibleForFree": true,
  "inLanguage": "he"
}
```

#### 5. BreadcrumbList (כל דף פנימי)

כמתואר בסעיף #10 לעיל.

---

### איך להופיע ב-Google AI Overviews, Perplexity ו-ChatGPT

#### Google AI Overviews (SGE)

גוגל שולפת AI Overviews מדפים שיש בהם:
1. **E-E-A-T גבוה**: Experience, Expertise, Authoritativeness, Trustworthiness.
   - פתרון: הוסף ביוגרפיה מלאה לכל רב (מוסמך מאיפה, תפקיד, שנות ניסיון).
   - הוסף `@type: Teacher` ו-`hasCredential` ב-Person schema.
2. **תשובות ישירות לשאלות**: AI Overviews מבוססות על FAQ structured data.
   - הוסף `FAQPage` schema לכל דף בלוג + לדף הבית.
   - דוגמה: "מה זה דף יומי?" "איך מצטרפים לשיעור חי?"
3. **Canonical URL תקין**: ודא שכל דף מפנה לדומיין הסופי (`tora-live.co.il`).

#### Perplexity AI

Perplexity סורקת אתרים שמקושרים מ-Reddit, Twitter, Hacker News וויקיפדיה.
- פתח Thread ב-X/Twitter על "שיעורי תורה אונליין" עם קישור לאתר.
- פנה לעיתוני מגזר (כיפה, Srugim) לכתבה — Perplexity סורקת אותם.
- וודא שיש `llms.txt` עם תיאור מלא (ראה לעיל).

#### ChatGPT (Browsing / GPT-4o)

ChatGPT עם browsing משתמשת ב-Bing Index.
- הגש את האתר ל-Bing Webmaster Tools (חינם).
- ודא ש-`robots.txt` מאפשר `GPTBot` (תוקן בסעיף #5).
- כתוב מאמרי בלוג עם שאלות ותשובות מובנות — ChatGPT אוהב תוכן FAQ.
- הוסף את `llms.txt` ב-root כדי שהמודל יוכל לקרוא תיאור ישיר של השירות.

#### כלל מאחד לכל AI Search

**תוכן מובנה + E-E-A-T + llms.txt = נוכחות ב-AI Search.**
אין קיצורים — גוגל ו-AI crawlers מוקירים תוכן אמיתי, עמוק ומובנה.

---

*מסמך גרסה 1.0 · עדכון אחרי 3 חודשים לפי נתוני Search Console*
