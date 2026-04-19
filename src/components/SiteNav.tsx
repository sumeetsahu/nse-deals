import Link from "next/link";

const link = "text-sm font-medium text-zinc-700 hover:text-zinc-950";

export function SiteNav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-baseline gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            India deals desk
          </Link>
          <nav className="flex gap-4">
            <Link className={link} href="/">
              Overview
            </Link>
            <Link className={link} href="/explorer">
              Explorer
            </Link>
            <Link className={link} href="/parties">
              Parties
            </Link>
          </nav>
        </div>
        <p className="hidden text-xs text-zinc-500 sm:block">
          NSE · BSE · last week window (UTC dates)
        </p>
      </div>
    </header>
  );
}
