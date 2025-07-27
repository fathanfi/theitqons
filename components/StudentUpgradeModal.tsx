'use client';

import { useState } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { Student } from '@/types/student';
import { supabase } from '@/lib/supabase';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface StudentUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onUpgradeSuccess?: () => void;
}

export function StudentUpgradeModal({ isOpen, onClose, student, onUpgradeSuccess }: StudentUpgradeModalProps) {
  const { classes, levels, loadClasses, loadLevels } = useSchoolStore();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeType, setUpgradeType] = useState<'level' | 'class' | null>(null);

  if (!isOpen || !student) return null;

  const handleUpgrade = async (type: 'level' | 'class', newId: string) => {
    if (!student) return;

    setIsUpgrading(true);
    setUpgradeType(type);

    try {
      // Update only the specific field in the database
      const updateField = type === 'level' ? 'level_id' : 'class_id';
      const { error: updateError } = await supabase
        .from('students')
        .update({ 
          [updateField]: newId,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // Call the success callback to refresh the student list
      if (onUpgradeSuccess) {
        onUpgradeSuccess();
      }

      // Record upgrade history
      const historyData = {
        student_id: student.id,
        type: type,
        from_id: type === 'level' ? student.level_id : student.class_id,
        to_id: newId,
        date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('student_upgrade_history')
        .insert([historyData]);

      if (error) {
        console.error('Error recording upgrade history:', error);
      }

      onClose();
    } catch (error) {
      console.error('Error upgrading student:', error);
      alert('Failed to upgrade student. Please try again.');
    } finally {
      setIsUpgrading(false);
      setUpgradeType(null);
    }
  };

  const getCurrentLevelName = () => {
    const currentLevel = levels.find(l => l.id === student.level_id);
    return currentLevel?.name || 'No Level';
  };

  const getCurrentClassName = () => {
    const currentClass = classes.find(c => c.id === student.class_id);
    return currentClass?.name || 'No Class';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Upgrade Student: {student.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Current Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Current Level:</span>
                <p className="text-lg font-semibold text-gray-900">{getCurrentLevelName()}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Current Class:</span>
                <p className="text-lg font-semibold text-gray-900">{getCurrentClassName()}</p>
              </div>
            </div>
          </div>

          {/* Level Upgrade */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Level</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleUpgrade('level', level.id)}
                  disabled={isUpgrading || level.id === student.level_id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    level.id === student.level_id
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                      : isUpgrading && upgradeType === 'level'
                      ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-wait'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                  }`}
                >
                  <div className="font-medium">{level.name}</div>
                  {level.id === student.level_id && (
                    <div className="text-xs text-gray-500 mt-1">Current</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Class Upgrade */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Class</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {classes.map((class_) => (
                <button
                  key={class_.id}
                  onClick={() => handleUpgrade('class', class_.id)}
                  disabled={isUpgrading || class_.id === student.class_id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    class_.id === student.class_id
                      ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                      : isUpgrading && upgradeType === 'class'
                      ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-wait'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700'
                  }`}
                >
                  <div className="font-medium">{class_.name}</div>
                  {class_.id === student.class_id && (
                    <div className="text-xs text-gray-500 mt-1">Current</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 