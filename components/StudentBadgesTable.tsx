'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { Student, Badge } from '@/types/student';
import Select from 'react-select';

interface StudentBadgeRecord {
  id: string;
  studentName: string;
  className: string;
  badgeIcon: string;
  badgeDescription: string;
  assignedAt: string;
}

export function StudentBadgesTable() {
  const students = useStore((state) => state.students);
  const classes = useSchoolStore((state) => state.classes);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  
  const [filteredRecords, setFilteredRecords] = useState<StudentBadgeRecord[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [badgeFilter, setBadgeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Process students with badges into table records
  useEffect(() => {
    const records: StudentBadgeRecord[] = [];
    
    students.forEach(student => {
      if (student.badges && student.badges.length > 0) {
        student.badges.forEach(badge => {
          const className = classes.find(c => c.id === student.class_id)?.name || 'N/A';
          records.push({
            id: `${student.id}-${badge.id}`,
            studentName: student.name,
            className: className,
            badgeIcon: badge.icon,
            badgeDescription: badge.description,
            assignedAt: badge.assigned_at || new Date().toISOString()
          });
        });
      }
    });

    // Sort by assigned date (newest first)
    records.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    
    setFilteredRecords(records);
  }, [students, classes]);

  // Apply filters
  useEffect(() => {
    let filtered = students.flatMap(student => {
      if (student.badges && student.badges.length > 0) {
        return student.badges.map(badge => {
          const className = classes.find(c => c.id === student.class_id)?.name || 'N/A';
          return {
            id: `${student.id}-${badge.id}`,
            studentName: student.name,
            className: className,
            badgeIcon: badge.icon,
            badgeDescription: badge.description,
            assignedAt: badge.assigned_at || new Date().toISOString()
          };
        });
      }
      return [];
    });

    // Apply name filter
    if (nameFilter) {
      filtered = filtered.filter(record => 
        record.studentName.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Apply class filter
    if (classFilter) {
      filtered = filtered.filter(record => 
        record.className.toLowerCase().includes(classFilter.toLowerCase())
      );
    }

    // Apply badge filter (description)
    if (badgeFilter) {
      filtered = filtered.filter(record => 
        record.badgeDescription.toLowerCase().includes(badgeFilter.toLowerCase())
      );
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const filterDateStart = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate()).getTime();
      const filterDateEnd = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate() + 1).getTime();
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.assignedAt).getTime();
        return recordDate >= filterDateStart && recordDate < filterDateEnd;
      });
    }

    // Sort by assigned date (newest first)
    filtered.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    
    setFilteredRecords(filtered);
  }, [students, classes, nameFilter, classFilter, badgeFilter, dateFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const classOptions = classes.map(c => ({ value: c.name, label: c.name }));

  // Get unique badge descriptions for dropdown
  const badgeDescriptions = Array.from(new Set(
    students.flatMap(student => 
      student.badges?.map(badge => badge.description) || []
    )
  )).map(description => ({ value: description, label: description }));

  const clearFilters = () => {
    setNameFilter('');
    setClassFilter('');
    setBadgeFilter('');
    setDateFilter('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-6">Students with Badges</h2>
      
      {/* Filters - One line for desktop */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student Name
          </label>
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search student..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class
          </label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Classes</option>
            {classOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Badge Description
          </label>
          <Select
            options={badgeDescriptions}
            value={badgeDescriptions.find(option => option.value === badgeFilter)}
            onChange={(selected) => setBadgeFilter(selected?.value || '')}
            placeholder="Select badge..."
            isClearable
            isSearchable
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Badge Icon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Badge Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.studentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-2xl">
                    {record.badgeIcon}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate" title={record.badgeDescription}>
                      {record.badgeDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(record.assignedAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  {nameFilter || classFilter || badgeFilter || dateFilter ? 'No students found with the selected filters.' : 'No students have received badges yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-500">
        Total records: {filteredRecords.length}
      </div>
    </div>
  );
} 