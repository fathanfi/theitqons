'use client';

import { useState, useEffect } from 'react';
import { useStoryStore } from '@/store/storyStore';
import { Story } from '@/types/story';
import { StoryForm } from './StoryForm';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

export function StoryList() {
  const stories = useStoryStore((state) => state.stories);
  const sessionStories = useStoryStore((state) => state.sessionStories);
  const loadStories = useStoryStore((state) => state.loadStories);
  const loadSessionStories = useStoryStore((state) => state.loadSessionStories);
  const deleteStory = useStoryStore((state) => state.deleteStory);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  useEffect(() => {
    loadStories();
    loadSessionStories();
  }, [loadStories, loadSessionStories]);

  const handleEdit = (story: Story) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    setEditingStory(story);
  };

  const handleDelete = (id: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    deleteStory(id);
  };

  const getSessionStoryName = (sessionStoryId: string) => {
    const sessionStory = sessionStories.find(s => s.id === sessionStoryId);
    return sessionStory ? sessionStory.name : 'Unknown Session';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Stories List</h2>
      {editingStory && (
        <div className="mb-6">
          <StoryForm 
            editStory={editingStory} 
            onUpdate={() => setEditingStory(null)} 
          />
        </div>
      )}
      <div className="space-y-4">
        {stories.map((story) => (
          <div key={story.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{story.name}</h3>
                {story.description && (
                  <p className="text-sm text-gray-500">{story.description}</p>
                )}
                <p className="text-sm text-gray-500">
                  Session: {getSessionStoryName(story.sessionStoryId)}
                </p>
                <p className="text-sm text-gray-500">
                  Publish Date: {new Date(story.publishDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={story.status}
                    readOnly
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <button
                  onClick={() => handleEdit(story)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(story.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {stories.length === 0 && (
          <p className="text-gray-500 text-center">No stories added yet.</p>
        )}
      </div>
    </div>
  );
}