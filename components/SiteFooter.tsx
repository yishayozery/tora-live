export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="container-page flex flex-col gap-2 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <div>© {new Date().getFullYear()} TORA_LIVE — כל הזכויות שמורות.</div>
        <div className="flex gap-4">
          <a href="/about" className="hover:text-ink">אודות</a>
          <a href="/contact" className="hover:text-ink">צור קשר</a>
          <a href="/terms" className="hover:text-ink">תנאי שימוש</a>
        </div>
      </div>
    </footer>
  );
}
