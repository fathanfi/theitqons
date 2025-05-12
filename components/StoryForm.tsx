'use client';

import { useState } from 'react';
import { useStoryStore } from '@/store/storyStore';
import { Story } from '@/types/story';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

export function StoryForm({ editStory, onUpdate }: { editStory?: Story; onUpdate?: () => void }) {
  const addStory = useStoryStore((state) => state.addStory);
  const updateStory = useStoryStore((state) => state.updateStory);
  const sessionStories = useStoryStore((state) => state.sessionStories);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<Partial<Story>>(
    editStory || {
      sessionStoryId: '',
      name: '',
      description: '',
      publishDate: new Date().toISOString().split('T')[0],
      status: true
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    if (editStory) {
      await updateStory(formData as Story);
      onUpdate?.();
    } else {
      await addStory(formData as Omit<Story, 'id' | 'createdAt' | 'updatedAt'>);
      setFormData({
        sessionStoryId: '',
        name: '',
        description: '',
        publishDate: new Date().toISOString().split('T')[0],
        status: true
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        {editStory ? 'Edit Story' : 'Add New Story'}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Session Story</label>
          <select
            name="sessionStoryId"
            value={formData.sessionStoryId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="">Select Session Story</option>
            {sessionStories.map(story => (
              <option key={story.id} value={story.id}>
                {story.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Publish Date</label>
          <input
            type="date"
            name="publishDate"
            value={formData.publishDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="status"
            checked={formData.status}
            onChange={handleChange}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          <label className="ml-2 block text-sm font-medium text-gray-700">
            Active
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {editStory ? 'Update Story' : 'Add Story'}
        </button>
      </div>
    </form>
  );
}