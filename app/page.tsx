import { DashboardStats } from '@/components/DashboardStats';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">The Itqon v.1</h1>
        <p className="text-gray-600">Student Management System</p>
      </div>
      <DashboardStats />
      <footer className="text-center text-gray-500 mt-8 pb-4">
        <p>© 2025 The Itqon v.1 - Developed by fathanfi</p>
      </footer>
    </div>
  );
}