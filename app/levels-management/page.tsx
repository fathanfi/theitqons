import { LevelForm } from '@/components/LevelForm';
import { LevelList } from '@/components/LevelList';

export default function LevelsManagementPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Level Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LevelForm />
        <LevelList />
      </div>
    </div>
  );
}