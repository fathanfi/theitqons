import { StoryForm } from '@/components/StoryForm';
import { StoryList } from '@/components/StoryList';

export default function StoriesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Stories Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StoryForm />
        <StoryList />
      </div>
    </div>
  );
}