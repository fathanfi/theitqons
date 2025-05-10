'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Loading() {
  const [fillHeight, setFillHeight] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading');

  useEffect(() => {
    // Loading text animation
    const textInterval = setInterval(() => {
      setLoadingText(prev => {
        if (prev === 'Loading...') return 'Loading';
        return prev + '.';
      });
    }, 500);

    // Water filling animation
    const fillInterval = setInterval(() => {
      setFillHeight(prev => {
        if (prev >= 100) {
          clearInterval(fillInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => {
      clearInterval(textInterval);
      clearInterval(fillInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center">
      <div className="relative w-40 h-40 mb-8">
        <Image
          src="/images/itqon-logo.png"
          alt="ITQON Logo"
          fill
          className="object-contain"
          priority
        />
        <div 
          className="absolute bottom-0 left-0 w-full bg-blue-500 transition-all duration-300 ease-in-out"
          style={{ 
            height: `${fillHeight}%`,
            opacity: 0.3,
            borderRadius: '0 0 50% 50%',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
          }}
        />
      </div>
      <div className="text-2xl font-semibold text-gray-600 animate-pulse">
        {loadingText}
      </div>
    </div>
  );
} 