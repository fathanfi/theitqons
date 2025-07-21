'use client';

import { useState, useEffect } from 'react';
import { usePaymentStore } from '@/store/paymentStore';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/authStore';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { Payment } from '@/types/payment';
import { AddPaymentModal } from '@/components/AddPaymentModal';
import { EditPaymentModal } from '@/components/EditPaymentModal';
import { DeletePaymentModal } from '@/components/DeletePaymentModal';
import { ImageLightbox } from '@/components/ImageLightbox';

export default function PaymentsPage() {
  const { payments, loadPayments, loading, deletePayment } = usePaymentStore();
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  const { user } = useAuthStore();
  const { showUnauthorized } = useUnauthorized();
  const isAdmin = user?.role === 'admin';

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<'student' | 'note'>('student');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState('');

  useEffect(() => {
    loadPayments();
    loadStudents();
  }, [loadPayments, loadStudents]);

  const handleEdit = (payment: Payment) => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    setSelectedPayment(payment);
    setEditModalOpen(true);
  };

  const handleDelete = (payment: Payment) => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    setSelectedPayment(payment);
    setDeleteModalOpen(true);
  };

  const handleViewImage = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  const handleViewNote = (note: string) => {
    setSelectedNote(note);
    setNoteModalOpen(true);
  };

  const getStudentName = (payment: Payment) => {
    if (!payment.student_id) return 'N/A';
    return payment.students?.name || 'Student not found';
  };

  const getPaymentTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'cash': 'Tunai',
      'bsi ziswaf': 'BSI Ziswaf',
      'bsi pptq': 'BSI PPTQ',
      'other': 'Lainnya'
    };
    return typeLabels[type] || type;
  };

  const getAkadTypeLabel = (type: string) => {
    const akadLabels: { [key: string]: string } = {
      'spp': 'SPP',
      'reg ulang': 'Registrasi Ulang',
      'reg baru': 'Registrasi Baru',
      'sedekah': 'Sedekah',
      'zakat': 'Zakat',
      'wakaf': 'Wakaf',
      'infaq': 'Infaq',
      'other': 'Lainnya'
    };
    return akadLabels[type] || type;
  };

  const formatAkadDetails = (akad: any[]) => {
    if (!akad || akad.length === 0) return 'No akad details';
    
    return akad.map((item, index) => (
      <div key={index} className="text-sm">
        <span className="font-medium text-gray-700">{getAkadTypeLabel(item.type)}:</span>
        <span className="ml-1 text-gray-600">Rp {item.amount?.toLocaleString()}</span>
        {item.description && (
          <span className="ml-1 text-gray-500 text-xs">({item.description})</span>
        )}
      </div>
    ));
  };

  // Calculate report statistics
  const totalPaymentReceived = payments.reduce((sum, payment) => sum + payment.total, 0);
  
  const paymentsByType = payments.reduce((acc, payment) => {
    acc[payment.type] = (acc[payment.type] || 0) + payment.total;
    return acc;
  }, {} as { [key: string]: number });
  
  const paymentsByAkadType = payments.reduce((acc, payment) => {
    payment.akad.forEach(akadItem => {
      acc[akadItem.type] = (acc[akadItem.type] || 0) + akadItem.amount;
    });
    return acc;
  }, {} as { [key: string]: number });

  const filteredPayments = payments.filter(payment => {
    // Apply search filter
    if (searchTerm) {
      if (searchBy === 'student') {
        const studentName = getStudentName(payment);
        if (!studentName.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
      } else {
        if (!payment.note?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
      }
    }
    
    // Apply payment type filter
    if (paymentTypeFilter !== 'all' && payment.type !== paymentTypeFilter) {
      return false;
    }
    
    return true;
  });

  const handleAddPayment = () => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    setAddModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments Management</h1>
        <button
          onClick={handleAddPayment}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Payment
        </button>
      </div>

      {/* Large Report Section */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Total Payment */}
          <div className="text-center lg:text-left">
            <h3 className="text-lg font-medium text-gray-600 mb-3">Total Payment Received</h3>
            <div className="text-4xl lg:text-6xl font-bold text-green-600">
              Rp {totalPaymentReceived.toLocaleString()}
            </div>
            {filteredPayments.length !== payments.length && (
              <div className="text-sm text-gray-500 mt-2">
                Showing {filteredPayments.length} of {payments.length} payments
              </div>
            )}
          </div>

          {/* Payment Type Donut Chart */}
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {(() => {
                  const total = Object.values(paymentsByType).reduce((sum, val) => sum + val, 0);
                  let currentAngle = 0;
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                  
                  return Object.entries(paymentsByType).map(([type, amount], index) => {
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;
                    
                    const x1 = 18 + 15.9155 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 18 + 15.9155 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 18 + 15.9155 * Math.cos((currentAngle * Math.PI) / 180);
                    const y2 = 18 + 15.9155 * Math.sin((currentAngle * Math.PI) / 180);
                    
                    const largeArcFlag = angle > 180 ? 1 : 0;
                    
                    return (
                      <path
                        key={type}
                        stroke={colors[index % colors.length]}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        d={`M ${x1} ${y1} A 15.9155 15.9155 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-medium text-gray-600">
                  {Object.keys(paymentsByType).length}
                </span>
              </div>
            </div>
            <div className="text-base">
              <div className="font-medium text-gray-800 mb-3 text-lg">By Type</div>
              <div className="space-y-2">
                {Object.entries(paymentsByType).map(([type, amount], index) => (
                  <div key={type} className="flex items-center gap-3 text-lg">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5] }}
                    ></div>
                    <span className="text-gray-600">{getPaymentTypeLabel(type)}</span>
                    <span className="font-medium">Rp {amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Akad Type Donut Chart */}
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {(() => {
                  const total = Object.values(paymentsByAkadType).reduce((sum, val) => sum + val, 0);
                  let currentAngle = 0;
                  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
                  
                  return Object.entries(paymentsByAkadType).map(([akadType, amount], index) => {
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;
                    
                    const x1 = 18 + 15.9155 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 18 + 15.9155 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 18 + 15.9155 * Math.cos((currentAngle * Math.PI) / 180);
                    const y2 = 18 + 15.9155 * Math.sin((currentAngle * Math.PI) / 180);
                    
                    const largeArcFlag = angle > 180 ? 1 : 0;
                    
                    return (
                      <path
                        key={akadType}
                        stroke={colors[index % colors.length]}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        d={`M ${x1} ${y1} A 15.9155 15.9155 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-medium text-gray-600">
                  {Object.keys(paymentsByAkadType).length}
                </span>
              </div>
            </div>
            <div className="text-base">
              <div className="font-medium text-gray-800 mb-3 text-lg">By Akad</div>
              <div className="space-y-2">
                {Object.entries(paymentsByAkadType).map(([akadType, amount], index) => (
                  <div key={akadType} className="flex items-center gap-3 text-lg">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'][index % 7] }}
                    ></div>
                    <span className="text-gray-600">{getAkadTypeLabel(akadType)}</span>
                    <span className="font-medium">Rp {amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`Search by ${searchBy === 'student' ? 'student name' : 'note'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setSearchBy('student')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  searchBy === 'student'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                By Student
              </button>
              <button
                onClick={() => setSearchBy('note')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  searchBy === 'note'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                By Note
              </button>
            </div>
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payment Types</option>
              <option value="cash">Tunai</option>
              <option value="bsi ziswaf">BSI Ziswaf</option>
              <option value="bsi pptq">BSI PPTQ</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akad Details
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading payments...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getStudentName(payment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getPaymentTypeLabel(payment.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      Rp {payment.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        {formatAkadDetails(payment.akad)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {payment.photo_url ? (
                        <button
                          onClick={() => handleViewImage(payment.photo_url!)}
                          className="inline-block"
                        >
                          <img
                            src={payment.photo_url}
                            alt="Payment proof"
                            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
                          />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No photo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        {payment.note && (
                          <button
                            onClick={() => handleViewNote(payment.note!)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                            title="View Note"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(payment)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit Payment"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(payment)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete Payment"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddPaymentModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        studentId=""
        studentName=""
        onSuccess={loadPayments}
      />

      {selectedPayment && (
        <EditPaymentModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          studentName={getStudentName(selectedPayment)}
          onSuccess={loadPayments}
        />
      )}

      {selectedPayment && (
        <DeletePaymentModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          onConfirm={async () => {
            try {
              await deletePayment(selectedPayment.id);
              alert('Payment deleted successfully!');
              setDeleteModalOpen(false);
              setSelectedPayment(null);
              loadPayments(); // Reload payments after deletion
            } catch (error) {
              console.error('Error deleting payment:', error);
              alert('Failed to delete payment. Please try again.');
            }
          }}
        />
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        imageUrl={lightboxImage}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Note</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{selectedNote}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 