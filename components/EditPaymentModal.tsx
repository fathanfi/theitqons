'use client';

import { useState, useRef, useEffect } from 'react';
import { usePaymentStore } from '@/store/paymentStore';
import { Payment, UpdatePaymentData, AkadItem, AkadType, PaymentType } from '@/types/payment';
import { supabase } from '@/lib/supabase';

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  studentName: string;
}

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'cash', label: 'Tunai' },
  { value: 'bsi ziswaf', label: 'BSI Ziswaf' },
  { value: 'bsi pptq', label: 'BSI PPTQ' },
  { value: 'other', label: 'Lainnya' }
];

const AKAD_TYPES: { value: AkadType; label: string }[] = [
  { value: 'spp', label: 'SPP' },
  { value: 'reg ulang', label: 'Registrasi Ulang' },
  { value: 'reg baru', label: 'Registrasi Baru' },
  { value: 'sedekah', label: 'Sedekah' },
  { value: 'zakat', label: 'Zakat' },
  { value: 'wakaf', label: 'Wakaf' },
  { value: 'infaq', label: 'Infaq' },
  { value: 'other', label: 'Lainnya' }
];

export function EditPaymentModal({ isOpen, onClose, payment, studentName }: EditPaymentModalProps) {
  const { updatePayment, loading } = usePaymentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<UpdatePaymentData>({
    id: '',
    date: '',
    name: '',
    total: 0,
    type: 'cash',
    photo_url: '',
    akad: [],
    student_id: '',
    note: ''
  });

  const [akadItems, setAkadItems] = useState<AkadItem[]>([]);
  const [newAkadItem, setNewAkadItem] = useState<AkadItem>({
    type: 'spp',
    amount: 0,
    description: ''
  });

  // Initialize form data when payment changes
  useEffect(() => {
    if (payment) {
      setFormData({
        id: payment.id,
        date: payment.date,
        name: payment.name,
        total: payment.total,
        type: payment.type,
        photo_url: payment.photo_url || '',
        akad: payment.akad,
        student_id: payment.student_id || '',
        note: payment.note || ''
      });
      setAkadItems(payment.akad || []);
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      alert('Nama pembayar harus diisi');
      return;
    }

    if (formData.total === 0) {
      alert('Total pembayaran harus lebih dari 0');
      return;
    }

    if (akadItems.length === 0) {
      alert('Minimal harus ada satu item akad');
      return;
    }

    const totalAkad = akadItems.reduce((sum, item) => sum + item.amount, 0);
    if (totalAkad !== formData.total) {
      alert('Total akad harus sama dengan total pembayaran');
      return;
    }

    try {
      const updateData = {
        ...formData,
        akad: akadItems
      };

      await updatePayment(updateData);
      alert('Pembayaran berhasil diperbarui!');
      handleClose();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Gagal memperbarui pembayaran. Silakan coba lagi.');
    }
  };

  const handleClose = () => {
    setFormData({
      id: '',
      date: '',
      name: '',
      total: 0,
      type: 'cash',
      photo_url: '',
      akad: [],
      student_id: '',
      note: ''
    });
    setAkadItems([]);
    setNewAkadItem({
      type: 'spp',
      amount: 0,
      description: ''
    });
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 5MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipe file tidak didukung. Gunakan JPG, PNG, atau GIF.');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      console.log('Uploading file:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('itqonbucket')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        if (uploadError.message?.includes('row-level security policy')) {
          alert('Gagal mengunggah file: Masalah izin. Silakan hubungi administrator.');
        } else {
          alert(`Gagal mengunggah file: ${uploadError.message || 'Error tidak diketahui'}`);
        }
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('itqonbucket')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully:', publicUrl);
      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Gagal mengunggah file. Silakan coba lagi atau hubungi administrator.');
    }
  };

  const addAkadItem = () => {
    if (newAkadItem.amount <= 0) {
      alert('Jumlah akad harus lebih dari 0');
      return;
    }

    setAkadItems(prev => [...prev, { ...newAkadItem }]);
    setNewAkadItem({
      type: 'spp',
      amount: 0,
      description: ''
    });
  };

  const removeAkadItem = (index: number) => {
    setAkadItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateTotal = (value: number) => {
    setFormData(prev => ({ ...prev, total: value }));
  };

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Pembayaran</h2>
            <p className="text-sm text-gray-600">{studentName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Pembayar *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama pembayar"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Pembayaran *
                </label>
                <input
                  type="number"
                  value={formData.total}
                  onChange={(e) => updateTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Pembayaran *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PaymentType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {PAYMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Catatan tambahan (opsional)"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bukti Pembayaran
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-gray-600"
              >
                {formData.photo_url ? 'File terunggah ✓' : 'Klik untuk memilih file'}
              </button>
              {formData.photo_url && (
                <div className="mt-2">
                  <img
                    src={formData.photo_url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Akad Items */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detail Akad</h3>
              
              {/* Add Akad Item */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Akad
                    </label>
                    <select
                      value={newAkadItem.type}
                      onChange={(e) => setNewAkadItem(prev => ({ ...prev, type: e.target.value as AkadType }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {AKAD_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jumlah
                    </label>
                    <input
                      type="number"
                      value={newAkadItem.amount}
                      onChange={(e) => setNewAkadItem(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keterangan
                    </label>
                    <input
                      type="text"
                      value={newAkadItem.description}
                      onChange={(e) => setNewAkadItem(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Keterangan (opsional)"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addAkadItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tambah Akad
                </button>
              </div>

              {/* Akad Items List */}
              {akadItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Daftar Akad:</h4>
                  {akadItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{AKAD_TYPES.find(t => t.value === item.type)?.label}</span>
                        <span className="ml-2 text-gray-600">- Rp {item.amount.toLocaleString()}</span>
                        {item.description && (
                          <span className="ml-2 text-sm text-gray-500">({item.description})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAkadItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  <div className="text-right font-medium text-lg">
                    Total: Rp {akadItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
} 