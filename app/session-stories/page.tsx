import { SessionStoryForm } from '@/components/SessionStoryForm';
import { SessionStoryList } from '@/components/SessionStoryList';

export default function SessionStoriesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Session Story Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SessionStoryForm />
        <SessionStoryList />
      </div>
    </div>
  );
}