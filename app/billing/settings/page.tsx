'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { useBillingStore } from '@/store/billingStore';
import { useSession } from '@/components/SessionProvider';

export default function BillingSettingsPage() {
  const { currentAcademicYear } = useSession();
  const academicYears = useSchoolStore((state) => state.academicYears);
  const loadAcademicYears = useSchoolStore((state) => state.loadAcademicYears);
  const { settings, loadSettings, saveSettings, updateSettings } = useBillingStore();

  const [formData, setFormData] = useState({
    academicYearId: '',
    monthlyPrice: 0,
    billingTarget: 0,
    targetPercentage: 0,
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear()
  });

  useEffect(() => {
    loadAcademicYears();
  }, [loadAcademicYears]);

  useEffect(() => {
    if (currentAcademicYear) {
      setFormData(prev => ({ ...prev, academicYearId: currentAcademicYear.id }));
      loadSettings(currentAcademicYear.id);
    }
  }, [currentAcademicYear, loadSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        academicYearId: settings.academicYearId,
        monthlyPrice: settings.monthlyPrice,
        billingTarget: settings.billingTarget,
        targetPercentage: settings.targetPercentage,
        startYear: settings.startYear,
        endYear: settings.endYear
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (settings) {
      await updateSettings({
        ...settings,
        ...formData
      });
    } else {
      await saveSettings(formData);
    }

    alert('Settings saved successfully!');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'academicYearId' ? value : Number(value)
    }));
  };

  if (!currentAcademicYear) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-center text-gray-500">Please select an academic year first</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Billing Settings</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Academic Year
            </label>
            <select
              name="academicYearId"
              value={formData.academicYearId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Year
              </label>
              <input
                type="number"
                name="startYear"
                value={formData.startYear}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
                min="2000"
                max="2100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Year
              </label>
              <input
                type="number"
                name="endYear"
                value={formData.endYear}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
                min="2000"
                max="2100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Monthly Price
            </label>
            <input
              type="number"
              name="monthlyPrice"
              value={formData.monthlyPrice}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Billing Target
            </label>
            <input
              type="number"
              name="billingTarget"
              value={formData.billingTarget}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Percentage
            </label>
            <input
              type="number"
              name="targetPercentage"
              value={formData.targetPercentage}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}