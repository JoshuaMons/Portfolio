import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteNavbar } from '@/components/site/site-navbar';
import { ShaderScript } from '@/components/site/shader-script';
import { ReviewWidget } from '@/components/site/review-widget';

export const metadata: Metadata = {
  title: 'Portfolio — Fontys Business & AI',
  description: 'Portfolio dashboard met projecten, logboek en admin.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover' as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="min-h-dvh overflow-x-hidden page-gradient">
        <ThemeProvider>
          <ShaderScript />
          <SiteNavbar />
          {children}
          <ReviewWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
