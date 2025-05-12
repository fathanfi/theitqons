import { StoryActionForm } from '@/components/StoryActionForm';
import { StoryActionList } from '@/components/StoryActionList';

export default function StoryActionsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Story Actions</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StoryActionForm />
        <StoryActionList />
      </div>
    </div>
  );
}