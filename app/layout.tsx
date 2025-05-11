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
  title: 'Student Management System',
  description: 'A comprehensive system for managing students and levels',
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