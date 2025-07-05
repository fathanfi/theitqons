'use client';

import { useState, useEffect } from 'react';
import { useRegistrationStore } from '@/store/registrationStore';
import { useAuthStore } from '@/store/authStore';
import { StudentRegistration, RegistrationStatus } from '@/types/registration';

export function RegistrationManagement() {
  const { registrations, loadRegistrations, updateRegistration, deleteRegistration, loading, error, getRegistrationStats } = useRegistrationStore();
  const { isAdmin } = useAuthStore();
  const [selectedRegistration, setSelectedRegistration] = useState<StudentRegistration | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin()) {
      loadRegistrations();
    }
  }, [loadRegistrations, isAdmin]);

  const handleStatusUpdate = async (registrationId: string, newStatus: RegistrationStatus, testData?: { date?: string; score?: number; notes?: string }) => {
    try {
      await updateRegistration({
        id: registrationId,
        status: newStatus,
        test_date: testData?.date,
        test_score: testData?.score,
        test_notes: testData?.notes
      });
      setShowUpdateModal(false);
      setSelectedRegistration(null);
    } catch (error) {
      console.error('Error updating registration:', error);
    }
  };

  const handleDelete = async (registrationId: string) => {
    if (confirm('Are you sure you want to delete this registration?')) {
      await deleteRegistration(registrationId);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesSearch = reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.registration_number.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const stats = getRegistrationStats();

  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case 'Register': return 'bg-blue-100 text-blue-800';
      case 'Test': return 'bg-yellow-100 text-yellow-800';
      case 'Passed': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Registration Management</h1>
        <div className="text-sm text-gray-600">
          Total: {stats.total} | Register: {stats.register} | Test: {stats.test} | Passed: {stats.passed} | Rejected: {stats.rejected}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or registration number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Register">Register</option>
            <option value="Test">Test</option>
            <option value="Passed">Passed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRegistrations.map((registration) => (
              <tr key={registration.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {registration.registration_number}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registration.name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registration.gender}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registration.phone_number || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(registration.status)}`}>
                    {registration.status}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(registration.registration_date)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setShowUpdateModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(registration.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRegistrations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No registrations found.
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Update Registration</h2>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedRegistration(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration #</label>
                <p className="text-gray-900 font-medium">{selectedRegistration.registration_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{selectedRegistration.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRegistration.status)}`}>
                  {selectedRegistration.status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate(selectedRegistration.id, 'Register')}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRegistration.id, 'Test')}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRegistration.id, 'Passed')}
                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    Passed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRegistration.id, 'Rejected')}
                    className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Rejected
                  </button>
                </div>
              </div>

              {selectedRegistration.status === 'Test' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Date</label>
                    <input
                      type="date"
                      defaultValue={selectedRegistration.test_date || ''}
                      onChange={(e) => {
                        setSelectedRegistration(prev => prev ? { ...prev, test_date: e.target.value } : null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={selectedRegistration.test_score || ''}
                      onChange={(e) => {
                        setSelectedRegistration(prev => prev ? { ...prev, test_score: parseInt(e.target.value) || 0 } : null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Notes</label>
                    <textarea
                      defaultValue={selectedRegistration.test_notes || ''}
                      onChange={(e) => {
                        setSelectedRegistration(prev => prev ? { ...prev, test_notes: e.target.value } : null);
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      )}
    </div>
  );
} 