import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider }  from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'MarketIQ — Market Intelligence Platform',
  description: 'AI-powered real-time market intelligence for analysts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
