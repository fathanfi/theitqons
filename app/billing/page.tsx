'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useBillingStore } from '@/store/billingStore';
import { useSession } from '@/components/SessionProvider';

const MONTHS = [
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'
];

export default function BillingPage() {
  const { currentAcademicYear } = useSession();
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  
  const teachers = useSchoolStore((state) => state.teachers);
  const classes = useSchoolStore((state) => state.classes);
  const levels = useSchoolStore((state) => state.levels);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadLevels = useSchoolStore((state) => state.loadLevels);

  const { settings, records, loadSettings, loadRecords, saveBillingRecords } = useBillingStore();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [showInactive, setShowInactive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Billing state
  const [billingChecks, setBillingChecks] = useState<{[key: string]: boolean[]}>({});

  useEffect(() => {
    loadStudents();
    loadTeachers();
    loadClasses();
    loadLevels();
    if (currentAcademicYear) {
      loadSettings(currentAcademicYear.id);
      loadRecords(currentAcademicYear.id);
    }
  }, [loadStudents, loadTeachers, loadClasses, loadLevels, currentAcademicYear, loadSettings, loadRecords]);

  useEffect(() => {
    // Initialize billing checks from records
    const initialChecks = students.reduce((acc, student) => {
      acc[student.id] = Array(13).fill(false);
      return acc;
    }, {} as {[key: string]: boolean[]});

    // Update checks based on existing records
    records.forEach(record => {
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

  const handleCheckChange = (studentId: string, index: number) => {
    setBillingChecks(prev => ({
      ...prev,
      [studentId]: prev[studentId].map((check, i) => i === index ? !check : check)
    }));
  };

  const handleSave = async () => {
    if (!currentAcademicYear || !settings) return;

    setIsSaving(true);
    try {
      const records = [];
      for (const [studentId, checks] of Object.entries(billingChecks)) {
        checks.forEach((isChecked, index) => {
          const monthYear = getMonthYear(index);
          records.push({
            academicYearId: currentAcademicYear.id,
            studentId,
            month: monthYear,
            status: isChecked ? 'paid' : 'unpaid'
          });
        });
      }

      await saveBillingRecords(records);
      alert('Billing records saved successfully!');
    } catch (error) {
      console.error('Error saving billing records:', error);
      alert('Failed to save billing records');
    } finally {
      setIsSaving(false);
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

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || student.class === selectedClass;
    const matchesLevel = !selectedLevel || student.level === selectedLevel;
    const matchesTeacher = !selectedTeacher || student.teacher === selectedTeacher;
    const matchesStatus = showInactive || student.status;
    return matchesSearch && matchesClass && matchesLevel && matchesTeacher && matchesStatus;
  });

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing Management</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`${
            isSaving 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center gap-2`}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

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
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 mr-2"
              />
              Show Inactive Students
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option key={level.id} value={level.name}>
                  {level.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Billing Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
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
                  {Array.from({ length: 13 }, (_, i) => (
                    <td key={i} className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={billingChecks[student.id]?.[i] || false}
                        onChange={() => handleCheckChange(student.id, i)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </td>
                  ))}
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
    </div>
  );
}