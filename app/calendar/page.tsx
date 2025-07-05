'use client';

import { Calendar } from '@/components/Calendar';

export default function CalendarPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Academic Calendar (PPTQ Miftahul Khoir)</h1>
        <p className="text-gray-600 mt-2">
          Tahun Ajaran 2025/2026 (ED-7)
        </p>
      </div>
      
      <Calendar />
    </div>
  );
} 