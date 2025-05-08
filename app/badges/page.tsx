import { BadgeForm } from '@/components/BadgeForm';
import { BadgeList } from '@/components/BadgeList';

export default function BadgesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Badge Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BadgeForm />
        <BadgeList />
      </div>
    </div>
  );
}