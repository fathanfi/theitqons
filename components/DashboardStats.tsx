'use client';

import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { usePointsStore } from '@/store/pointsStore';
import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/SessionProvider';

export function DashboardStats() {
  const { currentAcademicYear } = useSession();
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  
  const teachers = useSchoolStore((state) => state.teachers);
  const groups = useSchoolStore((state) => state.groups);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const loadGroups = useSchoolStore((state) => state.loadGroups);
  
  const studentPoints = usePointsStore((state) => state.studentPoints);
  const loadStudentPoints = usePointsStore((state) => state.loadStudentPoints);

  useEffect(() => {
    loadStudents();
    loadTeachers();
    loadStudentPoints();
  }, [loadStudents, loadTeachers, loadStudentPoints]);

  useEffect(() => {
    if (currentAcademicYear) {
      loadGroups(currentAcademicYear.id);
    }
  }, [loadGroups, currentAcademicYear]);

  const totalPointsGiven = studentPoints.reduce((total, sp) => total + (sp.point?.point || 0), 0);
  const totalRedeemPoints = students.reduce((total, student) => 
    total + student.redemptions.reduce((sum, redemption) => sum + redemption.points, 0), 0);

  const menuItems = [
    { href: '/academic-years', label: 'Academic Years', icon: '📅' },
    { href: '/teachers', label: 'Teachers', icon: '👨‍🏫' },
    { href: '/classes', label: 'Classes', icon: '🏫' },
    { href: '/levels-management', label: 'Levels', icon: '📊' },
    { href: '/students', label: 'Students', icon: '👥' },
    { href: '/groups', label: 'Groups', icon: '👥' },
    { href: '/badges', label: 'Badges', icon: '🏆' },
    { href: '/points', label: 'Points', icon: '⭐' },
    { href: '/student-points', label: 'Student Points', icon: '📝' },
    { href: '/redeem', label: 'Redeem', icon: '🎁' },
    { href: '/levels', label: 'Itqon', icon: '📚' },
    { href: '/billing', label: 'Billing', icon: '💰' },
    { href: '/itqon-exam', label: 'Itqon Exam', icon: '📝' },
    { href: '/story-timeline', label: 'Story Timeline', icon: '📅' },
    { href: '/stories', label: 'Stories', icon: '📖' },
    { href: '/story-actions', label: 'Story Actions', icon: '🎯' },
    { href: '/school-settings', label: 'School Settings', icon: '⚙️' },
    { href: '/school-information', label: 'School Information', icon: '🏫' }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-2xl font-bold">{students.length}</div>
          <div className="text-gray-600">Total Students</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-2">👨‍🏫</div>
          <div className="text-2xl font-bold">{teachers.length}</div>
          <div className="text-gray-600">Total Teachers</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-2xl font-bold">{groups.length}</div>
          <div className="text-gray-600">Total Groups</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-2xl font-bold">{totalPointsGiven}</div>
          <div className="text-gray-600">Total Points Given</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-2">🎁</div>
          <div className="text-2xl font-bold">{totalRedeemPoints}</div>
          <div className="text-gray-600">Total Points Redeemed</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Quick Access Menu</h2>
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-3xl mb-2">{item.icon}</span>
              <span className="text-sm text-center text-gray-600">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}