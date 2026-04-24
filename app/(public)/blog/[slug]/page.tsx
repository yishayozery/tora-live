import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ArrowRight, Users, Radio } from "lucide-react";
import {
  getAllBlogSlugs,
  getBlogPostBySlug,
  getAllBlogPosts,
  formatHebrewDate,
} from "@/lib/blog";
import { ShareWhatsAppButton } from "@/components/blog/ShareWhatsAppButton";

const SITE = "https://tora-live.co.il";

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    return { title: "מאמר לא נמצא — TORA_LIVE" };
  }
  const url = `/blog/${post.slug}`;
  return {
    title: `${post.title} — TORA_LIVE`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      siteName: "TORA_LIVE",
      locale: "he_IL",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

// בחירת CTA לפי קטגוריית המאמר
function pickCTA(category?: string): { href: string; title: string; desc: string; icon: "rabbis" | "lessons" } {
  const cat = category ?? "";
  if (cat.includes("רבנים") || cat === "לרבנים") {
    return {
      href: "/rabbi/register",
      title: "רב? פתחו דף משלכם ב-TORA_LIVE",
      desc: "דף רב מלא, לוח שיעורים, שידורים חיים, תלמידים — הכל בחינם.",
      icon: "rabbis",
    };
  }
  if (cat.includes("שידור")) {
    return {
      href: "/#live",
      title: "צפו בשידורים חיים עכשיו",
      desc: "רבנים משדרים בזמן אמת — כל השידורים החיים במקום אחד.",
      icon: "lessons",
    };
  }
  if (cat.includes("הלכה") || cat.includes("פרשת") || cat.includes("לימוד") || cat.includes("מדריכים")) {
    return {
      href: "/lessons",
      title: "גלו שיעורים בנושא שמעניין אתכם",
      desc: "מאות שיעורים בכל נושא — הלכה, פרשת שבוע, דף יומי ועוד.",
      icon: "lessons",
    };
  }
  return {
    href: "/rabbis",
    title: "מצאו את הרב שמדבר אליכם",
    desc: "עשרות רבנים מכל הזרמים — דפים אישיים, שיעורים, שידורים חיים.",
    icon: "rabbis",
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const cta = pickCTA(post.category);
  const canonical = `${SITE}/blog/${post.slug}`;
  const allPosts = getAllBlogPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    inLanguage: "he-IL",
    author: {
      "@type": "Organization",
      name: "TORA_LIVE",
      url: SITE,
    },
    publisher: {
      "@type": "Organization",
      name: "TORA_LIVE",
      url: SITE,
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    keywords: (post.keywords ?? []).join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-primary transition"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לכל המאמרים
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8">
          {post.category && (
            <div className="inline-flex items-center text-xs font-semibold text-primary bg-primary-soft rounded-full px-3 py-1 mb-4">
              {post.category}
            </div>
          )}
          <h1 className="hebrew-serif text-3xl sm:text-5xl font-bold text-ink leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-ink-soft mt-4">{post.description}</p>
          <div className="flex items-center gap-2 mt-4 text-sm text-ink-muted">
            <Calendar className="w-4 h-4" />
            <time dateTime={post.publishedAt}>
              {formatHebrewDate(post.publishedAt)}
            </time>
          </div>
        </header>

        {/* Content */}
        <div
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {/* CTA */}
        <div className="mt-12 rounded-card border border-primary/30 bg-primary-soft/40 p-6 sm:p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mb-3">
            {cta.icon === "rabbis" ? (
              <Users className="w-6 h-6" />
            ) : (
              <Radio className="w-6 h-6" />
            )}
          </div>
          <h2 className="hebrew-serif text-2xl font-bold text-ink mb-2">
            {cta.title}
          </h2>
          <p className="text-ink-soft mb-5 max-w-md mx-auto">{cta.desc}</p>
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center h-11 px-6 rounded-btn bg-primary text-white font-semibold hover:bg-primary-hover transition"
          >
            לצפייה
          </Link>
        </div>

        {/* Share */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="text-sm text-ink-muted">שתפו את המאמר:</span>
          <ShareWhatsAppButton title={post.title} url={canonical} />
        </div>

        {/* Related */}
        {allPosts.length > 0 && (
          <section className="mt-14 pt-10 border-t border-border">
            <h2 className="hebrew-serif text-2xl font-bold text-ink mb-6">
              מאמרים נוספים
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {allPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="block p-4 rounded-card border border-border bg-white hover:border-primary/40 hover:shadow-soft transition"
                >
                  <h3 className="hebrew-serif font-bold text-ink text-base leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-ink-muted mt-2 line-clamp-2">
                    {p.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
