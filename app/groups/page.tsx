import { GroupForm } from '@/components/GroupForm';
import { GroupList } from '@/components/GroupList';

export default function GroupsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Group Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GroupForm />
        <GroupList />
      </div>
    </div>
  );
}