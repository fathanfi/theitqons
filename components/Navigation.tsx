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
  const [isStoriesOpen, setIsStoriesOpen] = useState(false);
  const [isQurbankuOpen, setIsQurbankuOpen] = useState(false);
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
    setIsStoriesOpen(false);
    setIsQurbankuOpen(false);
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
    <div className="relative group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="hover:text-gray-300 flex items-center gap-1"
      >
        {label}
        {icon && <span className="text-xl">{icon}</span>}
        <span className="text-xs">▼</span>
      </button>
      <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
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

  const quickAccessItems = [
    { href: '/groups', label: 'Groups', icon: '👥', bg: 'bg-blue-500' },
    { href: '/levels', label: 'Itqon', icon: '💥', bg: 'bg-purple-400' },
    { href: '/itqon-exam', label: 'Itqon Exam', icon: '📝', bg: 'bg-green-500' },
    { href: '/student-points', label: 'Points', icon: '⭐', bg: 'bg-yellow-400' },
    { href: '/redeem', label: 'Redeem', icon: '🎁', bg: 'bg-blue-600' },
    { href: '/billing', label: 'Billing', icon: '💰', bg: 'bg-red-500' },
    { href: '/student-reports', label: 'Reports', icon: '📝', bg: 'bg-green-500' }
  ];

  // Filter quick access items based on user role
  const filteredQuickAccessItems = quickAccessItems.filter(item => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'teacher') {
      return ['/groups', '/levels', '/student-points', '/redeem', '/billing', '/student-reports'].includes(item.href);
    }
    if (user.role === 'user') {
      return ['/groups', '/levels'].includes(item.href);
    }
    return false;
  });

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <div className="lg:hidden">
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
          </div>

          {/* Quick Access Menu - Mobile */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto p-1">
            {filteredQuickAccessItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center w-12 h-12 rounded-lg shadow ${item.bg} hover:opacity-80 transition-opacity`}
                style={{ minWidth: 48 }}
              >
                <span className="text-3xl">{item.icon}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link href="/" className="hover:text-gray-300">Home</Link>
            
            {/* Master Data - Admin only */}
            {user?.role === 'admin' && renderDropdown(
              isOpen,
              setIsOpen,
              'Master Data',
              [
                { href: '/academic-years', label: 'Academic Years' },
                { href: '/teachers', label: 'Teachers' },
                { href: '/classes', label: 'Classes' },
                { href: '/levels-management', label: 'Levels' },
                { href: '/students', label: 'Students' },
                { href: '/registration-management', label: 'Registration Management' },
                { href: '/school-settings', label: 'School Settings' },
                { href: '/school-information', label: 'School Information' }
              ]
            )}

            {/* Groups - All users */}
            <Link href="/students" className="hover:text-gray-300 font-semibold">Students</Link>

            <Link href="/groups" className="hover:text-gray-300 font-semibold">Groups</Link>

            {/* Badges - Admin and Teacher */}
            {(user?.role === 'admin' || user?.role === 'teacher') && (
              <Link href="/badges" className="hover:text-gray-300">Badges</Link>
            )}

            {/* Reports - Admin and Teacher */}
            {(user?.role === 'admin' || user?.role === 'teacher') && (
              <Link href="/student-reports" className="hover:text-gray-300">Reports</Link>
            )}
            
            {/* Points - Admin and Teacher */}
            {(user?.role === 'admin' || user?.role === 'teacher') && renderDropdown(
              isPointsOpen,
              setIsPointsOpen,
              'Points',
              [
                { href: '/points', label: 'Points' },
                { href: '/student-points', label: 'Student Points' }
              ]
            )}
            
            {/* Redeem - Admin and Teacher */}
            {(user?.role === 'admin' || user?.role === 'teacher') && (
              <Link href="/redeem" className="hover:text-gray-300">Redeem</Link>
            )}

            {/* Itqon - All users */}
            {renderDropdown(
              isItqonOpen,
              setIsItqonOpen,
              'Itqon',
              user?.role === 'admin' ? [
                { href: '/levels', label: 'Itqon Board' },
                { href: '/exam-management', label: 'Exam Management' },
                { href: '/itqon-exam', label: 'Itqon Exam' }
              ] : [
                { href: '/levels', label: 'Itqon Board' }
              ],
              '💥'
            )}

            {/* Qurbanku - All users */}
            {renderDropdown(
              isQurbankuOpen,
              setIsQurbankuOpen,
              'Qurbanku',
              [
                { href: '/qurban/my-qurban', label: 'My Qurban' },
                { href: '/qurban/editions', label: 'Edisi Qurban' },
                { href: '/qurban/animals', label: 'Hewan Qurban' },
                { href: '/qurban/sedekah', label: 'Sedekah' },
                { href: '/qurban/operasional', label: 'Operasional' }
              ],
              '🐐'
            )}

            {/* Billing - Admin and Teacher */}
            {(user?.role === 'admin' || user?.role === 'teacher') && renderDropdown(
              isBillingOpen,
              setIsBillingOpen,
              'Billing',
              user?.role === 'admin' ? [
                { href: '/billing', label: 'Billing' },
                { href: '/billing/settings', label: 'Settings' }
              ] : [
                { href: '/billing', label: 'Billing' }
              ]
            )}

            {/* Stories - All users */}
            {renderDropdown(
              isStoriesOpen,
              setIsStoriesOpen,
              'Stories',
              user?.role === 'admin' ? [
                { href: '/session-stories', label: 'Session Stories' },
                { href: '/stories', label: 'Stories' },
                { href: '/story-actions', label: 'Story Actions' },
                { href: '/story-timeline', label: 'Story Timeline' }
              ] : [
                { href: '/story-timeline', label: 'Story Timeline' }
              ],
              '📚'
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center space-x-4">
            {user?.role === 'admin' && <AcademicYearSelector />}
            {user && (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-white hover:text-gray-200">
                  <span>{user.name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white text-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Quick Access Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4">
                {filteredQuickAccessItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 ${item.bg} text-white rounded-lg hover:opacity-80 transition-colors text-sm sm:text-base md:text-lg`}
                    onClick={handleMobileLinkClick}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Regular Menu Items */}
              <Link
                href="/"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={handleMobileLinkClick}
              >
                Home
              </Link>

              {/* Master Data - Admin only */}
              {user?.role === 'admin' && renderMobileDropdown(
                isOpen,
                setIsOpen,
                'Master Data',
                [
                  { href: '/academic-years', label: 'Academic Years' },
                  { href: '/teachers', label: 'Teachers' },
                  { href: '/classes', label: 'Classes' },
                  { href: '/levels-management', label: 'Levels' },
                  { href: '/students', label: 'Students' },
                  { href: '/registration-management', label: 'Registration Management' },
                  { href: '/school-settings', label: 'School Settings' },
                  { href: '/school-information', label: 'School Information' }
                ]
              )}

              {/* Groups - All users */}
              <Link
                href="/groups"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={handleMobileLinkClick}
              >
                Groups
              </Link>

              {/* Badges - Admin and Teacher */}
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <Link
                  href="/badges"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={handleMobileLinkClick}
                >
                  Badges
                </Link>
              )}

              {/* Reports - Admin and Teacher */}
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <Link
                  href="/student-reports"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={handleMobileLinkClick}
                >
                  Reports
                </Link>
              )}

              {/* Points - Admin and Teacher */}
              {(user?.role === 'admin' || user?.role === 'teacher') && renderMobileDropdown(
                isPointsOpen,
                setIsPointsOpen,
                'Points',
                [
                  { href: '/points', label: 'Points' },
                  { href: '/student-points', label: 'Student Points' }
                ]
              )}

              {/* Redeem - Admin and Teacher */}
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <Link
                  href="/redeem"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={handleMobileLinkClick}
                >
                  Redeem
                </Link>
              )}

              {/* Itqon - All users */}
              {renderMobileDropdown(
                isItqonOpen,
                setIsItqonOpen,
                'Itqon',
                user?.role === 'admin' ? [
                  { href: '/levels', label: 'Itqon Board' },
                  { href: '/exam-management', label: 'Exam Management' },
                  { href: '/itqon-exam', label: 'Itqon Exam' }
                ] : [
                  { href: '/levels', label: 'Itqon Board' }
                ],
                '💥',
                true
              )}

              {/* Qurbanku - All users */}
              {renderMobileDropdown(
                isQurbankuOpen,
                setIsQurbankuOpen,
                'Qurbanku',
                [
                  { href: '/qurban/my-qurban', label: 'My Qurban' },
                  { href: '/qurban/editions', label: 'Edisi Qurban' },
                  { href: '/qurban/animals', label: 'Hewan Qurban' },
                  { href: '/qurban/sedekah', label: 'Sedekah' },
                  { href: '/qurban/operasional', label: 'Operasional' }
                ],
                '🐐',
                true
              )}

              {/* Billing - Admin and Teacher */}
              {(user?.role === 'admin' || user?.role === 'teacher') && renderMobileDropdown(
                isBillingOpen,
                setIsBillingOpen,
                'Billing',
                user?.role === 'admin' ? [
                  { href: '/billing', label: 'Billing' },
                  { href: '/billing/settings', label: 'Settings' }
                ] : [
                  { href: '/billing', label: 'Billing' }
                ]
              )}

              {/* Stories - All users */}
              {renderMobileDropdown(
                isStoriesOpen,
                setIsStoriesOpen,
                'Stories',
                user?.role === 'admin' ? [
                  { href: '/session-stories', label: 'Session Stories' },
                  { href: '/stories', label: 'Stories' },
                  { href: '/story-actions', label: 'Story Actions' },
                  { href: '/story-timeline', label: 'Story Timeline' }
                ] : [
                  { href: '/story-timeline', label: 'Story Timeline' }
                ],
                '📚'
              )}

              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="px-4">
                  {user?.role === 'admin' && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-800">Academic Year:</label>
                      <div className="w-full">
                        <AcademicYearSelector />
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 px-4">
                  {user && (
                    <>
                      <Link
                        href="/profile"
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={handleMobileLinkClick}
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </>
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