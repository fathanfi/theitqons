import { ExamForm } from '@/components/ExamForm';
import { ExamList } from '@/components/ExamList';

export default function ExamManagementPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Exam Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExamForm />
        <ExamList />
      </div>
    </div>
  );
}