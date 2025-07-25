'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { Group } from '@/types/school';
import { Student } from '@/types/student';
import { useSession } from '@/components/SessionProvider';
import { GroupForm } from '@/components/GroupForm';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';
import { CheckCircleIcon, ExclamationCircleIcon, MinusCircleIcon } from '@heroicons/react/24/solid';
import { useExamStore } from '@/store/examStore';
import { formatDate } from '@/lib/utils';

export default function GroupsPage() {
  const { currentAcademicYear } = useSession();
  const router = useRouter();
  const groups = useSchoolStore((state) => state.groups);
  const loadGroups = useSchoolStore((state) => state.loadGroups);
  const classes = useSchoolStore((state) => state.classes);
  const students = useStore((state) => state.students);
  const levels = useSchoolStore((state) => state.levels);
  const academicYears = useSchoolStore((state) => state.academicYears);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const loadAcademicYears = useSchoolStore((state) => state.loadAcademicYears);
  const loadLevels = useSchoolStore((state) => state.loadLevels);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('ALL');
  const [studentSortOrder, setStudentSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState(false);
  const [showLevel, setShowLevel] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const [studentPoints, setStudentPoints] = useState<{[key: string]: number}>({});
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const [showReportProgress, setShowReportProgress] = useState(false);
  const [reportSessionFilter, setReportSessionFilter] = useState<'ALL' | 1 | 2>('ALL');
  const [studentReports, setStudentReports] = useState<{ [studentId: string]: { [sessionId: number]: string } }>({});
  const [showBadges, setShowBadges] = useState(false);
  const [showLastExam, setShowLastExam] = useState(false);
  const [showAge, setShowAge] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const itqonExams = useExamStore((state) => state.itqonExams);
  const loadItqonExams = useExamStore((state) => state.loadItqonExams);

  useEffect(() => {
    if (currentAcademicYear) {
      loadGroups(currentAcademicYear.id);
      loadClasses();
      loadTeachers();
      loadAcademicYears();
      loadLevels();
      loadStudentPoints();
      loadItqonExams();
    }
  }, [currentAcademicYear, loadGroups, loadClasses, loadTeachers, loadAcademicYears, loadLevels, loadItqonExams]);

  const loadStudentPoints = async () => {
    const { data } = await supabase
      .from('student_total_points')
      .select('*');
    
    if (data) {
      const points = data.reduce((acc: {[key: string]: number}, curr) => {
        acc[curr.student_id] = curr.total_points;
        return acc;
      }, {});
      setStudentPoints(points);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }

    if (confirm('Are you sure you want to delete this group?')) {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('Error deleting group:', error);
        return;
      }

      loadGroups(currentAcademicYear?.id || '');
    }
  };

  const handleEdit = (group: Group) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    setEditingGroup(group);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    setIsFormOpen(true);
  };

  const handleUpdate = () => {
    setEditingGroup(undefined);
    setIsFormOpen(false);
    loadGroups(currentAcademicYear?.id || '');
  };

  // Filter groups based on search query and selected class
  const filteredGroups = groups.filter(group => {
    const matchesSearch = searchQuery === '' || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.students || []).some(studentId => {
        const student = students.find(s => s.id === studentId);
        return student?.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    
    const matchesClass = selectedClass === 'ALL' || group.classId === selectedClass;
    const matchesAcademicYear = selectedAcademicYear === 'ALL' || group.academicYearId === selectedAcademicYear;
    
    return matchesSearch && matchesClass && matchesAcademicYear;
  });

  // Sort students within each group
  const getSortedStudents = (studentIds: string[] = []) => {
    return studentIds
      .map(id => students.find(s => s.id === id))
      .filter((student): student is Student => student !== undefined)
      .filter(student => showInactive || student.status)
      .sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return studentSortOrder === 'asc' ? comparison : -comparison;
      });
  };

  // Fetch student_reports for all students in filtered groups when showReportProgress is enabled
  useEffect(() => {
    const fetchReports = async () => {
      if (!showReportProgress || !currentAcademicYear) return;
      const studentIds = Array.from(new Set(filteredGroups.flatMap(g => g.students)));
      if (studentIds.length === 0) return;
      const { data, error } = await supabase
        .from('student_reports')
        .select('student_id, session_id, completion_status')
        .eq('academic_year_id', currentAcademicYear.id)
        .in('student_id', studentIds);
      if (error) return;
      // Map: { studentId: { sessionId: completion_status } }
      const reports: { [studentId: string]: { [sessionId: number]: string } } = {};
      data.forEach((r: any) => {
        if (!reports[r.student_id]) reports[r.student_id] = {};
        reports[r.student_id][r.session_id] = r.completion_status;
      });
      setStudentReports(reports);
    };
    fetchReports();
  }, [showReportProgress, filteredGroups, currentAcademicYear]);

  const getLatestExam = (studentId: string) => {
    const studentExams = itqonExams
      .filter(exam => exam.studentId === studentId)
      .sort((a, b) => {
        const dateDiff = new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        // If examDate is the same, sort by id (descending)
        if (b.id > a.id) return 1;
        if (b.id < a.id) return -1;
        return 0;
      });
    return studentExams[0];
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

  if (!currentAcademicYear) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Please select an academic year first</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add New Group
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <input
              type="text"
              placeholder="Search groups or students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
            <div className="flex items-left gap-4flex flex-col gap-4 sm:flex-row sm:items-left">
              <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Inactive</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showLevel}
                  onChange={(e) => setShowLevel(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Level</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showPoints}
                  onChange={(e) => setShowPoints(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Points</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showReportProgress}
                  onChange={(e) => setShowReportProgress(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Report Progress</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showBadges}
                  onChange={(e) => setShowBadges(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Badges</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showLastExam}
                  onChange={(e) => setShowLastExam(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Last Exam</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showAge}
                  onChange={(e) => setShowAge(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Age</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showProfilePicture}
                  onChange={(e) => setShowProfilePicture(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Profile Picture</span>
              </label>
              {showReportProgress && (
                <select
                  value={reportSessionFilter}
                  onChange={e => setReportSessionFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) as 1 | 2)}
                  className="px-2 py-1 border rounded-md text-sm"
                >
                  <option value="ALL">All</option>
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="ALL">All Academic Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.status ? '(Active)' : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-4">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="ALL">All Classes</option>
                {classes.map(class_ => (
                  <option key={class_.id} value={class_.id}>
                    {class_.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setStudentSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className={`px-4 py-2 rounded whitespace-nowrap ${
                  studentSortOrder === 'asc' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'
                }`}
              >
                Sort Students {studentSortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <GroupForm
              editGroup={editingGroup}
              onUpdate={handleUpdate}
            />
            <button
              onClick={() => {
                setIsFormOpen(false);
                setEditingGroup(undefined);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => {
          const class_ = classes.find(c => c.id === group.classId);
          const teacher = useSchoolStore.getState().teachers.find(t => t.id === group.teacherId);
          const sortedStudents = getSortedStudents(group.students);
          const totalStudents = group.students?.length || 0;
          const visibleStudents = sortedStudents.length;

          return (
            <div key={group.id} className="rounded-lg shadow-md p-6 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  <p className="text-sm text-gray-300 flex items-center gap-2 flex-wrap">
                    {class_ ? class_.name : 'No Class'} • {teacher ? teacher.name : 'No Teacher'}
                    <span className="text-xs text-blue-300 font-bold">• {visibleStudents}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(group)}
                    className="text-indigo-300 hover:text-indigo-100 p-1"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="text-red-400 hover:text-red-200 p-1"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-200">Students:</h4>
                <ul className="space-y-1">
                  {sortedStudents.map((student, index) => {
                    const level = levels.find(l => l.id === student.level_id);
                    const points = studentPoints[student.id] || 0;
                    const age = calculateAge(student.dateOfBirth);
                    return (
                      <li 
                        key={student.id} 
                        className={`text-lg flex items-center gap-2 ${
                          !student.status ? 'text-gray-400' : 'text-gray-100'
                        }`}
                      >
                        <span className="text-gray-400 w-6">{index + 1}.</span>
                        {showProfilePicture && (
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                            {student.profilePicture ? (
                              <img
                                src={student.profilePicture}
                                alt={`${student.name} profile`}
                                className="w-5 h-5 object-cover"
                                onError={(e) => {
                                  // Fallback to default avatar if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold ${student.profilePicture ? 'hidden' : ''}`}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                        <span>{student.name}</span>
                        {showAge && age !== null && (
                          <span className="inline-flex items-center px-2 py-0.5 ml-2 rounded-full text-lg font-semibold bg-yellow-200 text-yellow-900 shadow">
                            {age} th
                          </span>
                        )}
                        {!student.status && (
                          <span className="text-xs text-gray-400">(Inactive)</span>
                        )}
                        <div className="flex items-center gap-2">
                          {showLevel && level && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-md">
                              {level.name}
                            </span>
                          )}
                          {showPoints && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                              {points} pts
                            </span>
                          )}
                          {showBadges && student.badges.length > 0 && (
                            <div className="flex gap-1">
                              {student.badges.map(badge => (
                                <span key={badge.id} className="px-2 py-0.5 rounded-full text-xl font-bold text-white shadow-md" title={badge.description}>
                                  {badge.icon}
                                </span>
                              ))}
                            </div>
                          )}
                          {showLastExam && (
                            <span className="flex items-center gap-1">
                              {(() => {
                                const latestExam = getLatestExam(student.id);
                                if (!latestExam) return null;
                                return (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md" title={`${latestExam.exam?.name} - ${formatDate(latestExam.examDate)}`}>
                                    {latestExam.exam?.name
                                      .split(' ')
                                      .slice(0, 2)
                                      .join(' ')}
                                  </span>
                                );
                              })()}
                            </span>
                          )}
                          {/* Report Progress Icons */}
                          {showReportProgress && (
                            <span className="flex items-center gap-1">
                              {(['ALL', 1, 2] as const)
                                .filter(sessionId => reportSessionFilter === 'ALL' ? sessionId !== 'ALL' : sessionId === reportSessionFilter)
                                .map(sessionId => {
                                  if (sessionId === 'ALL') return null;
                                  const status = studentReports[student.id]?.[sessionId] || 'empty';
                                  if (status === 'complete') {
                                    return <CheckCircleIcon key={sessionId} className="w-4 h-4 text-green-400" title={`Semester ${sessionId}: Complete`} />;
                                  } else if (status === 'incomplete') {
                                    return <ExclamationCircleIcon key={sessionId} className="w-4 h-4 text-yellow-400" title={`Semester ${sessionId}: Incomplete`} />;
                                  } else {
                                    return <MinusCircleIcon key={sessionId} className="w-4 h-4 text-gray-400" title={`Semester ${sessionId}: Empty`} />;
                                  }
                                })}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {sortedStudents.length > 0 && (
                  <p className="text-sm text-gray-300 mt-2 font-semibold">
                    Total Students: {visibleStudents}
                    {!showInactive && totalStudents > visibleStudents && (
                      <span className="ml-2 text-gray-400">
                        ({totalStudents - visibleStudents} inactive hidden)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}