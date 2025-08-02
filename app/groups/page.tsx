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
import { ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useExamStore } from '@/store/examStore';
import { formatDate, generateWeeksFromAcademicYear, getWeekDates } from '@/lib/utils';
import { useAttendanceStore } from '@/store/attendanceStore';
import { AttendancePopup } from '@/components/AttendancePopup';

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
  const [showLevel, setShowLevel] = useState(true);
  const [showPoints, setShowPoints] = useState(false);
  const [studentPoints, setStudentPoints] = useState<{[key: string]: number}>({});
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const [showReportProgress, setShowReportProgress] = useState(false);
  const [reportSessionFilter, setReportSessionFilter] = useState<'ALL' | 1 | 2>('ALL');
  const [studentReports, setStudentReports] = useState<{ [studentId: string]: { [sessionId: number]: string } }>({});
  const [showBadges, setShowBadges] = useState(true);
  const [showLastExam, setShowLastExam] = useState(false);
  const [showAge, setShowAge] = useState(true);
  const [showProfilePicture, setShowProfilePicture] = useState(true);
  const [showAbsenceTemplate, setShowAbsenceTemplate] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [popupData, setPopupData] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    dayIndex: number;
    dayName: string;
    date: string;
    currentStatus?: 'present' | 'sick' | 'permit' | 'absent';
  } | null>(null);
  const [confirmationData, setConfirmationData] = useState<{
    isOpen: boolean;
    groupId: string;
    groupName: string;
    dayIndex: number;
    dayName: string;
    date: string;
    weekNumber: number;
    year: number;
  } | null>(null);
  const [isMarkingPresent, setIsMarkingPresent] = useState(false);
  const [theme, setTheme] = useState<'black' | 'light' | 'colorful'>('light');
  const [columnLayout, setColumnLayout] = useState<1 | 2 | 3>(1);
  const itqonExams = useExamStore((state) => state.itqonExams);
  const loadItqonExams = useExamStore((state) => state.loadItqonExams);
  
  // Attendance store
  const { 
    attendanceByWeek, 
    loadAttendanceByWeek, 
    upsertAttendance, 
    getAttendanceStatus,
    clearAttendanceData,
    isLoading: attendanceLoading,
    error: attendanceError 
  } = useAttendanceStore();

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

  // Set default selected week when academic year changes
  useEffect(() => {
    if (currentAcademicYear && !selectedWeek) {
      const weeks = generateWeeksFromAcademicYear(currentAcademicYear.startDate, currentAcademicYear.endDate);
      if (weeks.length > 0) {
        setSelectedWeek(weeks[0].label);
      }
    }
  }, [currentAcademicYear, selectedWeek]);



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

  const handleUpdate = (message?: string) => {
    setEditingGroup(undefined);
    setIsFormOpen(false);
    loadGroups(currentAcademicYear?.id || '');
    if (message) {
      setSuccessMessage(message);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    }
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

  // Load attendance data when week changes
  useEffect(() => {
    if (selectedWeek && currentAcademicYear && filteredGroups.length > 0) {
      const weekData = selectedWeek.split('-');
      const weekNumber = parseInt(weekData[0]);
      const year = parseInt(weekData[1]);
      
      // Clear existing data first
      clearAttendanceData();
      
      // Load attendance for all groups with a small delay to prevent overwhelming the database
      filteredGroups.forEach((group, index) => {
        setTimeout(() => {
          loadAttendanceByWeek(currentAcademicYear.id, group.id, weekNumber, year).catch(error => {
            console.error(`Error loading attendance for group ${group.id}:`, error);
          });
        }, index * 100); // 100ms delay between each request
      });
    }
  }, [selectedWeek, currentAcademicYear, filteredGroups.length]);

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

  const handleAbsenceClick = (studentId: string, studentName: string, dayIndex: number) => {
    if (!selectedWeek || !currentAcademicYear) return;
    
    const weekData = selectedWeek.split('-');
    const weekNumber = parseInt(weekData[0]);
    const year = parseInt(weekData[1]);
    
    const weekDates = getWeekDates(selectedWeek, currentAcademicYear.startDate, currentAcademicYear.endDate);
    if (!weekDates) return;
    
    const dateInfo = weekDates[dayIndex];
    
    const currentStatus = getAttendanceStatus(studentId, dayIndex);
    setPopupData({
      isOpen: true,
      studentId,
      studentName,
      dayIndex,
      dayName: dateInfo.day,
      date: dateInfo.date,
      currentStatus
    });
  };

  const handleAttendanceConfirm = async (status: 'present' | 'sick' | 'permit') => {
    if (!popupData || !selectedWeek || !currentAcademicYear) return;
    
    const weekData = selectedWeek.split('-');
    const weekNumber = parseInt(weekData[0]);
    const year = parseInt(weekData[1]);
    
    // Find the group that contains this student
    const studentGroup = filteredGroups.find(group => 
      group.students?.includes(popupData.studentId)
    );
    
    if (!studentGroup) {
      console.error('Student not found in any group');
      return;
    }
    
    try {
      await upsertAttendance({
        student_id: popupData.studentId,
        academic_year_id: currentAcademicYear.id,
        group_id: studentGroup.id,
        week_number: weekNumber,
        year: year,
        day_index: popupData.dayIndex,
        status: status
      });
      
      setSuccessMessage(`Kehadiran ${popupData.studentName} berhasil disimpan`);
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const handleMarkAllPresent = async (dayIndex: number) => {
    if (!selectedWeek || !currentAcademicYear) return;
    
    const weekData = selectedWeek.split('-');
    const weekNumber = parseInt(weekData[0]);
    const year = parseInt(weekData[1]);
    
    // Get all students from all filtered groups
    const allStudentIds = Array.from(new Set(
      filteredGroups.flatMap(group => group.students || [])
    ));
    
    if (allStudentIds.length === 0) {
      setSuccessMessage('No students found to mark as present');
      return;
    }
    
    try {
      // Mark all students as present for the specified day
      const attendancePromises = allStudentIds.map(async (studentId) => {
        // Find the group that contains this student
        const studentGroup = filteredGroups.find(group => 
          group.students?.includes(studentId)
        );
        
        if (!studentGroup) return;
        
        return upsertAttendance({
          student_id: studentId,
          academic_year_id: currentAcademicYear.id,
          group_id: studentGroup.id,
          week_number: weekNumber,
          year: year,
          day_index: dayIndex,
          status: 'present'
        });
      });
      
      await Promise.all(attendancePromises);
      
      const weekDates = getWeekDates(selectedWeek, currentAcademicYear.startDate, currentAcademicYear.endDate);
      const dayName = weekDates?.[dayIndex]?.day || `Day ${dayIndex + 1}`;
      const date = weekDates?.[dayIndex]?.date || '';
      
      setSuccessMessage(`All students marked as present for ${dayName}, ${date}`);
    } catch (error) {
      console.error('Error marking all students as present:', error);
      setSuccessMessage('Error marking students as present');
    }
  };

  const handleMarkGroupPresent = async (groupId: string, dayIndex: number) => {
    if (!selectedWeek || !currentAcademicYear) return;
    
    const weekData = selectedWeek.split('-');
    const weekNumber = parseInt(weekData[0]);
    const year = parseInt(weekData[1]);
    
    const group = filteredGroups.find(g => g.id === groupId);
    if (!group || !group.students || group.students.length === 0) {
      setSuccessMessage('No students found in this group');
      return;
    }
    
    const weekDates = getWeekDates(selectedWeek, currentAcademicYear.startDate, currentAcademicYear.endDate);
    const dayName = weekDates?.[dayIndex]?.day || `Day ${dayIndex + 1}`;
    const date = weekDates?.[dayIndex]?.date || '';
    
    // Show confirmation dialog
    setConfirmationData({
      isOpen: true,
      groupId,
      groupName: group.name,
      dayIndex,
      dayName,
      date,
      weekNumber,
      year
    });
  };

  const handleConfirmMarkGroupPresent = async () => {
    if (!confirmationData || !currentAcademicYear) return;
    
    setIsMarkingPresent(true);
    
    try {
      // Mark all students in this group as present for the specified day
      const group = filteredGroups.find(g => g.id === confirmationData.groupId);
      if (!group || !group.students) return;
      
      const attendancePromises = group.students.map(async (studentId) => {
        return upsertAttendance({
          student_id: studentId,
          academic_year_id: currentAcademicYear.id,
          group_id: confirmationData.groupId,
          week_number: confirmationData.weekNumber,
          year: confirmationData.year,
          day_index: confirmationData.dayIndex,
          status: 'present'
        });
      });
      
      await Promise.all(attendancePromises);
      
      setSuccessMessage(`All students in ${confirmationData.groupName} marked as present for ${confirmationData.dayName}, ${confirmationData.date} (Week ${confirmationData.weekNumber}, ${confirmationData.year})`);
    } catch (error) {
      console.error('Error marking group students as present:', error);
      setSuccessMessage('Error marking students as present');
    } finally {
      setIsMarkingPresent(false);
      setConfirmationData(null);
    }
  };

  const handleCancelMarkGroupPresent = () => {
    setConfirmationData(null);
  };



  // Theme utility functions
  const getGroupCardClasses = () => {
    switch (theme) {
      case 'light':
        return 'rounded-lg shadow-md p-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 border border-gray-200';
      case 'colorful':
        return 'rounded-lg shadow-md p-6 bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 text-white';
      default: // black
        return 'rounded-lg shadow-md p-6 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 text-white';
    }
  };

  const getTextClasses = (type: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
    switch (theme) {
      case 'light':
        switch (type) {
          case 'primary': return 'text-gray-900';
          case 'secondary': return 'text-gray-600';
          case 'tertiary': return 'text-gray-400';
        }
        break;
      case 'colorful':
        switch (type) {
          case 'primary': return 'text-white';
          case 'secondary': return 'text-purple-100';
          case 'tertiary': return 'text-pink-100';
        }
        break;
      default: // black
        switch (type) {
          case 'primary': return 'text-white';
          case 'secondary': return 'text-gray-300';
          case 'tertiary': return 'text-gray-400';
        }
    }
  };

  const getCheckboxClasses = () => {
    switch (theme) {
      case 'light':
        return 'w-6 h-6 rounded border-gray-400 bg-white text-indigo-600 focus:ring-indigo-500';
      case 'colorful':
        return 'w-6 h-6 rounded border-purple-300 bg-purple-100 text-purple-600 focus:ring-purple-500';
      default: // black
        return 'w-6 h-6 rounded border-gray-400 bg-gray-700 text-indigo-600 focus:ring-indigo-500';
    }
  };

  const getInputClasses = () => {
    switch (theme) {
      case 'light':
        return 'w-12 h-6 px-1 text-xs rounded border-gray-400 bg-white text-gray-900 placeholder-gray-500 focus:ring-indigo-500';
      case 'colorful':
        return 'w-12 h-6 px-1 text-xs rounded border-purple-300 bg-purple-100 text-purple-900 placeholder-purple-500 focus:ring-purple-500';
      default: // black
        return 'w-12 h-6 px-1 text-xs rounded border-gray-400 bg-gray-700 text-gray-300 placeholder-gray-500 focus:ring-indigo-500';
    }
  };

  const getSelectClasses = () => {
    switch (theme) {
      case 'light':
        return 'w-28 h-8 px-2 text-xs rounded border-gray-400 bg-white text-gray-900 focus:ring-indigo-500 focus:border-indigo-500';
      case 'colorful':
        return 'w-28 h-8 px-2 text-xs rounded border-purple-300 bg-purple-100 text-purple-900 focus:ring-purple-500 focus:border-purple-500';
      default: // black
        return 'w-28 h-8 px-2 text-xs rounded border-gray-400 bg-gray-700 text-gray-300 focus:ring-indigo-500 focus:border-indigo-500';
    }
  };

  const getGridClasses = () => {
    switch (columnLayout) {
      case 1:
        return 'grid grid-cols-1 gap-6';
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6';
    }
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

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {attendanceError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {attendanceError}
        </div>
      )}

      

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
            <div className="flex flex-wrap gap-2 sm:gap-4">
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
              <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showAbsenceTemplate}
                  onChange={(e) => setShowAbsenceTemplate(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Show Absence Template</span>
              </label>
              <div className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <span>Theme:</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'black' | 'light' | 'colorful')}
                  className="px-2 py-1 border rounded-md text-sm"
                >
                  <option value="black">Black</option>
                  <option value="light">Light</option>
                  <option value="colorful">Colorful</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
                <span>Columns:</span>
                <select
                  value={columnLayout}
                  onChange={(e) => setColumnLayout(Number(e.target.value) as 1 | 2 | 3)}
                  className="px-2 py-1 border rounded-md text-sm"
                >
                  <option value={1}>1 Column</option>
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                </select>
              </div>
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

      <div className={getGridClasses()}>
        {filteredGroups.map((group) => {
          const class_ = classes.find(c => c.id === group.classId);
          const teacher = useSchoolStore.getState().teachers.find(t => t.id === group.teacherId);
          const sortedStudents = getSortedStudents(group.students);
          const totalStudents = group.students?.length || 0;
          const visibleStudents = sortedStudents.length;

          return (
            <div key={group.id} className={getGroupCardClasses()}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  <p className={`text-sm ${getTextClasses('secondary')} flex items-center gap-2 flex-wrap`}>
                    {class_ ? class_.name : 'No Class'} • {teacher ? teacher.name : 'No Teacher'}
                    <span className={`text-xs ${theme === 'light' ? 'text-blue-600' : theme === 'colorful' ? 'text-yellow-200' : 'text-blue-300'} font-bold`}>• {visibleStudents}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(group)}
                    className={`${theme === 'light' ? 'text-indigo-600 hover:text-indigo-800' : theme === 'colorful' ? 'text-yellow-200 hover:text-yellow-100' : 'text-indigo-300 hover:text-indigo-100'} p-1`}
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className={`${theme === 'light' ? 'text-red-600 hover:text-red-800' : theme === 'colorful' ? 'text-red-200 hover:text-red-100' : 'text-red-400 hover:text-red-200'} p-1`}
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className={`font-medium ${getTextClasses('primary')}`}>Daftar Santri:</h4>
                  {showAbsenceTemplate && currentAcademicYear && (
                    <div className="flex flex-col gap-2">
                      {/* Week Selection */}
                      <div className="flex gap-2 items-center bg-opacity-10 p-2 rounded-md" style={{
                        backgroundColor: theme === 'light' ? 'rgba(99, 102, 241, 0.1)' : 
                                       theme === 'colorful' ? 'rgba(168, 85, 247, 0.2)' : 
                                       'rgba(75, 85, 99, 0.2)'
                      }}>
                        <span className={`text-sm font-medium ${getTextClasses('secondary')}`}>Pekan ke:</span>
                        <select
                          value={selectedWeek}
                          onChange={(e) => setSelectedWeek(e.target.value)}
                          className={getSelectClasses()}
                        >
                          <option value="">Pilih Pekan</option>
                          {generateWeeksFromAcademicYear(currentAcademicYear.startDate, currentAcademicYear.endDate).map((week) => (
                            <option key={week.label} value={week.label}>
                              {week.label}
                            </option>
                          ))}
                        </select>
                        {selectedWeek && (
                          <span className={`text-xs font-semibold ${theme === 'light' ? 'text-indigo-600' : theme === 'colorful' ? 'text-purple-200' : 'text-indigo-300'}`}>
                            Pekan {selectedWeek}
                          </span>
                        )}
                        {attendanceLoading && (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-indigo-600"></div>
                            <span className={`text-xs ${getTextClasses('tertiary')}`}>Loading...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Group Day Check Buttons */}
                {showAbsenceTemplate && selectedWeek && currentAcademicYear && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${getTextClasses('primary')}`}>
                        Mark all students in {group.name} as present for each day:
                      </span>
                    </div>
                    <div className="flex gap-2 items-end justify-end">
                      {getWeekDates(selectedWeek, currentAcademicYear.startDate, currentAcademicYear.endDate)?.map((dateInfo, dayIndex) => (
                        <button
                          key={dayIndex}
                          onClick={() => handleMarkGroupPresent(group.id, dayIndex)}
                          className="flex flex-col items-center gap-1 px-3 py-2 bg-white border border-blue-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors"
                          title={`Mark all students in ${group.name} as present for ${dateInfo.day}, ${dateInfo.date}`}
                        >
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          <span className="text-xs text-gray-600 font-medium">{dateInfo.day}</span>
                          <span className="text-xs text-gray-500">{dateInfo.date}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <ul className="space-y-1 min-w-max">
                  {sortedStudents.map((student, index) => {
                    const level = levels.find(l => l.id === student.level_id);
                    const points = studentPoints[student.id] || 0;
                    const age = calculateAge(student.dateOfBirth);
                    return (
                      <li 
                        key={student.id} 
                        className={`text-lg flex items-center gap-2 p-2 rounded ${columnLayout === 1 ? 'min-w-[800px]' : columnLayout === 2 ? 'min-w-[600px]' : 'min-w-[500px]'} ${
                          !student.status ? getTextClasses('tertiary') : getTextClasses('primary')
                        } ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}`}
                      >
                        <span className={`${getTextClasses('tertiary')} w-6`}>{index + 1}.</span>
                        {showProfilePicture && (
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                            {student.profilePicture ? (
                              <img
                                src={student.profilePicture}
                                alt={`${student.name} profile`}
                                className="w-12 h-12 object-cover"
                                onError={(e) => {
                                  // Fallback to default avatar if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-12 h-12 ${theme === 'light' ? 'bg-gradient-to-br from-blue-400 to-purple-500' : theme === 'colorful' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-purple-500'} flex items-center justify-center text-white text-2xl font-bold ${student.profilePicture ? 'hidden' : ''}`}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                        <span className={`${columnLayout === 1 ? 'w-[300px]' : columnLayout === 2 ? 'w-[200px]' : 'w-[150px]'} truncate`}>{student.name}</span>
                        {showAge && age !== null && (
                          <span className={`inline-flex items-center px-2 py-0.5 ml-2 rounded-full text-xs font-semibold shadow ${
                            theme === 'light' ? 'bg-yellow-200 text-yellow-900' : 
                            theme === 'colorful' ? 'bg-yellow-300 text-yellow-900' : 
                            'bg-yellow-200 text-yellow-900'
                          }`}>
                            {age} th
                          </span>
                        )}
                        {!student.status && (
                          <span className={`text-xs ${getTextClasses('tertiary')}`}>(Inactive)</span>
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
                          {/* Absence Template */}
                          {showAbsenceTemplate && selectedWeek && currentAcademicYear && (
                            <div className="flex ml-auto">
                              <div className="flex flex-col gap-3">
                                {/* Date Headers */}
                                <div className="flex gap-3">
                                  {getWeekDates(selectedWeek, currentAcademicYear.startDate, currentAcademicYear.endDate)?.map((dateInfo, dayIndex) => (
                                    <div key={dayIndex} className="flex flex-col items-center gap-0.5 bg-white rounded p-1">
                                      <span className={`text-xs ${getTextClasses('tertiary')} text-center`}>
                                        {dateInfo.day}, {dateInfo.date}
                                      </span>
                                      {(() => {
                                        try {
                                          const status = getAttendanceStatus(student.id, dayIndex);
                                          const getStatusIcon = () => {
                                            switch (status) {
                                              case 'present':
                                                return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
                                              case 'sick':
                                                return <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />;
                                              case 'permit':
                                                return <DocumentTextIcon className="w-4 h-4 text-blue-600" />;
                                              default:
                                                return <div className="w-4 h-4 border border-gray-300 rounded" />;
                                            }
                                          };
                                          
                                          const getButtonClasses = () => {
                                            switch (status) {
                                              case 'present':
                                                return "w-6 h-6 flex items-center justify-center rounded border-2 border-green-300 bg-green-50 hover:border-green-400 transition-colors";
                                              case 'sick':
                                                return "w-6 h-6 flex items-center justify-center rounded border-2 border-orange-300 bg-orange-50 hover:border-orange-400 transition-colors";
                                              case 'permit':
                                                return "w-6 h-6 flex items-center justify-center rounded border-2 border-blue-300 bg-blue-50 hover:border-blue-400 transition-colors";
                                              default:
                                                return "w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:border-gray-400 transition-colors";
                                            }
                                          };
                                          
                                          return (
                                            <button
                                              onClick={() => handleAbsenceClick(student.id, student.name, dayIndex)}
                                              className={getButtonClasses()}
                                              title={`${status === 'present' ? 'Hadir' : status === 'sick' ? 'Sakit' : status === 'permit' ? 'Izin' : 'Belum diisi'}`}
                                            >
                                              {getStatusIcon()}
                                            </button>
                                          );
                                        } catch (error) {
                                          console.error('Error rendering attendance status:', error);
                                          return (
                                            <button
                                              onClick={() => handleAbsenceClick(student.id, student.name, dayIndex)}
                                              className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:border-gray-400 transition-colors"
                                            >
                                              <div className="w-4 h-4 border border-gray-300 rounded" />
                                            </button>
                                          );
                                        }
                                      })()}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                      </li>
                    );
                  })}
                </ul>
                </div>
                {sortedStudents.length > 0 && (
                  <p className={`text-sm ${getTextClasses('secondary')} mt-2 font-semibold`}>
                    Total Students: {visibleStudents}
                    {!showInactive && totalStudents > visibleStudents && (
                      <span className={`ml-2 ${getTextClasses('tertiary')}`}>
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

      {/* Attendance Popup */}
      {popupData && (
        <AttendancePopup
          isOpen={popupData.isOpen}
          onClose={() => setPopupData(null)}
          onConfirm={handleAttendanceConfirm}
          studentName={popupData.studentName}
          dayName={popupData.dayName}
          date={popupData.date}
          currentStatus={popupData.currentStatus}
        />
      )}

      {/* Confirmation Popup */}
      {confirmationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm Mark All as Present
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to mark <strong>all students</strong> in group{' '}
                <strong>"{confirmationData.groupName}"</strong> as present for{' '}
                <strong>{confirmationData.dayName}, {confirmationData.date}</strong>?
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Week {confirmationData.weekNumber}, {confirmationData.year}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelMarkGroupPresent}
                disabled={isMarkingPresent}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkGroupPresent}
                disabled={isMarkingPresent}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isMarkingPresent && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isMarkingPresent ? 'Processing...' : 'Yes, Mark All as Present'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}