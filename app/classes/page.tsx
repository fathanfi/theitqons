import { ClassForm } from '@/components/ClassForm';
import { ClassList } from '@/components/ClassList';

export default function ClassesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Class Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ClassForm />
        <ClassList />
      </div>
    </div>
  );
}