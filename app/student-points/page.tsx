import { StudentPointForm } from '@/components/StudentPointForm';
import { StudentPointHistory } from '@/components/StudentPointHistory';

export default function StudentPointsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Student Points</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StudentPointForm />
        <StudentPointHistory />
      </div>
    </div>
  );
}