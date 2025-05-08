import { AcademicYearForm } from '@/components/AcademicYearForm';
import { AcademicYearList } from '@/components/AcademicYearList';

export default function AcademicYearsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Academic Year Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AcademicYearForm />
        <AcademicYearList />
      </div>
    </div>
  );
}