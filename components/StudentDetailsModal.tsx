'use client';

import { useState, useEffect } from 'react';
import { Student } from '@/types/student';
import { supabase } from '@/lib/supabase';
import { XMarkIcon, EyeIcon, AcademicCapIcon, ChartBarIcon, StarIcon, GiftIcon, UserGroupIcon, DocumentTextIcon, CreditCardIcon, ClockIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

interface StudentDetails {
  personal: Student;
  level?: any;
  class?: any;
  badges: any[];
  points: number;
  groups: any[];
  exams: any[];
  billing: any[];
  upgradeHistory: any[];
  activityLogs: any[];
}

export function StudentDetailsModal({ isOpen, onClose, student }: StudentDetailsModalProps) {
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      loadStudentDetails();
    }
  }, [isOpen, student]);

  const loadStudentDetails = async () => {
    if (!student) return;
    
    setLoading(true);
    try {
      // Load all related data in parallel
      const [
        levelData,
        classData,
        badgesData,
        pointsData,
        groupsData,
        examsData,
        billingData,
        upgradeHistoryData,
        activityLogsData
      ] = await Promise.all([
        // Level information
        student.level_id ? supabase
          .from('levels')
          .select('*')
          .eq('id', student.level_id)
          .single() : Promise.resolve({ data: null }),
        
        // Class information
        student.class_id ? supabase
          .from('classes')
          .select('*')
          .eq('id', student.class_id)
          .single() : Promise.resolve({ data: null }),
        
        // Badges
        supabase
          .from('student_badges')
          .select(`
            *,
            badges (*)
          `)
          .eq('student_id', student.id),
        
        // Points
        supabase
          .from('student_total_points')
          .select('total_points')
          .eq('student_id', student.id)
          .single(),
        
        // Groups
        supabase
          .from('groups')
          .select(`
            *,
            classes (name),
            teachers (name)
          `)
          .contains('students', [student.id]),
        
        // ITQON Exams
        supabase
          .from('itqon_exams')
          .select(`
            *,
            exams (name)
          `)
          .eq('student_id', student.id)
          .order('exam_date', { ascending: false }),
        
        // Billing records
        supabase
          .from('billing_records')
          .select('*')
          .eq('student_id', student.id)
          .order('month', { ascending: false }),
        
        // Upgrade history
        supabase
          .from('student_upgrade_history')
          .select('*')
          .eq('student_id', student.id)
          .order('date', { ascending: false }),
        
        // Activity logs
        supabase
          .from('activity_logs')
          .select('*')
          .eq('student_id', student.id)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      // Get all levels and classes for upgrade history mapping
      const [allLevels, allClasses] = await Promise.all([
        supabase.from('levels').select('id, name'),
        supabase.from('classes').select('id, name')
      ]);

      // Create lookup maps for levels and classes
      const levelMap = new Map(allLevels.data?.map(level => [level.id, level.name]) || []);
      const classMap = new Map(allClasses.data?.map(class_ => [class_.id, class_.name]) || []);

      setDetails({
        personal: student,
        level: levelData.data,
        class: classData.data,
        badges: badgesData.data || [],
        points: pointsData.data?.total_points || 0,
        groups: groupsData.data || [],
        exams: examsData.data || [],
        billing: billingData.data || [],
        upgradeHistory: (upgradeHistoryData.data || []).map(upgrade => ({
          ...upgrade,
          from_name: upgrade.from_id ? (upgrade.type === 'level' ? levelMap.get(upgrade.from_id) : classMap.get(upgrade.from_id)) : 'None',
          to_name: upgrade.type === 'level' ? levelMap.get(upgrade.to_id) : classMap.get(upgrade.to_id)
        })),
        activityLogs: activityLogsData.data || []
      });
    } catch (error) {
      console.error('Error loading student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string | null | undefined): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <EyeIcon className="h-6 w-6 text-blue-600" />
            Student Details: {student.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading student details...</p>
          </div>
        ) : details ? (
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5" />
                Personal Information
              </h3>
              
              {/* Profile Picture Section */}
              {(details.personal.profile_picture || details.personal.profilePicture) && (
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src={details.personal.profile_picture || details.personal.profilePicture}
                      alt={`${details.personal.name}'s Profile Picture`}
                      className="w-48 h-48 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-blue-700">Full Name:</span>
                  <p className="text-blue-900 font-semibold">{details.personal.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Gender:</span>
                  <p className="text-blue-900">{details.personal.gender}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Age:</span>
                  <p className="text-blue-900">
                    {calculateAge(details.personal.dateOfBirth) ? `${calculateAge(details.personal.dateOfBirth)} years` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Date of Birth:</span>
                  <p className="text-blue-900">{details.personal.dateOfBirth ? formatDate(details.personal.dateOfBirth) : '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Place of Birth:</span>
                  <p className="text-blue-900">{details.personal.placeOfBirth || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Phone Number:</span>
                  <p className="text-blue-900">{details.personal.phoneNumber || '-'}</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-sm font-medium text-blue-700">Address:</span>
                  <p className="text-blue-900">{details.personal.address || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Father's Name:</span>
                  <p className="text-blue-900">{details.personal.father_name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Mother's Name:</span>
                  <p className="text-blue-900">{details.personal.mother_name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Guardian's Name:</span>
                  <p className="text-blue-900">{details.personal.wali_name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Registration Number:</span>
                  <p className="text-blue-900 font-mono">{details.personal.registration_number || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">National ID:</span>
                  <p className="text-blue-900">{details.personal.national_id || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Family ID:</span>
                  <p className="text-blue-900">{details.personal.family_id || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Joined Date:</span>
                  <p className="text-blue-900">{details.personal.joined_date ? formatDate(details.personal.joined_date) : '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-700">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    details.personal.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {details.personal.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="text-sm font-medium text-blue-700">Notes:</span>
                  <p className="text-blue-900">{details.personal.notes || '-'}</p>
                </div>
              </div>
            </div>

            {/* Level & Class Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Level Information
                </h3>
                {details.level ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-green-700">Level Name:</span>
                      <p className="text-green-900 font-semibold">{details.level.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-green-700">Description:</span>
                      <p className="text-green-900">{details.level.description || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-green-700">Order:</span>
                      <p className="text-green-900">{details.level.order || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-green-700">No level assigned</p>
                )}
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5" />
                  Class Information
                </h3>
                {details.class ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-purple-700">Class Name:</span>
                      <p className="text-purple-900 font-semibold">{details.class.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-purple-700">Description:</span>
                      <p className="text-purple-900">{details.class.description || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-purple-700">Schedule:</span>
                      <p className="text-purple-900">{details.class.schedule || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-purple-700">No class assigned</p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                <StarIcon className="h-5 w-5" />
                Badges ({details.badges.length})
              </h3>
              {details.badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {details.badges.map((badge, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <div className="text-3xl mb-2">{badge.badges?.icon || '🏆'}</div>
                      <div className="text-sm font-medium text-yellow-900">{badge.badges?.description || 'Badge'}</div>
                      <div className="text-xs text-yellow-700 mt-1">
                        {badge.assigned_at ? formatDate(badge.assigned_at) : 'Recently awarded'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-yellow-700">No badges earned yet</p>
              )}
            </div>

            {/* Points */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-pink-900 mb-4 flex items-center gap-2">
                <GiftIcon className="h-5 w-5" />
                Points Information
              </h3>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-center">
                  <div className="text-4xl font-bold text-pink-900 mb-2">{details.points}</div>
                  <div className="text-pink-700">Total Points Earned</div>
                </div>
              </div>
            </div>

            {/* Groups */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5" />
                Group Memberships ({details.groups.length})
              </h3>
              {details.groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {details.groups.map((group, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="font-semibold text-indigo-900">{group.name}</div>
                      <div className="text-sm text-indigo-700">
                        Class: {group.classes?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-indigo-700">
                        Teacher: {group.teachers?.name || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-indigo-700">Not assigned to any groups</p>
              )}
            </div>

            {/* ITQON Exams */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5" />
                ITQON Exams ({details.exams.length})
              </h3>
              {details.exams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {details.exams.map((exam, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-teal-900">{exam.exams?.name || 'ITQON Exam'}</div>
                          <div className="text-sm text-teal-700">
                            Date: {exam.exam_date ? formatDate(exam.exam_date) : 'N/A'}
                          </div>
                          <div className="text-sm text-teal-700">
                            Status: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              exam.status === 'Passed' ? 'bg-green-100 text-green-800' :
                              exam.status === 'Failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {exam.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-teal-900">{exam.score || 'N/A'}</div>
                          <div className="text-xs text-teal-600">Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-teal-700">No exams taken yet</p>
              )}
            </div>

            {/* Billing Records */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" />
                Billing Records ({details.billing.length})
              </h3>
              {details.billing.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {details.billing.map((record, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="font-semibold text-orange-900">{record.month}</div>
                      <div className="text-sm text-orange-700">
                        Status: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-orange-700">No billing records found</p>
              )}
            </div>

            {/* Upgrade History */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Upgrade History ({details.upgradeHistory.length})
              </h3>
              {details.upgradeHistory.length > 0 ? (
                <div className="space-y-3">
                  {details.upgradeHistory.map((upgrade, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-emerald-900 capitalize">{upgrade.type} Upgrade</div>
                          <div className="text-sm text-emerald-700">
                            From: {upgrade.from_name || 'None'} → To: {upgrade.to_name || 'Unknown'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-emerald-600">{formatDate(upgrade.date)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-700">No upgrade history</p>
              )}
            </div>

            {/* Activity Logs */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-5 w-5" />
                Recent Activity Logs ({details.activityLogs.length})
              </h3>
              {details.activityLogs.length > 0 ? (
                <div className="space-y-3">
                  {details.activityLogs.map((log, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{log.message}</div>
                          <div className="text-sm text-gray-600 capitalize">
                            Action: {log.action_type?.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700">No activity logs found</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
} 