import { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Calendar, ArrowLeft } from "lucide-react";
import { getAllBlogPosts, formatHebrewDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "מאמרים ומדריכים — TORA_LIVE",
  description:
    "מאמרים ומדריכים על לימוד תורה אונליין — בחירת שיעור, דף יומי, הלכה יומית, פרשת שבוע ועוד. תכנים מעמיקים לקהל הדתי-לאומי.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "מאמרים ומדריכים — TORA_LIVE",
    description: "מאמרים ומדריכים על לימוד תורה אונליין לקהל הדתי-לאומי.",
    type: "website",
    url: "/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "מאמרים ומדריכים — TORA_LIVE",
    description: "מאמרים ומדריכים על לימוד תורה אונליין.",
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <h1 className="hebrew-serif text-4xl sm:text-5xl font-bold text-ink">
          מאמרים ומדריכים
        </h1>
        <p className="text-lg text-ink-soft mt-4 max-w-2xl mx-auto">
          תוכן מעמיק על לימוד תורה אונליין — איך לבחור שיעור, להשתלב בדף היומי,
          להתחבר לפרשת השבוע ועוד.
        </p>
      </header>

      {posts.length === 0 ? (
        <Card className="text-center text-ink-muted">
          אין עדיין מאמרים. חזרו בקרוב.
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-card"
            >
              <Card className="h-full flex flex-col transition hover:shadow-soft hover:border-primary/40">
                {post.category && (
                  <div className="inline-flex items-center self-start text-xs font-semibold text-primary bg-primary-soft rounded-full px-2.5 py-0.5 mb-3">
                    {post.category}
                  </div>
                )}
                <h2 className="hebrew-serif text-xl font-bold text-ink mb-2 group-hover:text-primary transition">
                  {post.title}
                </h2>
                <p className="text-sm text-ink-muted flex-1">
                  {post.description}
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatHebrewDate(post.publishedAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary font-semibold group-hover:gap-2 transition-all">
                    קרא עוד
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
