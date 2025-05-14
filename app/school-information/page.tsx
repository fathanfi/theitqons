'use client';

import { useEffect } from 'react';
import { useSchoolSettingsStore } from '@/store/schoolSettingsStore';

export default function SchoolInformationPage() {
  const { schoolSettings, loadSchoolSettings } = useSchoolSettingsStore();

  useEffect(() => {
    loadSchoolSettings();
  }, [loadSchoolSettings]);

  if (!schoolSettings) {
    return <div className="text-center py-10 text-gray-500">No school information found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow space-y-8">
      <h1 className="text-3xl font-bold mb-4">School Information</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Basic Info</h2>
          <dl>
            <dt className="font-medium">School Name</dt>
            <dd className="mb-2">{schoolSettings.name}</dd>
            <dt className="font-medium">Principal</dt>
            <dd className="mb-2">{schoolSettings.principalName}</dd>
            <dt className="font-medium">Established</dt>
            <dd className="mb-2">{schoolSettings.establishedYear}</dd>
            <dt className="font-medium">School Code</dt>
            <dd className="mb-2">{schoolSettings.schoolCode}</dd>
            <dt className="font-medium">Account Number</dt>
            <dd className="mb-2">{schoolSettings.accountNumber}</dd>
          </dl>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Contact</h2>
          <dl>
            <dt className="font-medium">Address</dt>
            <dd className="mb-2">{schoolSettings.address}</dd>
            <dt className="font-medium">City</dt>
            <dd className="mb-2">{schoolSettings.city}</dd>
            <dt className="font-medium">Phone</dt>
            <dd className="mb-2">{schoolSettings.phoneNumber}</dd>
            <dt className="font-medium">Email</dt>
            <dd className="mb-2">{schoolSettings.email}</dd>
            <dt className="font-medium">Website</dt>
            <dd className="mb-2">{schoolSettings.websiteUrl}</dd>
          </dl>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Facilities</h2>
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Value</th>
            </tr>
          </thead>
          <tbody>
            {schoolSettings.facilities?.map((f, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{f.name}</td>
                <td className="border px-2 py-1">{f.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Student Count</h2>
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Count</th>
            </tr>
          </thead>
          <tbody>
            {schoolSettings.studentCount?.map((s, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{s.name}</td>
                <td className="border px-2 py-1">{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Staff Count</h2>
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Category</th>
              <th className="border px-2 py-1">Count</th>
            </tr>
          </thead>
          <tbody>
            {schoolSettings.staffCount?.map((s, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{s.name}</td>
                <td className="border px-2 py-1">{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Bank Accounts</h2>
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Bank</th>
              <th className="border px-2 py-1">Account Number</th>
            </tr>
          </thead>
          <tbody>
            {schoolSettings.bankAccount?.map((b, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{b.name}</td>
                <td className="border px-2 py-1">{b.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 