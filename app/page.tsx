import { DashboardStats } from '@/components/DashboardStats';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-4xl font-bold mb-2">The Itqon v.1</h1>
          <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">BETA</span>
        </div>
        <p className="text-gray-600">Student Management System</p>
      </div>
      <DashboardStats />
      <footer className="text-center text-gray-500 mt-8 pb-4">
        <p>© 2025 The Itqon v.1 - Developed by fathanfi</p>
      </footer>
    </div>
  );
}