import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Tolerant frontmatter parser.
 * Some MD files contain quoted strings with embedded double-quotes (e.g.
 * keywords: ["מחזור הש"ס"]) that break strict YAML. We use gray-matter first,
 * and if it throws, fall back to a line-by-line regex extractor.
 */
function readFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  try {
    const parsed = matter(raw);
    return { data: parsed.data, content: parsed.content };
  } catch {
    // Fallback: manually split off ---...--- block and parse line-by-line
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) return { data: {}, content: raw };
    const [, fmBlock, content] = m;
    const data: Record<string, unknown> = {};
    for (const line of fmBlock.split(/\r?\n/)) {
      const kv = line.match(/^(\w+)\s*:\s*(.*)$/);
      if (!kv) continue;
      const [, key, rawVal] = kv;
      const val = rawVal.trim();
      if (val.startsWith("[") && val.endsWith("]")) {
        // Array — extract quoted strings, tolerating bad inner quotes
        const inner = val.slice(1, -1);
        const items: string[] = [];
        // Split by ", " at the outer level (quoted items separated by commas)
        const parts = inner.split(/"\s*,\s*"/);
        for (let i = 0; i < parts.length; i++) {
          let p = parts[i];
          if (i === 0) p = p.replace(/^"/, "");
          if (i === parts.length - 1) p = p.replace(/"$/, "");
          if (p.length > 0) items.push(p);
        }
        data[key] = items;
      } else if (val.startsWith('"') && val.endsWith('"')) {
        data[key] = val.slice(1, -1);
      } else {
        data[key] = val;
      }
    }
    return { data, content };
  }
}

export type BlogFrontmatter = {
  title: string;
  slug: string;
  description: string;
  keywords?: string[];
  publishedAt: string;
  category?: string;
};

export type BlogPost = BlogFrontmatter & {
  content: string;
  html: string;
};

export type BlogSummary = BlogFrontmatter;

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

marked.setOptions({
  gfm: true,
  breaks: false,
});

function parseFile(filePath: string): BlogPost {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = readFrontmatter(raw);
  const fm = data as Partial<BlogFrontmatter>;
  const html = marked.parse(content, { async: false }) as string;
  return {
    title: fm.title ?? "",
    slug: fm.slug ?? path.basename(filePath, ".md"),
    description: fm.description ?? "",
    keywords: fm.keywords ?? [],
    publishedAt: fm.publishedAt ?? "",
    category: fm.category,
    content,
    html,
  };
}

export function getAllBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllBlogPosts(): BlogSummary[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts: BlogSummary[] = files.map((file) => {
    const full = path.join(BLOG_DIR, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data } = readFrontmatter(raw);
    const fm = data as Partial<BlogFrontmatter>;
    return {
      title: fm.title ?? "",
      slug: fm.slug ?? file.replace(/\.md$/, ""),
      description: fm.description ?? "",
      keywords: fm.keywords ?? [],
      publishedAt: fm.publishedAt ?? "",
      category: fm.category,
    };
  });
  return posts.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) return null;
  // Try direct filename match, then search for matching frontmatter slug
  const direct = path.join(BLOG_DIR, `${slug}.md`);
  if (fs.existsSync(direct)) {
    return parseFile(direct);
  }
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const post = parseFile(path.join(BLOG_DIR, file));
    if (post.slug === slug) return post;
  }
  return null;
}

export function formatHebrewDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
