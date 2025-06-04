'use client';

import { useState, useEffect } from 'react';
import { useStoryStore } from '@/store/storyStore';
import { StoryAction } from '@/types/story';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import Select from 'react-select';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export function StoryActionForm({ editAction, onUpdate }: { editAction?: StoryAction; onUpdate?: () => void }) {
  const addStoryAction = useStoryStore((state) => state.addStoryAction);
  const updateStoryAction = useStoryStore((state) => state.updateStoryAction);
  const stories = useStoryStore((state) => state.stories);
  const loadStories = useStoryStore((state) => state.loadStories);
  
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  
  const teachers = useSchoolStore((state) => state.teachers);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);

  useEffect(() => {
    loadStories();
    loadStudents();
    loadTeachers();
  }, [loadStories, loadStudents, loadTeachers]);

  const [formData, setFormData] = useState<Partial<StoryAction>>(
    editAction || {
      storyId: '',
      actionName: '',
      actionSummary: '',
      actionDetails: '',
      participants: [],
      imageUrl: '',
      docUrl: '',
      publishDate: new Date().toISOString().split('T')[0],
      status: true
    }
  );

  const participantOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'ALL_TEACHERS', label: 'All Teachers' },
    { value: 'ALL_STUDENTS', label: 'All Students' },
    { value: 'ALL_PARENTS', label: 'All Parents' },
    ...teachers.map(teacher => ({
      value: `TEACHER_${teacher.id}`,
      label: `${teacher.name} (Teacher)`
    })),
    ...students.map(student => ({
      value: `STUDENT_${student.id}`,
      label: `${student.name} (Student)`
    }))
  ];

  const selectedParticipants = participantOptions.filter(option => 
    formData.participants?.includes(option.value)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editAction) {
      await updateStoryAction(formData as StoryAction);
      onUpdate?.();
    } else {
      await addStoryAction(formData as Omit<StoryAction, 'id' | 'createdAt' | 'updatedAt'>);
      setFormData({
        storyId: '',
        actionName: '',
        actionSummary: '',
        actionDetails: '',
        participants: [],
        imageUrl: '',
        docUrl: '',
        publishDate: new Date().toISOString().split('T')[0],
        status: true
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        {editAction ? 'Edit Story Action' : 'Add New Story Action'}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Story</label>
          <select
            name="storyId"
            value={formData.storyId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="">Select Story</option>
            {stories.map(story => (
              <option key={story.id} value={story.id}>
                {story.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Action Name</label>
          <input
            type="text"
            name="actionName"
            value={formData.actionName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Action Summary</label>
          <textarea
            name="actionSummary"
            value={formData.actionSummary}
            onChange={handleChange}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Action Details</label>
          <div className="mt-1">
            <ReactQuill
              value={formData.actionDetails || ''}
              onChange={value => setFormData({ ...formData, actionDetails: value })}
              theme="snow"
              className="bg-white rounded-md border border-gray-200 min-h-[120px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Participants</label>
          <Select
            isMulti
            options={participantOptions}
            value={selectedParticipants}
            onChange={(selected) => {
              setFormData({
                ...formData,
                participants: selected.map(option => option.value)
              });
            }}
            className="mt-1"
            placeholder="Select participants..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Document URL</label>
          <input
            type="url"
            name="docUrl"
            value={formData.docUrl}
            onChange={handleChange}
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
          {editAction ? 'Update Story Action' : 'Add Story Action'}
        </button>
      </div>
    </form>
  );
}