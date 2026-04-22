import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';

export const metadata: Metadata = {
  title: 'Chatbot Dashboard',
  description: 'Analyse your chatbot handover data with interactive charts and insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <DatabaseProvider>{children}</DatabaseProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
