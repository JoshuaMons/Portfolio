'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SiteLogo } from './site-logo';
import { ShaderControls } from './shader-controls';

const nav = [
  { href: '/projects', label: 'Projecten' },
  { href: '/blog', label: 'Logboek' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/about', label: 'Over mij' },
  { href: '/contact', label: 'Contact' },
];

export function SiteNavbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Hide on admin routes (admin has its own shell)
  if (pathname.startsWith('/admin')) return null;

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-4">
        <nav className="hidden items-center gap-1 md:flex">
          {nav.slice(0, 3).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm transition-colors',
                  active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex justify-center">
          <SiteLogo />
        </div>

        <div className="flex items-center justify-end gap-2">
          <ShaderControls />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="gap-2"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? 'Light' : 'Dark'}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Admin</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-1 px-5 pb-4 md:hidden">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-xl px-3 py-2 text-sm transition-colors',
                active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

