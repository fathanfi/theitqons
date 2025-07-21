'use client';

import { useState, useEffect } from 'react';
import { useRegistrationStore } from '@/store/registrationStore';
import { useAuthStore } from '@/store/authStore';
import { StudentRegistration, RegistrationStatus, PaymentStatus } from '@/types/registration';

export function RegistrationManagement() {
  const { registrations, loadRegistrations, updateRegistration, deleteRegistration, loading, error, getRegistrationStats } = useRegistrationStore();
  const { isAdmin } = useAuthStore();
  const [selectedRegistration, setSelectedRegistration] = useState<StudentRegistration | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const handlePaymentUpdate = async (registrationId: string, newPaymentStatus: PaymentStatus) => {
    try {
      await updateRegistration({
        id: registrationId,
        payment_status: newPaymentStatus
      });
      setShowUpdateModal(false);
      setSelectedRegistration(null);
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handleDelete = async (registrationId: string) => {
    if (confirm('Are you sure you want to delete this registration?')) {
      await deleteRegistration(registrationId);
    }
  };

  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Sorting logic
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Sorting function
  const sortedRegistrations = [...registrations].sort((a, b) => {
    if (!sortBy) return 0;
    if (sortBy === 'age') {
      const ageA = calculateAge(a.date_of_birth) ?? 0;
      const ageB = calculateAge(b.date_of_birth) ?? 0;
      return sortDirection === 'asc' ? ageA - ageB : ageB - ageA;
    }
    if (sortBy === 'gender') {
      const genderA = a.gender || '';
      const genderB = b.gender || '';
      if (genderA < genderB) return sortDirection === 'asc' ? -1 : 1;
      if (genderA > genderB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }
    return 0;
  });

  // Filtering after sorting
  const filteredRegistrations = sortedRegistrations.filter(reg => {
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || reg.payment_status === paymentFilter;
    const matchesSearch = reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.registration_number.includes(searchTerm);
    return matchesStatus && matchesPayment && matchesSearch;
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

  const getPaymentStatusColor = (paymentStatus: PaymentStatus) => {
    switch (paymentStatus) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'NOT PAID': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClassTypeLabel = (classType: number) => {
    switch (classType) {
      case 1: return 'Sore (16.00-17.15 WIB)';
      case 2: return 'Malam (18.15-19.30 WIB)';
      case 3: return 'Online (Fleksibel)';
      default: return 'Unknown';
    }
  };

  const getClassTypeColor = (classType: number) => {
    switch (classType) {
      case 1: return 'bg-orange-100 text-orange-800';
      case 2: return 'bg-purple-100 text-purple-800';
      case 3: return 'bg-teal-100 text-teal-800';
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
        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Payment</option>
            <option value="NOT PAID">Not Paid</option>
            <option value="PAID">Paid</option>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('age')}>
                Age
                {sortBy === 'age' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('gender')}>
                Gender
                {sortBy === 'gender' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
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
                  {calculateAge(registration.date_of_birth) ? `${calculateAge(registration.date_of_birth)} tahun` : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {registration.gender}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <span>{registration.phone_number || '-'}</span>
                    {registration.phone_number && (
                      <a
                        href={`https://wa.me/${registration.phone_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800"
                        title="Open WhatsApp"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassTypeColor(registration.class_type)}`}>
                    {getClassTypeLabel(registration.class_type)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(registration.status)}`}>
                    {registration.status}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(registration.payment_status)}`}>
                    {registration.payment_status}
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
                        setShowViewModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="View Details"
                    >
                      View
                    </button>
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

      {/* View Modal */}
      {showViewModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Student Registration Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRegistration(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Registration Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Registration Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-blue-800">Registration Number:</span>
                    <p className="text-blue-900 font-bold text-lg">{selectedRegistration.registration_number}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Registration Date:</span>
                    <p className="text-blue-900">{formatDate(selectedRegistration.registration_date)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getStatusColor(selectedRegistration.status)}`}>
                      {selectedRegistration.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Payment Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getPaymentStatusColor(selectedRegistration.payment_status)}`}>
                      {selectedRegistration.payment_status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Class Type:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${getClassTypeColor(selectedRegistration.class_type)}`}>
                      {getClassTypeLabel(selectedRegistration.class_type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Personal Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-green-800">Full Name:</span>
                    <p className="text-green-900 font-semibold">{selectedRegistration.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Gender:</span>
                    <p className="text-green-900">{selectedRegistration.gender}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Age:</span>
                    <p className="text-green-900">
                      {calculateAge(selectedRegistration.date_of_birth) ? `${calculateAge(selectedRegistration.date_of_birth)} tahun` : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Place of Birth:</span>
                    <p className="text-green-900">{selectedRegistration.place_of_birth || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Date of Birth:</span>
                    <p className="text-green-900">{selectedRegistration.date_of_birth ? formatDate(selectedRegistration.date_of_birth) : '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Phone Number:</span>
                    <div className="flex items-center gap-2">
                      <p className="text-green-900">{selectedRegistration.phone_number || '-'}</p>
                      {selectedRegistration.phone_number && (
                        <a
                          href={`https://wa.me/${selectedRegistration.phone_number.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800"
                          title="Open WhatsApp"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">Address</h3>
                <div>
                  <span className="font-medium text-yellow-800">Complete Address:</span>
                  <p className="text-yellow-900 mt-1">{selectedRegistration.address}</p>
                </div>
              </div>

              {/* Parent Information */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Parent/Guardian Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-purple-800">Father's Name:</span>
                    <p className="text-purple-900">{selectedRegistration.father_name || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Mother's Name:</span>
                    <p className="text-purple-900">{selectedRegistration.mother_name || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Guardian's Name:</span>
                    <p className="text-purple-900">{selectedRegistration.wali_name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Education Information */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">Education Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-indigo-800">Previous School:</span>
                    <p className="text-indigo-900">{selectedRegistration.school_info || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-indigo-800">Last Education Level:</span>
                    <p className="text-indigo-900">{selectedRegistration.previous_education || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Test Information (if applicable) */}
              {selectedRegistration.status === 'Test' || selectedRegistration.status === 'Passed' || selectedRegistration.status === 'Rejected' ? (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-900 mb-3">Test Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-orange-800">Test Date:</span>
                      <p className="text-orange-900">{selectedRegistration.test_date ? formatDate(selectedRegistration.test_date) : '-'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-orange-800">Test Score:</span>
                      <p className="text-orange-900">{selectedRegistration.test_score || '-'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-orange-800">Test Notes:</span>
                      <p className="text-orange-900">{selectedRegistration.test_notes || '-'}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Additional Notes */}
              {selectedRegistration.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes</h3>
                  <p className="text-gray-900">{selectedRegistration.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRegistration(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <p className="text-gray-900">
                  {calculateAge(selectedRegistration.date_of_birth) ? `${calculateAge(selectedRegistration.date_of_birth)} tahun` : '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900">{selectedRegistration.phone_number || '-'}</p>
                  {selectedRegistration.phone_number && (
                    <a
                      href={`https://wa.me/${selectedRegistration.phone_number.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800"
                      title="Open WhatsApp"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClassTypeColor(selectedRegistration.class_type)}`}>
                  {getClassTypeLabel(selectedRegistration.class_type)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRegistration.status)}`}>
                  {selectedRegistration.status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Payment Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedRegistration.payment_status)}`}>
                  {selectedRegistration.payment_status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                <div className="flex gap-2 flex-wrap">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Payment Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentUpdate(selectedRegistration.id, 'NOT PAID')}
                    className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Not Paid
                  </button>
                  <button
                    onClick={() => handlePaymentUpdate(selectedRegistration.id, 'PAID')}
                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    Paid
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