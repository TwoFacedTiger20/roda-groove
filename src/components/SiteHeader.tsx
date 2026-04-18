import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-foreground bg-night/95 backdrop-blur scanlines">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="inline-block h-6 w-6 bg-tropical pixel-border-sm" aria-hidden />
          <span className="text-pixel text-base sm:text-lg text-mango group-hover:text-coral transition-colors">
            AXÉ
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3 text-display text-lg">
          <Link
            to="/"
            className="px-2 py-1 text-foreground hover:text-mango"
            activeOptions={{ exact: true }}
            activeProps={{ className: "px-2 py-1 text-mango" }}
          >
            Home
          </Link>
          <Link
            to="/browse"
            className="px-2 py-1 text-foreground hover:text-mango"
            activeProps={{ className: "px-2 py-1 text-mango" }}
          >
            Browse Rodas
          </Link>
        </nav>
      </div>
    </header>
  );
}
