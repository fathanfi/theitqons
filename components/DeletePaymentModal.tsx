'use client';

import { Payment } from '@/types/payment';

interface DeletePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onConfirm: () => void;
}

export function DeletePaymentModal({ isOpen, onClose, payment, onConfirm }: DeletePaymentModalProps) {
  if (!isOpen || !payment) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Delete Payment</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the payment "{payment.name}" for Rp {payment.total.toLocaleString()}?
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 