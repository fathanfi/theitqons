'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { usePointsStore } from '@/store/pointsStore';
import { useSession } from '@/components/SessionProvider';
import { ActivityLog } from './ActivityLog';
import { supabase } from '@/lib/supabase';
import { useActivityLogStore } from '@/store/activityLogStore';
import Link from 'next/link';
import { ActivitySplash } from './ActivitySplash';
import { ActivityLog as ActivityLogType } from '@/types/activity';

const shimmer = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

export function DashboardStats() {
  const { currentAcademicYear } = useSession();
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  const [isLoading, setIsLoading] = useState(true);
  
  const teachers = useSchoolStore((state) => state.teachers);
  const groups = useSchoolStore((state) => state.groups);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const loadGroups = useSchoolStore((state) => state.loadGroups);

  const studentPoints = usePointsStore((state) => state.studentPoints);
  const loadStudentPoints = usePointsStore((state) => state.loadStudentPoints);
  const { loadLogs, logs } = useActivityLogStore();

  const [splashActivity, setSplashActivity] = useState<ActivityLogType | null>(null);
  const lastActivityIdRef = useRef<string | null>(null);
  const [activityCount, setActivityCount] = useState(0);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          loadStudents(),
          loadTeachers(),
          loadStudentPoints(),
          loadLogs()
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadStudents, loadTeachers, loadStudentPoints, loadLogs]);

  useEffect(() => {
    if (currentAcademicYear) {
      loadGroups(currentAcademicYear.id);
    }
  }, [loadGroups, currentAcademicYear]);

  // Set up real-time subscription for activity logs
  useEffect(() => {
    console.log('Setting up realtime subscription...');
    
    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',  // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          console.log('Realtime payload received:', payload);
          if (payload.eventType === 'INSERT') {
            loadLogs();
            if (payload.new && payload.new.id !== lastActivityIdRef.current) {
              setSplashActivity(payload.new as ActivityLogType);
              lastActivityIdRef.current = payload.new.id;
            }
            setActivityCount(prev => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Initial count fetch
    const fetchInitialCount = async () => {
      const { count } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true });
      console.log('Initial activity count:', count);
      setActivityCount(count || 0);
    };

    fetchInitialCount();

    return () => {
      console.log('Cleaning up subscription...');
      supabase.removeChannel(channel);
    };
  }, [loadLogs]);

  const handleRefresh = async () => {
    await loadLogs();
  };

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

  const formatActivityMessage = (activity: ActivityLogType) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year} at ${hours}:${minutes}`;
    };

    if (activity.action_type === 'itqon_exam_created' || activity.action_type === 'itqon_exam_updated') {
      const metadata = activity.metadata || {};
      return `Itqon Exam created for ${metadata.student_name || 'Unknown Student'} on ${metadata.exam_name || 'Unknown Exam'} at ${formatDate(activity.created_at)}. Currently status is ${metadata.status || 'Scheduled'}`;
    }
    return activity.message;
  };

  if (isLoading) {
    return (
      <>
        <style>{shimmer}</style>
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg overflow-hidden relative">
                <div className="h-8 w-8 bg-gray-200 rounded mb-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded mb-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                </div>
                <div className="h-4 w-24 bg-gray-200 rounded relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg overflow-hidden relative">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(18)].map((_, index) => (
                <div key={index} className="flex flex-col items-center p-4">
                  <div className="h-8 w-8 bg-gray-200 rounded-full mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                  </div>
                  <div className="h-4 w-20 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg overflow-hidden relative">
            <div className="flex justify-between items-center mb-4">
              <div className="h-8 w-48 bg-gray-200 rounded relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="h-6 w-32 bg-gray-200 rounded mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                  </div>
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg overflow-hidden relative">
            <div className="h-6 w-32 bg-gray-200 rounded mb-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-8">
      <ActivitySplash activity={splashActivity} onClose={() => setSplashActivity(null)} />
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

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Activities</h2>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        <ActivityLog />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-700">Total Activities</h3>
        <p className="text-3xl font-bold text-indigo-600">{activityCount}</p>
      </div>
    </div>
  );
}