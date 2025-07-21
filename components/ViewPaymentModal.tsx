'use client';

import { useState, useEffect } from 'react';
import { usePaymentStore } from '@/store/paymentStore';
import { Payment, AkadType } from '@/types/payment';
import { EditPaymentModal } from './EditPaymentModal';
import { DeletePaymentModal } from './DeletePaymentModal';
import { supabase } from '@/lib/supabase';

interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onPaymentUpdate?: () => void;
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

export function ViewPaymentModal({ isOpen, onClose, studentId, studentName, onPaymentUpdate }: ViewPaymentModalProps) {
  const { deletePayment } = usePaymentStore();
  const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Edit modal state
  const [editModal, setEditModal] = useState<{isOpen: boolean; payment: Payment | null}>({
    isOpen: false,
    payment: null
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean; payment: Payment | null}>({
    isOpen: false,
    payment: null
  });

  const loadStudentPayments = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          students:student_id (
            id,
            name,
            gender,
            address,
            class_id,
            level_id,
            status
          )
        `)
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      if (error) throw error;

      const payments: Payment[] = (data || []).map(payment => ({
        id: payment.id,
        date: payment.date,
        name: payment.name,
        total: payment.total,
        type: payment.type,
        photo_url: payment.photo_url,
        akad: payment.akad || [],
        student_id: payment.student_id,
        note: payment.note,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        students: payment.students
      }));

      setStudentPayments(payments);
    } catch (error) {
      console.error('Error loading student payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && studentId) {
      loadStudentPayments();
    }
  }, [isOpen, studentId]);

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
    return studentPayments.reduce((sum: number, payment: Payment) => sum + payment.total, 0);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditModal({ isOpen: true, payment });
  };

  const handleDeletePayment = (payment: Payment) => {
    setDeleteModal({ isOpen: true, payment });
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
          ) : studentPayments.length === 0 ? (
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
                  <span className="text-sm font-medium text-blue-700">{studentPayments.length}</span>
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-2">
                {studentPayments.map((payment: Payment) => (
                  <div key={payment.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{payment.name}</h3>
                          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {PAYMENT_TYPE_LABELS[payment.type]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{formatDate(payment.date)}</p>
                        
                        {/* Compact Akad Details */}
                        {payment.akad && payment.akad.length > 0 && (
                          <div className="text-xs text-gray-600 mb-2">
                            {payment.akad.map((item: any, index: number) => (
                              <span key={index} className="mr-3">
                                {AKAD_LABELS[item.type as AkadType]}: {formatCurrency(item.amount)}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Compact Note */}
                        {payment.note && (
                          <p className="text-xs text-gray-500 mb-2 truncate max-w-xs" title={payment.note}>
                            📝 {payment.note}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(payment.total)}</p>
                        
                        {/* Compact Photo */}
                        {payment.photo_url && (
                          <img
                            src={payment.photo_url}
                            alt="Bukti pembayaran"
                            className="w-12 h-12 object-cover rounded border mt-1 cursor-pointer"
                            onClick={() => window.open(payment.photo_url, '_blank')}
                          />
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-1 mt-2 pt-2 border-t">
                      <button
                        onClick={() => handleEditPayment(payment)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Edit Pembayaran"
                      >
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Hapus Pembayaran"
                      >
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>
                    </div>
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
        onSuccess={() => {
          loadStudentPayments(); // Reload student payments
          onPaymentUpdate?.(); // Notify parent to refresh
        }}
      />

      {/* Delete Payment Modal */}
      <DeletePaymentModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, payment: null })}
        payment={deleteModal.payment}
        onConfirm={async () => {
          try {
            if (deleteModal.payment) {
              await deletePayment(deleteModal.payment.id);
              alert('Pembayaran berhasil dihapus!');
              setDeleteModal({ isOpen: false, payment: null });
              loadStudentPayments(); // Reload payments to refresh the list
              onPaymentUpdate?.(); // Notify parent to refresh
            }
          } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Gagal menghapus pembayaran. Silakan coba lagi.');
          }
        }}
      />
    </div>
  );
} 