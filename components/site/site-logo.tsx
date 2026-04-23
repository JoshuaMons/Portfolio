'use client';

import Link from 'next/link';

export function SiteLogo() {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-2">
      <span
        className="text-2xl sm:text-3xl font-semibold tracking-tight"
        style={{ fontFamily: "'Dancing Script', ui-serif, serif" }}
      >
        Joshua&apos;s Portfolio
      </span>
      <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Home
      </span>
    </Link>
  );
}

