'use client';

import { useState, useEffect } from 'react';
import { usePaymentStore } from '@/store/paymentStore';
import { Payment, AkadType } from '@/types/payment';
import { EditPaymentModal } from './EditPaymentModal';

interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

const AKAD_LABELS: Record<AkadType, string> = {
  'spp': 'SPP',
  'reg ulang': 'Registrasi Ulang',
  'reg baru': 'Registrasi Baru',
  'sedekah': 'Sedekah',
  'zakat': 'Zakat',
  'wakaf': 'Wakaf',
  'infaq': 'Infaq',
  'other': 'Lainnya'
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  'cash': 'Tunai',
  'bsi ziswaf': 'BSI Ziswaf',
  'bsi pptq': 'BSI PPTQ',
  'other': 'Lainnya'
};

export function ViewPaymentModal({ isOpen, onClose, studentId, studentName }: ViewPaymentModalProps) {
  const { payments, loading, loadPayments, deletePayment } = usePaymentStore();
  
  // Edit modal state
  const [editModal, setEditModal] = useState<{isOpen: boolean; payment: Payment | null}>({
    isOpen: false,
    payment: null
  });

  useEffect(() => {
    if (isOpen && studentId) {
      loadPayments(studentId);
    }
  }, [isOpen, studentId, loadPayments]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const calculateTotal = () => {
    return payments.reduce((sum, payment) => sum + payment.total, 0);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditModal({ isOpen: true, payment });
  };

  const handleDeletePayment = async (payment: Payment) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pembayaran "${payment.name}" sebesar Rp ${payment.total.toLocaleString()}?`)) {
      return;
    }

    try {
      await deletePayment(payment.id);
      alert('Pembayaran berhasil dihapus!');
      // Reload payments to refresh the list
      loadPayments(studentId);
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Gagal menghapus pembayaran. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Riwayat Pembayaran</h2>
            <p className="text-sm text-gray-600">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <p className="text-gray-500">Belum ada riwayat pembayaran</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">Total Pembayaran:</span>
                  <span className="text-lg font-bold text-blue-900">{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-blue-700">Jumlah Transaksi:</span>
                  <span className="text-sm font-medium text-blue-700">{payments.length}</span>
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                         <div className="flex justify-between items-start mb-3">
                       <div>
                         <h3 className="font-medium text-gray-900">{payment.name}</h3>
                         <p className="text-sm text-gray-600">{formatDate(payment.date)}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-lg font-bold text-green-600">{formatCurrency(payment.total)}</p>
                         <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                           {PAYMENT_TYPE_LABELS[payment.type]}
                         </span>
                       </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="flex justify-end gap-2 mb-3">
                       <button
                         onClick={() => handleEditPayment(payment)}
                         className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                         title="Edit Pembayaran"
                       >
                         <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                         Edit
                       </button>
                       <button
                         onClick={() => handleDeletePayment(payment)}
                         className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                         title="Hapus Pembayaran"
                       >
                         <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                         Hapus
                       </button>
                     </div>

                    {/* Akad Details */}
                    {payment.akad && payment.akad.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Detail Akad:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {payment.akad.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{AKAD_LABELS[item.type]}:</span>
                              <span className="font-medium">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                        {payment.akad.some(item => item.description) && (
                          <div className="mt-2 text-sm text-gray-600">
                            {payment.akad
                              .filter(item => item.description)
                              .map((item, index) => (
                                <div key={index} className="mt-1">
                                  <span className="font-medium">{AKAD_LABELS[item.type]}:</span> {item.description}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                                         {/* Note */}
                     {payment.note && (
                       <div className="mt-3 pt-3 border-t">
                         <h4 className="text-sm font-medium text-gray-700 mb-2">Catatan:</h4>
                         <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{payment.note}</p>
                       </div>
                     )}

                     {/* Photo */}
                     {payment.photo_url && (
                       <div className="mt-3 pt-3 border-t">
                         <h4 className="text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran:</h4>
                         <img
                           src={payment.photo_url}
                           alt="Bukti pembayaran"
                           className="w-32 h-32 object-cover rounded-lg border"
                           onClick={() => window.open(payment.photo_url, '_blank')}
                           style={{ cursor: 'pointer' }}
                         />
                       </div>
                     )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Edit Payment Modal */}
      <EditPaymentModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, payment: null })}
        payment={editModal.payment}
        studentName={studentName}
      />
    </div>
  );
} 