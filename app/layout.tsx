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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="min-h-dvh page-gradient">
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
