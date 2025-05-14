import { TeacherForm } from '@/components/TeacherForm';
import { TeacherList } from '@/components/TeacherList';

export default function TeachersPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Teacher Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <TeacherForm />
        </div>
        <div className="lg:col-span-2">
          <TeacherList />
        </div>
      </div>
    </div>
  );
}