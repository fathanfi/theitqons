import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import { SessionProvider } from '@/components/SessionProvider';
import { Navigation } from '@/components/Navigation';
import { StoreInitializer } from '@/components/StoreInitializer';
import { Footer } from '@/components/Footer';
import { RouteLoader } from '@/components/RouteLoader';
import { UnauthorizedProvider } from '@/contexts/UnauthorizedContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Itqon',
  description: 'Student Management System',
  icons: {
    icon: '/images/favicon/favicon.ico',
    shortcut: '/images/favicon/favicon.ico',
    apple: '/images/favicon/apple-touch-icon.png',
    other: [
      { rel: 'icon', type: 'image/png', sizes: '192x192', url: '/images/favicon/android-chrome-192.png' },
      // Add more sizes if available
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UnauthorizedProvider>
          <AuthProvider>
            <SessionProvider>
              <StoreInitializer>
                <RouteLoader />
                <Navigation />
                <main className="container mx-auto px-4 py-8">
                  {children}
                </main>
                <Footer />
              </StoreInitializer>
            </SessionProvider>
          </AuthProvider>
        </UnauthorizedProvider>
      </body>
    </html>
  );
}