import { PointForm } from '@/components/PointForm';
import { PointList } from '@/components/PointList';

export default function PointsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Points Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PointForm />
        <PointList />
      </div>
    </div>
  );
}