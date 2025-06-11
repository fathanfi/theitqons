import { QurbanNavigation } from '@/components/qurban/navigation';

export default function QurbanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container flex h-16 items-center">
          <QurbanNavigation />
        </div>
      </div>
      <main>{children}</main>
    </div>
  );
} 