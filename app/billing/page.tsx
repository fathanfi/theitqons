'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useBillingStore } from '@/store/billingStore';
import { usePaymentStore } from '@/store/paymentStore';
import { useSession } from '@/components/SessionProvider';
import type { BillingRecord } from '@/store/billingStore';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';
import { ViewPaymentModal } from '@/components/ViewPaymentModal';
import { AddPaymentModal } from '@/components/AddPaymentModal';

const MONTHS = [
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'
];

export default function BillingPage() {
  const { currentAcademicYear } = useSession();
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  
  const classes = useSchoolStore((state) => state.classes);
  const levels = useSchoolStore((state) => state.levels);
  const groups = useSchoolStore((state) => state.groups);
  const teachers = useSchoolStore((state) => state.teachers);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadLevels = useSchoolStore((state) => state.loadLevels);
  const loadGroups = useSchoolStore((state) => state.loadGroups);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);

  const { settings, records, loadSettings, loadRecords, updateSingleRecord } = useBillingStore();
  const { payments, loadPayments } = usePaymentStore();
  
  // Track payment status for each student independently
  const [studentPaymentStatus, setStudentPaymentStatus] = useState<{[key: string]: boolean}>({});

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [showInactive, setShowInactive] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Billing state
  const [billingChecks, setBillingChecks] = useState<{[key: string]: boolean[]}>({});
  
  // Payment modals state
  const [viewPaymentModal, setViewPaymentModal] = useState<{isOpen: boolean; studentId: string; studentName: string}>({
    isOpen: false,
    studentId: '',
    studentName: ''
  });
  const [addPaymentModal, setAddPaymentModal] = useState<{isOpen: boolean; studentId: string; studentName: string}>({
    isOpen: false,
    studentId: '',
    studentName: ''
  });

  useEffect(() => {
    loadStudents();
    loadClasses();
    loadLevels();
    loadTeachers();
    if (currentAcademicYear) {
      loadSettings(currentAcademicYear.id);
      loadRecords(currentAcademicYear.id);
      loadGroups(currentAcademicYear.id);
    }
  }, [loadStudents, loadClasses, loadLevels, loadTeachers, currentAcademicYear, loadSettings, loadRecords, loadGroups]);

  // Check payment status for all students when students list changes
  useEffect(() => {
    const checkAllStudentPayments = async () => {
      for (const student of students) {
        await checkStudentPayments(student.id);
      }
    };
    
    if (students.length > 0) {
      checkAllStudentPayments();
    }
  }, [students]);
  
  // Fetch teacher ID when user changes
  useEffect(() => {
    const getTeacherId = async () => {
      if (user?.email) {
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (data && !error) {
          console.log('Found teacher ID:', data.id);
          setTeacherId(data.id);
        } else {
          console.error('Error fetching teacher ID:', error);
        }
      }
    };

    getTeacherId();
  }, [user?.email]);

  useEffect(() => {
    // Initialize billing checks from records
    const initialChecks = students.reduce((acc, student) => {
      acc[student.id] = Array(13).fill(false);
      return acc;
    }, {} as {[key: string]: boolean[]});

    // Update checks based on existing records
    (records as BillingRecord[]).forEach(record => {
      const studentId = record.studentId;
      const monthIndex = MONTHS.findIndex(m => {
        const [month, year] = record.month.split('-');
        return month === m && (
          (MONTHS.indexOf(month) <= 5 && year === settings?.startYear.toString()) ||
          (MONTHS.indexOf(month) >= 6 && year === settings?.endYear.toString())
        );
      });
      
      if (monthIndex !== -1 && initialChecks[studentId]) {
        initialChecks[studentId][monthIndex] = record.status === 'paid';
      }
    });

    setBillingChecks(initialChecks);
  }, [students, records, settings]);

  const handleCheckChange = async (studentId: string, index: number) => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    if (!currentAcademicYear || !settings) return;

    const newStatus = !billingChecks[studentId][index];
    const monthYear = getMonthYear(index);
    const recordId = `${studentId}-${monthYear}`;

    setIsUpdating(recordId);
    try {
      await updateSingleRecord({
        academicYearId: currentAcademicYear.id,
        studentId,
        month: monthYear,
        status: newStatus ? 'paid' : 'unpaid'
      });

      setBillingChecks(prev => ({
        ...prev,
        [studentId]: prev[studentId].map((check, i) => i === index ? newStatus : check)
      }));
    } catch (error) {
      console.error('Error updating billing record:', error);
      alert('Failed to update billing record');
    } finally {
      setIsUpdating(null);
    }
  };

  const calculateTotal = (studentId: string) => {
    const checks = billingChecks[studentId] || [];
    return checks.filter(Boolean).length * (settings?.monthlyPrice || 0);
  };

  const calculateTotalBilled = (studentId: string) => {
    const total = calculateTotal(studentId);
    return (settings?.billingTarget || 0) - total;
  };

  const calculateStatus = (studentId: string) => {
    const total = calculateTotal(studentId);
    const percentage = (total / (settings?.billingTarget || 1)) * 100;
    return percentage >= (settings?.targetPercentage || 0) ? 'Completed' : 'Incomplete';
  };

  const getMonthYear = (index: number) => {
    if (!settings) return MONTHS[index];
    const year = index <= 5 ? settings.startYear : settings.endYear;
    return `${MONTHS[index]}-${year}`;
  };

  const checkStudentPayments = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('id')
        .eq('student_id', studentId)
        .limit(1);
      
      if (error) throw error;
      
      const hasPayments = data && data.length > 0;
      setStudentPaymentStatus(prev => ({
        ...prev,
        [studentId]: hasPayments
      }));
      
      return hasPayments;
    } catch (error) {
      console.error('Error checking student payments:', error);
      return false;
    }
  };

  const hasPayments = (studentId: string) => {
    return studentPaymentStatus[studentId] || false;
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || student.class_id === selectedClass;
    const matchesLevel = !selectedLevel || student.level_id === selectedLevel;
    const matchesStatus = showInactive || student.status;

    // If user is a teacher, only show students from their groups
    if (isTeacher && teacherId) {
      // Get all groups for this teacher
      const teacherGroups = groups.filter(g => g.teacherId === teacherId);
      
      // If no groups found for this teacher, show no students
      if (teacherGroups.length === 0) {
        return false;
      }

      // Get all student IDs from the teacher's groups
      const teacherStudentIds = teacherGroups.flatMap(g => g.students || []);
      
      // Check if the student is in any of the teacher's groups
      const isInTeacherGroup = teacherStudentIds.includes(student.id);
      
      return matchesSearch && matchesClass && matchesLevel && matchesStatus && isInTeacherGroup;
    }

    // For admin users, filter by selected teacher if any
    if (selectedTeacher) {
      const teacherGroups = groups.filter(g => g.teacherId === selectedTeacher);
      const teacherStudentIds = teacherGroups.flatMap(g => g.students || []);
      const isInTeacherGroup = teacherStudentIds.includes(student.id);
      return matchesSearch && matchesClass && matchesLevel && matchesStatus && isInTeacherGroup;
    }

    return matchesSearch && matchesClass && matchesLevel && matchesStatus;
  });

  // Add debug logging for the final filtered students
  console.log('Filtered students:', filteredStudents);

  if (!settings) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Billing Management</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-center text-gray-500">Please configure billing settings first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Billing Management</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 mr-2 h-5 w-5"
              />
              Show Inactive Students
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Classes</option>
              {classes.map(class_ => (
                <option key={class_.id} value={class_.id}>
                  {class_.name}
                </option>
              ))}
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>

            {isAdmin && (
              <Select
                value={teachers.find(t => t.id === selectedTeacher) ? {
                  value: selectedTeacher,
                  label: teachers.find(t => t.id === selectedTeacher)?.name || ''
                } : null}
                onChange={(option) => setSelectedTeacher(option?.value || '')}
                options={[
                  { value: '', label: 'All Teachers' },
                  ...teachers.map(teacher => ({
                    value: teacher.id,
                    label: teacher.name
                  }))
                ]}
                isClearable
                placeholder="Select Teacher"
                className="w-full"
                classNamePrefix="select"
              />
            )}
          </div>
        </div>

        {/* Billing Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                {Array.from({ length: 13 }, (_, i) => (
                  <th key={i} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {getMonthYear(i)}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Billed</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student, index) => (
                <tr key={student.id} className={!student.status ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${
                        hasPayments(student.id) 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`} title={
                        hasPayments(student.id) 
                          ? 'Has payment records' 
                          : 'No payment records'
                      }></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setViewPaymentModal({
                          isOpen: true,
                          studentId: student.id,
                          studentName: student.name
                        })}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Pembayaran"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setAddPaymentModal({
                          isOpen: true,
                          studentId: student.id,
                          studentName: student.name
                        })}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                        title="Tambah Pembayaran"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  {Array.from({ length: 13 }, (_, i) => {
                    const recordId = `${student.id}-${getMonthYear(i)}`;
                    return (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={billingChecks[student.id]?.[i] || false}
                          onChange={() => handleCheckChange(student.id, i)}
                          className={`rounded border-gray-300 shadow-sm focus:ring focus:ring-opacity-50 h-5 w-5 ${
                            billingChecks[student.id]?.[i]
                              ? 'bg-green-500 text-white border-green-500 hover:bg-green-600'
                              : 'bg-white text-gray-400 border-gray-300 hover:bg-gray-50'
                          } ${
                            isUpdating === recordId ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    Rp {calculateTotal(student.id).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    Rp {calculateTotalBilled(student.id).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      calculateStatus(student.id) === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {calculateStatus(student.id)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modals */}
      <ViewPaymentModal
        isOpen={viewPaymentModal.isOpen}
        onClose={() => setViewPaymentModal({ isOpen: false, studentId: '', studentName: '' })}
        studentId={viewPaymentModal.studentId}
        studentName={viewPaymentModal.studentName}
        onPaymentUpdate={() => {
          loadPayments();
          // Refresh payment status for all students
          students.forEach(student => checkStudentPayments(student.id));
        }}
      />
      
      <AddPaymentModal
        isOpen={addPaymentModal.isOpen}
        onClose={() => setAddPaymentModal({ isOpen: false, studentId: '', studentName: '' })}
        studentId={addPaymentModal.studentId}
        studentName={addPaymentModal.studentName}
        onSuccess={() => {
          loadPayments();
          // Refresh payment status for all students
          students.forEach(student => checkStudentPayments(student.id));
        }}
      />
    </div>
  );
}