'use client';

import { useState, useEffect } from 'react';
import { useStoryStore } from '@/store/storyStore';
import { SessionStory } from '@/types/story';
import { SessionStoryForm } from './SessionStoryForm';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

export function SessionStoryList() {
  const sessionStories = useStoryStore((state) => state.sessionStories);
  const loadSessionStories = useStoryStore((state) => state.loadSessionStories);
  const deleteSessionStory = useStoryStore((state) => state.deleteSessionStory);
  const [editingStory, setEditingStory] = useState<SessionStory | null>(null);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  useEffect(() => {
    loadSessionStories();
  }, [loadSessionStories]);

  const handleEdit = (story: SessionStory) => {
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
    deleteSessionStory(id);
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return 'None';
    const parent = sessionStories.find(story => story.id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Session Stories List</h2>
      {editingStory && (
        <div className="mb-6">
          <SessionStoryForm 
            editStory={editingStory} 
            onUpdate={() => setEditingStory(null)} 
          />
        </div>
      )}
      <div className="space-y-4">
        {sessionStories.map((story) => (
          <div key={story.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{story.name}</h3>
                {story.description && (
                  <p className="text-sm text-gray-500">{story.description}</p>
                )}
                <p className="text-sm text-gray-500">
                  Parent: {getParentName(story.parentId)}
                </p>
                <p className="text-sm text-gray-500">
                  Period: {new Date(story.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(story.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
        {sessionStories.length === 0 && (
          <p className="text-gray-500 text-center">No session stories added yet.</p>
        )}
      </div>
    </div>
  );
}