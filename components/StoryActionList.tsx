'use client';

import { useState, useEffect } from 'react';
import { useStoryStore } from '@/store/storyStore';
import { StoryAction } from '@/types/story';
import { StoryActionForm } from './StoryActionForm';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';

export function StoryActionList() {
  const storyActions = useStoryStore((state) => state.storyActions);
  const stories = useStoryStore((state) => state.stories);
  const loadStoryActions = useStoryStore((state) => state.loadStoryActions);
  const loadStories = useStoryStore((state) => state.loadStories);
  const deleteStoryAction = useStoryStore((state) => state.deleteStoryAction);
  const [editingAction, setEditingAction] = useState<StoryAction | null>(null);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  useEffect(() => {
    loadStoryActions();
    loadStories();
  }, [loadStoryActions, loadStories]);

  const handleEdit = (action: StoryAction) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    setEditingAction(action);
  };

  const handleDelete = (id: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    deleteStoryAction(id);
  };

  const getStoryName = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    return story ? story.name : 'Unknown Story';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Story Actions List</h2>
      {editingAction && (
        <div className="mb-6">
          <StoryActionForm 
            editAction={editingAction} 
            onUpdate={() => setEditingAction(null)} 
          />
        </div>
      )}
      <div className="space-y-4">
        {storyActions.map((action) => (
          <div key={action.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{action.actionName}</h3>
                <p className="text-sm text-gray-500">
                  Story: {getStoryName(action.storyId)}
                </p>
                <p className="text-sm text-gray-500">
                  Publish Date: {new Date(action.publishDate).toLocaleDateString()}
                </p>
                {action.actionSummary && (
                  <p className="text-sm text-gray-600 mt-2">{action.actionSummary}</p>
                )}
                {action.imageUrl && (
                  <div className="mt-2 relative h-40 w-64">
                    <Image
                      src={action.imageUrl}
                      alt={action.actionName}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                )}
                {action.participants && action.participants.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Participants: {action.participants.join(', ')}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 ml-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={action.status}
                    readOnly
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <button
                  onClick={() => handleEdit(action)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(action.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {storyActions.length === 0 && (
          <p className="text-gray-500 text-center">No story actions added yet.</p>
        )}
      </div>
    </div>
  );
}