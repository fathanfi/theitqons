import { ItqonExamForm } from '@/components/ItqonExamForm';
import { ItqonExamList } from '@/components/ItqonExamList';

export default function ItqonExamPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Itqon Exam</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ItqonExamForm />
        </div>
        <div className="lg:col-span-2">
          <ItqonExamList />
        </div>
      </div>
    </div>
  );
}