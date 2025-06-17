"use client";

import { useState, useEffect } from "react";
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/authStore';
import Select from 'react-select';
import { supabase } from '@/lib/supabase';

const SESSIONS = [
  { id: 1, name: '1' },
  { id: 2, name: '2' },
];

interface StudentReport {
  id: string;
  student_id: string;
  meta_values: {
    ziyadah: {
      adab: { predicate: string; description: string };
      murajaah: { predicate: string; description: string };
      tahsin: { predicate: string; description: string };
      target: { predicate: string; description: string };
    };
    score: Array<{ name: string; tahfidz_score: string; tahsin_score: string; customName: string }>;
    attendance: { present: number; permit: number; absence: number };
  };
}

// Add this after the existing interfaces
const PREDICATE_SCORES: Record<string, number> = {
  'Mumtaz': 95,
  'Jayyid Jiddan': 85,
  'Jayyid': 75,
  'Dhoif': 60,
  'Naqis': 50,
  'Maqbul': 40
};

export default function ViewAllReports() {
  const { user } = useAuthStore();
  const [teacherId, setTeacherId] = useState<string>('');
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  // Add expanded row state
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  // Set default sort to total score descending
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: 'total',
    direction: 'desc'
  });

  // Section 1: Selectors
  const academicYears = useSchoolStore((state) => state.academicYears);
  const loadAcademicYears = useSchoolStore((state) => state.loadAcademicYears);
  const classes = useSchoolStore((state) => state.classes);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  const groups = useSchoolStore((state) => state.groups);
  const loadGroups = useSchoolStore((state) => state.loadGroups);

  const [academicYear, setAcademicYear] = useState<string>('90943225-94d0-450c-a163-dfb68ebf4f34');
  const [sessionId, setSessionId] = useState<number>(2); // Fixed to SM2
  const [classId, setClassId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');

  // Fetch teacher ID when user changes
  useEffect(() => {
    const fetchTeacherId = async () => {
      if (user?.email) {
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (data && !error) {
          setTeacherId(data.id);
        }
      }
    };

    fetchTeacherId();
  }, [user?.email]);

  // Load initial data
  useEffect(() => {
    loadAcademicYears();
    loadClasses();
    loadStudents();
  }, [loadAcademicYears, loadClasses, loadStudents]);

  // Load groups when academic year changes
  useEffect(() => {
    if (academicYear) {
      loadGroups(academicYear);
    }
  }, [academicYear, loadGroups]);

  // Set active academic year on load
  useEffect(() => {
    const activeYear = academicYears.find(y => y.status);
    if (activeYear) {
      setAcademicYear(activeYear.id);
    }
  }, [academicYears]);

  // Student search filter
  const filteredStudents = students.filter((s) => {
    // If user is a teacher, only show their students
    if (user?.role === 'teacher') {
      // Get all groups for this teacher using the correct teacher ID
      const teacherGroups = groups.filter(g => g.teacherId === teacherId);
      
      // If no groups found for this teacher, show no students
      if (teacherGroups.length === 0) {
        return false;
      }

      // Get all student IDs from the teacher's groups
      const teacherStudentIds = teacherGroups.flatMap(g => g.students || []);
      
      // If class is selected, only show students from that class
      if (classId) {
        return s.class_id === classId && teacherStudentIds.includes(s.id);
      }
      
      // If no class selected, show all students from teacher's groups
      return teacherStudentIds.includes(s.id);
    }
    
    // For admins, show all students but filter by class if selected
    if (user?.role === 'admin') {
      return !classId || s.class_id === classId;
    }
    
    // For other roles, show no students
    return false;
  });

  const studentOptions = filteredStudents.map(student => ({
    value: student.id,
    label: student.name
  }));

  // Load reports when filters change
  useEffect(() => {
    const loadReports = async () => {
      if (!academicYear || !sessionId) return;

      setLoading(true);
      let query = supabase
        .from('student_reports')
        .select('*')
        .eq('academic_year_id', academicYear)
        .eq('session_id', sessionId);

      // For teachers, only show reports for their students
      if (user?.role === 'teacher') {
        const teacherGroups = groups.filter(g => g.teacherId === teacherId);
        const teacherStudentIds = teacherGroups.flatMap(g => g.students || []);
        query = query.in('student_id', teacherStudentIds);
      }

      if (classId) {
        const classStudents = students.filter(s => s.class_id === classId).map(s => s.id);
        query = query.in('student_id', classStudents);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading reports:', error);
        return;
      }

      setReports(data || []);
      setLoading(false);
    };

    loadReports();
  }, [academicYear, sessionId, classId, studentId, students, user?.role, teacherId, groups]);

  // Calculate attendance percentage
  const calculateAttendancePercentage = (attendance: { present: number; permit: number; absence: number }) => {
    const total = attendance.present + attendance.permit + attendance.absence;
    return total > 0 ? Math.round((attendance.present / total) * 100) : 0;
  };

  // Format score information
  const formatScoreInfo = (scores: Array<{ name: string; tahfidz_score: string; tahsin_score: string; customName: string }>) => {
    return scores.map(score => {
      const name = score.name === 'CUSTOM' ? score.customName : score.name;
      return `${name}: ${score.tahfidz_score}/${score.tahsin_score}`;
    }).join(', ');
  };

  // Add this new function to calculate average score
  const calculateAverageScore = (scores: Array<{ name: string; tahfidz_score: string; tahsin_score: string; customName: string }>) => {
    const allScores: number[] = [];
    
    scores.forEach(score => {
      // Add tahfidz score if it exists
      if (score.tahfidz_score && PREDICATE_SCORES[score.tahfidz_score]) {
        allScores.push(PREDICATE_SCORES[score.tahfidz_score]);
      }
      // Add tahsin score if it exists
      if (score.tahsin_score && PREDICATE_SCORES[score.tahsin_score]) {
        allScores.push(PREDICATE_SCORES[score.tahsin_score]);
      }
    });

    if (allScores.length === 0) return '-';
    
    const average = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    return average.toFixed(2);
  };

  // Add this new function to calculate ziyadah score
  const calculateZiyadahScore = (ziyadah: {
    adab: { predicate: string; description: string };
    murajaah: { predicate: string; description: string };
    tahsin: { predicate: string; description: string };
    target: { predicate: string; description: string };
  }) => {
    const scores = [
      PREDICATE_SCORES[ziyadah.adab.predicate] || 0,
      PREDICATE_SCORES[ziyadah.murajaah.predicate] || 0,
      PREDICATE_SCORES[ziyadah.tahsin.predicate] || 0,
      PREDICATE_SCORES[ziyadah.target.predicate] || 0
    ].filter(score => score > 0);

    if (scores.length === 0) return '-';
    return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2);
  };

  // Add this new function to calculate total score
  const calculateTotalScore = (
    ziyadah: {
      adab: { predicate: string; description: string };
      murajaah: { predicate: string; description: string };
      tahsin: { predicate: string; description: string };
      target: { predicate: string; description: string };
    },
    attendance: { present: number; permit: number; absence: number },
    scores: Array<{ name: string; tahfidz_score: string; tahsin_score: string; customName: string }>
  ) => {
    const ziyadahScore = calculateZiyadahScore(ziyadah);
    const attendanceScore = attendance.present;
    const averageScore = calculateAverageScore(scores);

    if (ziyadahScore === '-' || averageScore === '-') return '-';

    const total = (Number(ziyadahScore) + attendanceScore + Number(averageScore)) / 3;
    return total.toFixed(2);
  };

  // Add sorting function
  const sortReports = (reports: StudentReport[]) => {
    if (!sortConfig.key) return reports;

    return [...reports].sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (sortConfig.key) {
        case 'attendance':
          aValue = a.meta_values.attendance.present;
          bValue = b.meta_values.attendance.present;
          break;
        case 'ziyadah':
          aValue = Number(calculateZiyadahScore(a.meta_values.ziyadah)) || 0;
          bValue = Number(calculateZiyadahScore(b.meta_values.ziyadah)) || 0;
          break;
        case 'exam':
          aValue = Number(calculateAverageScore(a.meta_values.score)) || 0;
          bValue = Number(calculateAverageScore(b.meta_values.score)) || 0;
          break;
        case 'total':
          aValue = Number(calculateTotalScore(
            a.meta_values.ziyadah,
            a.meta_values.attendance,
            a.meta_values.score
          )) || 0;
          bValue = Number(calculateTotalScore(
            b.meta_values.ziyadah,
            b.meta_values.attendance,
            b.meta_values.score
          )) || 0;
          break;
        default:
          return 0;
      }

      if (aValue === bValue) return 0;
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Add sort handler
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Add sort indicator component
  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return (
      <span className="ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-8">
      {/* Add navigation buttons at the top */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => window.location.href = '/student-reports'}
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Add/Refine Report
        </button>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-4">All Student Reports</h1>

      {/* Filters */}
      <div className="bg-white rounded shadow p-4 flex flex-col md:flex-row gap-4 items-start md:items-center flex-wrap">
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium">Academic Year</label>
          <select 
            value={academicYear} 
            onChange={e => setAcademicYear(e.target.value)} 
            className="mt-1 block w-full md:w-auto border rounded px-2 py-1"
            disabled
          >
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>
                {y.name} {y.status ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium">Session</label>
          <select 
            value={sessionId} 
            onChange={e => setSessionId(Number(e.target.value))} 
            className="mt-1 block w-full md:w-auto border rounded px-2 py-1"
            disabled
          >
            {SESSIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium">Class</label>
          <select 
            value={classId} 
            onChange={e => setClassId(e.target.value)} 
            className="mt-1 block w-full md:w-auto border rounded px-2 py-1"
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium">Student</label>
          <Select
            options={studentOptions}
            value={studentOptions.find(option => option.value === studentId)}
            onChange={(selected) => setStudentId(selected?.value || '')}
            className="mt-1"
            placeholder="Search and select student..."
            isClearable
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adab</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Murajaah</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahsin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('attendance')}
              >
                Attendance <SortIndicator columnKey="attendance" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scores</th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ziyadah')}
              >
                Ziyadah Score <SortIndicator columnKey="ziyadah" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('exam')}
              >
                Exam Score <SortIndicator columnKey="exam" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total')}
              >
                Total Score <SortIndicator columnKey="total" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-4 text-center text-sm text-gray-500">
                  No reports found
                </td>
              </tr>
            ) : (
              sortReports(reports).map((report, index) => {
                const student = students.find(s => s.id === report.student_id);
                const averageScore = calculateAverageScore(report.meta_values.score);
                const ziyadahScore = calculateZiyadahScore(report.meta_values.ziyadah);
                const totalScore = calculateTotalScore(
                  report.meta_values.ziyadah,
                  report.meta_values.attendance,
                  report.meta_values.score
                );
                const isExpanded = expandedRow === report.id;

                return (
                  <>
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.meta_values.ziyadah.adab.predicate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.meta_values.ziyadah.murajaah.predicate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.meta_values.ziyadah.tahsin.predicate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.meta_values.ziyadah.target.predicate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.meta_values.attendance.present}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : report.id)}
                          className="text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ziyadahScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {averageScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {totalScore}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900">Score Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {report.meta_values.score.map((score, idx) => (
                                <div key={idx} className="bg-white p-4 rounded shadow">
                                  <h5 className="font-medium text-gray-900 mb-2">
                                    {score.name === 'CUSTOM' ? score.customName : score.name}
                                  </h5>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Tahfidz:</span>
                                      <span className="font-medium">{score.tahfidz_score}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Tahsin:</span>
                                      <span className="font-medium">{score.tahsin_score}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => window.location.href = `/student-reports?studentId=${report.student_id}`}
                                className="text-blue-600 hover:text-blue-800 focus:outline-none"
                              >
                                View Full Report →
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 