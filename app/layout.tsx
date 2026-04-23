import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Portfolio — Fontys Business & AI',
  description: 'Portfolio dashboard met projecten, logboek en admin.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="min-h-dvh page-gradient">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
