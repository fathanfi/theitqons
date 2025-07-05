'use client';

import { useState } from 'react';
import { useRegistrationStore } from '@/store/registrationStore';
import { CreateRegistrationData } from '@/types/registration';

export function RegistrationForm() {
  const { createRegistration, loading, error } = useRegistrationStore();
  const [success, setSuccess] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  
  const [formData, setFormData] = useState<CreateRegistrationData>({
    name: '',
    gender: 'Ikhwan',
    place_of_birth: '',
    date_of_birth: '',
    address: '',
    phone_number: '',
    father_name: '',
    mother_name: '',
    wali_name: '',
    school_info: '',
    previous_education: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createRegistration(formData);
      if (result) {
        setRegistrationNumber(result.registration_number);
        setSuccess(true);
        // Reset form
        setFormData({
          name: '',
          gender: 'Ikhwan',
          place_of_birth: '',
          date_of_birth: '',
          address: '',
          phone_number: '',
          father_name: '',
          mother_name: '',
          wali_name: '',
          school_info: '',
          previous_education: ''
        });
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pendaftaran Berhasil!</h2>
          <p className="text-gray-600 mb-6">
            Terima kasih telah mendaftar di PPTQ Miftahul Khoir. Nomor pendaftaran Anda adalah:
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-2xl font-bold text-blue-600">{registrationNumber}</p>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Silakan simpan nomor pendaftaran ini. Kami akan menghubungi Anda untuk informasi selanjutnya.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Daftar Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pendaftaran Siswa Baru
        </h1>
        <p className="text-gray-600">
          PPTQ Miftahul Khoir - Tahun Ajaran 2025/2026
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Pribadi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Kelamin *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Ikhwan">Ikhwan</option>
                <option value="Akhwat">Akhwat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                name="place_of_birth"
                value={formData.place_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Lengkap *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Orang Tua/Wali</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Ayah
              </label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Ibu
              </label>
              <input
                type="text"
                name="mother_name"
                value={formData.mother_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Wali (jika berbeda)
              </label>
              <input
                type="text"
                name="wali_name"
                value={formData.wali_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Education Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Pendidikan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sekolah Asal
              </label>
              <input
                type="text"
                name="school_info"
                value={formData.school_info}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama sekolah terakhir"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pendidikan Terakhir
              </label>
              <input
                type="text"
                name="previous_education"
                value={formData.previous_education}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: SD, SMP, SMA, dll"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
          >
            {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Informasi Penting:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pendaftaran ini adalah tahap awal. Anda akan dihubungi untuk tahap selanjutnya.</li>
          <li>• Pastikan data yang diisi sudah benar dan lengkap.</li>
          <li>• Simpan nomor pendaftaran yang akan diberikan setelah submit.</li>
          <li>• Untuk informasi lebih lanjut, hubungi kami di [nomor telepon].</li>
        </ul>
      </div>
    </div>
  );
} 