'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { Group } from '@/types/school';
import { GroupForm } from './GroupForm';
import { useSession } from './SessionProvider';

export function GroupList() {
  const { currentAcademicYear } = useSession();
  const groups = useSchoolStore((state) => state.groups);
  const students = useStore((state) => state.students);
  const loadGroups = useSchoolStore((state) => state.loadGroups);
  const loadStudents = useStore((state) => state.loadStudents);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadStudents();
    if (currentAcademicYear) {
      loadGroups(currentAcademicYear.id);
    }
  }, [loadGroups, loadStudents, currentAcademicYear]);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : studentId;
  };

  const getStudentStatus = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.status ?? true;
  };

  const getFilteredStudents = (groupStudents: string[]) => {
    return groupStudents.filter(studentId => {
      const isActive = getStudentStatus(studentId);
      return showInactive || isActive;
    });
  };

  if (!currentAcademicYear) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-center text-gray-500">Please select an academic year first</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Groups List</h2>
        <label className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Show Inactive Students</span>
        </label>
      </div>
      {editingGroup && (
        <div className="mb-6">
          <GroupForm 
            editGroup={editingGroup} 
            onUpdate={(message) => {
              setEditingGroup(null);
              loadGroups(currentAcademicYear.id);
            }} 
          />
          <button
            onClick={() => setEditingGroup(null)}
            className="mt-4 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel Editing
          </button>
        </div>
      )}
      <div className="space-y-4">
        {groups.map((group) => {
          const filteredStudents = getFilteredStudents(group.students || []);
          return (
            <div key={group.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-sm text-gray-500">
                    Class: {group.class?.name} | Teacher: {group.teacher?.name}
                  </p>
                  {group.students && group.students.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Students:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {filteredStudents.map((studentId) => {
                          const isActive = getStudentStatus(studentId);
                          return (
                            <li 
                              key={studentId}
                              className={!isActive ? 'text-gray-400' : ''}
                            >
                              {getStudentName(studentId)}
                              {!isActive && ' (Inactive)'}
                            </li>
                          );
                        })}
                      </ul>
                      <p className="mt-2 text-sm text-gray-500">
                        Total Students: {filteredStudents.length}
                        {!showInactive && group.students.length > filteredStudents.length && (
                          <span className="ml-2">
                            ({group.students.length - filteredStudents.length} inactive hidden)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setEditingGroup(group)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
        {groups.length === 0 && (
          <p className="text-gray-500 text-center">No groups added yet.</p>
        )}
      </div>
    </div>
  );
}