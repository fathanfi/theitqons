'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function RouteLoader() {
  const [loading, setLoading] = useState(false);
  const [fill, setFill] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    setFill(0);
    const interval = setInterval(() => {
      setFill((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    // Simulate loading for 600ms or until fill is 100
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-white z-[100]">
      <div className="absolute left-1/2 flex flex-col items-center" style={{ top: '20vh', transform: 'translateX(-50%)' }}>
        <div className="relative w-24 h-24 mb-3">
          <Image
            src="/images/itqon-logo.png"
            alt="ITQON Logo"
            fill
            className="object-contain pointer-events-none select-none z-10"
            priority
          />
        </div>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden border border-blue-200 shadow-sm relative">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
            style={{ width: `${fill}%` }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-700 font-semibold">{fill}%</span>
        </div>
      </div>
    </div>
  );
} 