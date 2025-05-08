import { StudentForm } from '@/components/StudentForm';
import { StudentList } from '@/components/StudentList';

export default function StudentsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Student Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StudentForm />
        <StudentList />
      </div>
    </div>
  );
}