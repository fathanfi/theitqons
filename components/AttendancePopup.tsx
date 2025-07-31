'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AttendancePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: 'present' | 'sick' | 'permit') => void;
  studentName: string;
  dayName: string;
  date: string;
  currentStatus?: 'present' | 'sick' | 'permit' | 'absent';
}

export function AttendancePopup({ isOpen, onClose, onConfirm, studentName, dayName, date, currentStatus }: AttendancePopupProps) {
  const [selectedStatus, setSelectedStatus] = useState<'present' | 'sick' | 'permit' | null>(null);

  // Set initial selection based on current status
  useEffect(() => {
    if (currentStatus && currentStatus !== 'absent') {
      setSelectedStatus(currentStatus);
    } else {
      setSelectedStatus(null);
    }
  }, [currentStatus]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus);
      onClose();
      setSelectedStatus(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedStatus(null);
  };

  const statusOptions = [
    {
      value: 'present' as const,
      label: 'Hadir',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100'
    },
    {
      value: 'sick' as const,
      label: 'Sakit',
      icon: ExclamationTriangleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-100'
    },
    {
      value: 'permit' as const,
      label: 'Izin',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Kehadiran</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Siswa:</p>
          <p className="font-medium text-gray-900">{studentName}</p>
          <p className="text-sm text-gray-600 mt-1">{dayName}, {date}</p>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">Pilih status kehadiran:</p>
          {statusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  selectedStatus === option.value
                    ? `${option.bgColor} ${option.borderColor} ${option.color}`
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${selectedStatus === option.value ? option.color : 'text-gray-400'}`} />
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStatus}
            className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
} 