import { RegistrationForm } from '@/components/RegistrationForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto">
        {/* PSB 2025 Banner Image */}
        <div className="p-6 mb-8 max-w-4xl mx-auto">
          <img
            src="https://qmffqsgaqfzprhcusiot.supabase.co/storage/v1/object/public/itqonbucket/general/psb2025.png"
            alt="PSB 2025/2026 - Pendaftaran Santri Baru"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>

        {/* Header with Contact Information */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pendaftaran Santri Baru
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            PPTQ Miftahul Khoir - Tahun Ajaran 2025/2026
          </p>
        </div>

        {/* Registration Form */}
        <RegistrationForm />

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Informasi Kontak</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Contact Person:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">📞</span>
                    <span className="font-medium">+62812-1628-8250 (Fathan)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">📞</span>
                    <span className="font-medium">+62 856-0233-4708 (Ayu)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">📞</span>
                    <span className="font-medium">+62 823-1926-8550 (Risman)</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Alamat:</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">📍</span>
                    <div>
                      <p className="font-medium">PPTQ Miftahul Khoir</p>
                      <p className="text-gray-600">Jalan KH. Tubagus Abdullah, Rt 03/05</p>
                      <p className="text-gray-600">Kp. Pasirjaya, Kel. Sukajaya</p>
                      <p className="text-gray-600">Kota Tasikmalaya 46196</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Google Maps */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Lokasi Pondok Pesantren</h2>
          <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-gray-600 mb-4">Lokasi PPTQ Miftahul Khoir</p>
              <a
                href="https://maps.app.goo.gl/X21Wktm8MFJjKKq37"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <span>🗺️</span>
                <span>Buka di Google Maps</span>
              </a>
            </div>
          </div>
        </div>

        {/* PSB 2025 Banner Image */}
        <div className="p-6 mb-8 max-w-4xl mx-auto">
          <img
            src="https://qmffqsgaqfzprhcusiot.supabase.co/storage/v1/object/public/itqonbucket/general/psb20253.png"
            alt="PSB 2025/2026 - Pendaftaran Santri Baru Gallery"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
} 