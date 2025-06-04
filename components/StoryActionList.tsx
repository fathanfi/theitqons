'use client';

import { useState, useEffect } from 'react';
import { useStoryStore } from '@/store/storyStore';
import { StoryAction } from '@/types/story';
import { StoryActionForm } from './StoryActionForm';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import DOMPurify from 'dompurify';

export function StoryActionList() {
  const storyActions = useStoryStore((state) => state.storyActions);
  const stories = useStoryStore((state) => state.stories);
  const loadStoryActions = useStoryStore((state) => state.loadStoryActions);
  const loadStories = useStoryStore((state) => state.loadStories);
  const deleteStoryAction = useStoryStore((state) => state.deleteStoryAction);
  const [editingAction, setEditingAction] = useState<StoryAction | null>(null);
  const [selectedAction, setSelectedAction] = useState<StoryAction | null>(null);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const teachers = useSchoolStore((state) => state.teachers);
  const students = useStore((state) => state.students);
  const [search, setSearch] = useState('');

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

  const getParticipantName = (participantId: string) => {
    if (participantId === 'ALL_TEACHERS') return 'All Teachers';
    if (participantId === 'ALL') return 'All';
    if (participantId === 'ALL_STUDENTS') return 'All Students';
    if (participantId === 'ALL_PARENTS') return 'All Parents';
    if (participantId.startsWith('TEACHER_')) {
      const teacherId = participantId.replace('TEACHER_', '');
      const teacher = teachers.find((t: { id: string }) => t.id === teacherId);
      return teacher ? teacher.name.split(' ')[0] : 'Unknown';
    }
    if (participantId.startsWith('STUDENT_')) {
      const studentId = participantId.replace('STUDENT_', '');
      const student = students.find((s: { id: string }) => s.id === studentId);
      return student ? student.name.split(' ')[0] : 'Unknown';
    }
    return participantId;
  };

  const filteredActions = storyActions.filter(action =>
    action.actionName.toLowerCase().includes(search.toLowerCase()) ||
    (action.actionSummary && action.actionSummary.toLowerCase().includes(search.toLowerCase())) ||
    (action.actionDetails && action.actionDetails.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Story Actions List</h2>
      <input
        type="text"
        placeholder="Search story actions..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      />
      {editingAction && (
        <div className="mb-6">
          <StoryActionForm 
            editAction={editingAction} 
            onUpdate={() => setEditingAction(null)} 
          />
          <button
            type="button"
            className="mt-2 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            onClick={() => setEditingAction(null)}
          >
            Cancel
          </button>
        </div>
      )}
      <div className="space-y-4">
        {filteredActions.map((action) => (
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
                      Participants: {action.participants.map(getParticipantName).join(', ')}
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
                  onClick={() => setSelectedAction(action)}
                  className="text-indigo-600 hover:text-indigo-800 p-2"
                  title="View Details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleEdit(action)}
                  className="text-indigo-600 hover:text-indigo-800 p-2"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 113.02 2.92L7.5 19.793 3 21l1.207-4.5 12.655-12.013z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredActions.length === 0 && (
          <p className="text-gray-500 text-center">No story actions found.</p>
        )}
      </div>
      {/* Details Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-base font-semibold">{selectedAction.actionName}</h3>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-500"><strong>Story:</strong> {getStoryName(selectedAction.storyId)}</span><br/>
                <span className="text-gray-500"><strong>Publish Date:</strong> {new Date(selectedAction.publishDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span><br/>
                <span className="text-gray-500"><strong>Status:</strong> {selectedAction.status ? 'Active' : 'Inactive'}</span>
              </div>
              {selectedAction.actionSummary && (
                <div>
                  <span className="font-medium text-gray-700">Summary: </span>
                  <div
                    className="prose prose-sm max-w-none bg-indigo-50 rounded p-2 my-1 text-gray-800 border border-indigo-100 shadow-sm"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedAction.actionSummary) }}
                  />
                </div>
              )}
              {selectedAction.actionDetails && (
                <div>
                  <span className="font-medium text-gray-700">Details: </span>
                  <div
                    className="prose prose-sm max-w-none bg-gray-50 rounded p-2 my-1 text-gray-800 border border-gray-100 shadow-sm"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedAction.actionDetails) }}
                  />
                </div>
              )}
              {selectedAction.participants && selectedAction.participants.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Participants: </span>
                  <span className="text-gray-600">{selectedAction.participants.map(getParticipantName).join(', ')}</span>
                </div>
              )}
              {selectedAction.imageUrl && (
                <div>
                  <span className="font-medium text-gray-700">Image:</span>
                  <div className="relative h-24 w-full mt-1">
                    <Image
                      src={selectedAction.imageUrl}
                      alt={selectedAction.actionName}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                </div>
              )}
              {selectedAction.docUrl && (
                <div>
                  <span className="font-medium text-gray-700">Document: </span>
                  <a 
                    href={selectedAction.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    View Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}