import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import { SessionProvider } from '@/components/SessionProvider';
import { Navigation } from '@/components/Navigation';
import { StoreInitializer } from '@/components/StoreInitializer';

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
        <AuthProvider>
          <SessionProvider>
            <StoreInitializer>
              <Navigation />
              <main className="container mx-auto p-4">
                {children}
              </main>
            </StoreInitializer>
          </SessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}