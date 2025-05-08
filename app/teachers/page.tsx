import { TeacherForm } from '@/components/TeacherForm';
import { TeacherList } from '@/components/TeacherList';

export default function TeachersPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Teacher Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TeacherForm />
        <TeacherList />
      </div>
    </div>
  );
}