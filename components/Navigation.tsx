'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AcademicYearSelector } from './AcademicYearSelector';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  const { signOut, user } = useAuthStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isItqonOpen, setIsItqonOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const closeAllDropdowns = () => {
    setIsOpen(false);
    setIsPointsOpen(false);
    setIsBillingOpen(false);
    setIsItqonOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      closeAllDropdowns();
    }
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
    closeAllDropdowns();
  };

  const renderDropdown = (
    isOpen: boolean,
    setIsOpen: (value: boolean) => void,
    label: string,
    items: { href: string; label: string }[],
    icon?: string
  ) => (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-gray-300 flex items-center gap-1"
      >
        {label}
        {icon && <span className="text-xl">{icon}</span>}
        <span className="text-xs">▼</span>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            {items.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                  handleMobileLinkClick();
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMobileDropdown = (
    isOpen: boolean,
    setIsOpen: (value: boolean) => void,
    label: string,
    items: { href: string; label: string }[],
    icon?: string,
    isHighlighted?: boolean
  ) => (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center justify-between ${isHighlighted ? 'bg-blue-50 font-semibold' : ''}`}
      >
        <div className="flex items-center gap-2">
          {label}
          {icon && <span className="text-xl">{icon}</span>}
        </div>
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className={`${isHighlighted ? 'bg-blue-50' : 'bg-gray-50'}`}>
          {items.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={`block px-8 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isHighlighted ? 'font-medium' : ''}`}
              onClick={handleMobileLinkClick}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link href="/" className="hover:text-gray-300">Home</Link>
            
            {renderDropdown(
              isOpen,
              setIsOpen,
              'Master Data',
              [
                { href: '/academic-years', label: 'Academic Years' },
                { href: '/teachers', label: 'Teachers' },
                { href: '/classes', label: 'Classes' },
                { href: '/levels-management', label: 'Levels' },
                { href: '/students', label: 'Students' }
              ]
            )}

            <Link href="/groups" className="hover:text-gray-300 font-semibold">Groups</Link>
            <Link href="/badges" className="hover:text-gray-300">Badges</Link>
            
            {renderDropdown(
              isPointsOpen,
              setIsPointsOpen,
              'Points',
              [
                { href: '/points', label: 'Points' },
                { href: '/student-points', label: 'Student Points' }
              ]
            )}
            
            <Link href="/redeem" className="hover:text-gray-300">Redeem</Link>

            {renderDropdown(
              isItqonOpen,
              setIsItqonOpen,
              'Itqon',
              [
                { href: '/levels', label: 'Itqon Board' },
                { href: '/exam-management', label: 'Exam Management' },
                { href: '/itqon-exam', label: 'Itqon Exam' }
              ],
              '💥'
            )}

            {renderDropdown(
              isBillingOpen,
              setIsBillingOpen,
              'Billing',
              [
                { href: '/billing', label: 'Billing List' },
                { href: '/billing/settings', label: 'Billing Settings' }
              ],
              '💰'
            )}
          </div>

          {/* Mobile menu button and quick access */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={toggleMobileMenu}
              className="text-white hover:text-gray-300 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Link
                href="/groups"
                className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                <span className="text-lg">👥</span>
                <span className="font-semibold hidden sm:inline">Groups</span>
              </Link>
              <Link
                href="/levels"
                className="flex items-center gap-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors whitespace-nowrap"
              >
                <span className="text-lg">💥</span>
                <span className="font-semibold hidden sm:inline">Itqon</span>
              </Link>
              <Link
                href="/students"
                className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
              >
                <span className="text-lg">👨‍🎓</span>
                <span className="font-semibold hidden sm:inline">Students</span>
              </Link>
              <Link
                href="/itqon-exam"
                className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors whitespace-nowrap"
              >
                <span className="text-lg">📝</span>
                <span className="font-semibold hidden sm:inline">Exam</span>
              </Link>
              <Link
                href="/student-points"
                className="flex items-center gap-1 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap"
              >
                <span className="text-lg">⭐</span>
                <span className="font-semibold hidden sm:inline">Points</span>
              </Link>
              <Link
                href="/redeem"
                className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap"
              >
                <span className="text-lg">🎁</span>
                <span className="font-semibold hidden sm:inline">Redeem</span>
              </Link>
            </div>
          </div>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center space-x-4">
            <AcademicYearSelector />
            {user && (
              <button
                onClick={handleLogout}
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white text-gray-800">
            {/* Quick Access Buttons */}
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50">
              <Link
                href="/groups"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={handleMobileLinkClick}
              >
                <span className="text-lg">👥</span>
                <span className="font-semibold">Groups</span>
              </Link>
              <Link
                href="/levels"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                onClick={handleMobileLinkClick}
              >
                <span className="text-lg">💥</span>
                <span className="font-semibold">Itqon</span>
              </Link>
            </div>

            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={handleMobileLinkClick}
              >
                Home
              </Link>

              {renderMobileDropdown(
                isOpen,
                setIsOpen,
                'Master Data',
                [
                  { href: '/academic-years', label: 'Academic Years' },
                  { href: '/teachers', label: 'Teachers' },
                  { href: '/classes', label: 'Classes' },
                  { href: '/levels-management', label: 'Levels' },
                  { href: '/students', label: 'Students' }
                ]
              )}

              <Link
                href="/groups"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 bg-blue-50 font-semibold"
                onClick={handleMobileLinkClick}
              >
                Groups
              </Link>

              <Link
                href="/badges"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={handleMobileLinkClick}
              >
                Badges
              </Link>

              {renderMobileDropdown(
                isPointsOpen,
                setIsPointsOpen,
                'Points',
                [
                  { href: '/points', label: 'Points' },
                  { href: '/student-points', label: 'Student Points' }
                ]
              )}

              <Link
                href="/redeem"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={handleMobileLinkClick}
              >
                Redeem
              </Link>

              {renderMobileDropdown(
                isItqonOpen,
                setIsItqonOpen,
                'Itqon',
                [
                  { href: '/levels', label: 'Itqon Board' },
                  { href: '/exam-management', label: 'Exam Management' },
                  { href: '/itqon-exam', label: 'Itqon Exam' }
                ],
                '💥',
                true
              )}

              {renderMobileDropdown(
                isBillingOpen,
                setIsBillingOpen,
                'Billing',
                [
                  { href: '/billing', label: 'Billing List' },
                  { href: '/billing/settings', label: 'Billing Settings' }
                ],
                '💰'
              )}

              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="px-4">
                  <AcademicYearSelector />
                </div>
                <div className="mt-4 px-4">
                  {user && (
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}