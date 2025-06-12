'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Edisi Qurban',
    href: '/qurban/editions',
  },
  {
    name: 'Hewan Qurban',
    href: '/qurban/animals',
  },
  {
    name: 'My Qurban',
    href: '/qurban/my-qurban',
  },
  {
    name: 'Sedekah',
    href: '/qurban/sedekah',
  },
  {
    name: 'Operasional',
    href: '/qurban/operasional',
  },
];

export function QurbanNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-4 lg:space-x-6">
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
} 