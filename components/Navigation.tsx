'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AcademicYearSelector } from './AcademicYearSelector';
import { useState } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <Link href="/" className="hover:text-gray-300">Home</Link>
            
            {/* Master Data Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="hover:text-gray-300 flex items-center gap-1"
              >
                Master Data
                <span className="text-xs">▼</span>
              </button>
              {isOpen && (
                <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu">
                    <Link 
                      href="/academic-years" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Academic Years
                    </Link>
                    <Link 
                      href="/teachers" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Teachers
                    </Link>
                    <Link 
                      href="/classes" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Classes
                    </Link>
                    <Link 
                      href="/levels-management" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Levels
                    </Link>
                    <Link 
                      href="/students" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      Students
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/groups" className="hover:text-gray-300">Groups</Link>
            <Link href="/badges" className="hover:text-gray-300">Badges</Link>
            
            {/* Points Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsPointsOpen(!isPointsOpen)}
                className="hover:text-gray-300 flex items-center gap-1"
              >
                Points
                <span className="text-xs">▼</span>
              </button>
              {isPointsOpen && (
                <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu">
                    <Link 
                      href="/points" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsPointsOpen(false)}
                    >
                      Points
                    </Link>
                    <Link 
                      href="/student-points" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsPointsOpen(false)}
                    >
                      Student Points
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <Link href="/redeem" className="hover:text-gray-300">Redeem</Link>
            <Link href="/levels" className="hover:text-gray-300 flex items-center gap-1">
              Itqon
              <span className="text-xl">💥</span>
            </Link>

            {/* Billing Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsBillingOpen(!isBillingOpen)}
                className="hover:text-gray-300 flex items-center gap-1"
              >
                Billing
                <span className="text-xl">💰</span>
                <span className="text-xs">▼</span>
              </button>
              {isBillingOpen && (
                <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu">
                    <Link 
                      href="/billing" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsBillingOpen(false)}
                    >
                      Billing List
                    </Link>
                    <Link 
                      href="/billing/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsBillingOpen(false)}
                    >
                      Billing Settings
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AcademicYearSelector />
          </div>
        </div>
      </div>
    </nav>
  );
}