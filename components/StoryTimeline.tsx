import { useState } from 'react';
import { useStoryStore } from '@/store/storyStore';
import { StoryAction } from '@/types/story';
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import Image from 'next/image';
import DOMPurify from 'dompurify';

export function StoryTimeline() {
  const storyActions = useStoryStore((state) => state.storyActions);
  const stories = useStoryStore((state) => state.stories);
  const sessionStories = useStoryStore((state) => state.sessionStories);
  const teachers = useSchoolStore((state) => state.teachers);
  const students = useStore((state) => state.students);
  const [selectedAction, setSelectedAction] = useState<StoryAction | null>(null);

  const getStoryName = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    return story ? story.name : 'Unknown Story';
  };

  const getSessionStoryName = (storyId: string) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return 'Unknown Session Story';
    const sessionStory = sessionStories.find(s => s.id === story.sessionStoryId);
    return sessionStory ? sessionStory.name : 'Unknown Session Story';
  };

  const getParticipantName = (participantId: string) => {
    if (participantId === 'ALL_TEACHERS') return 'All Teachers';
    if (participantId === 'ALL') return 'All';
    if (participantId === 'ALL_STUDENTS') return 'All Students';
    if (participantId === 'ALL_PARENTS') return 'All Parents';
    if (participantId.startsWith('TEACHER_')) {
      const teacherId = participantId.replace('TEACHER_', '');
      const teacher = teachers.find((t: { id: string }) => t.id === teacherId);
      return teacher ? teacher.name : 'Unknown Teacher';
    }
    if (participantId.startsWith('STUDENT_')) {
      const studentId = participantId.replace('STUDENT_', '');
      const student = students.find((s: { id: string }) => s.id === studentId);
      return student ? student.name : 'Unknown Student';
    }
    return participantId;
  };

  const sortedActions = [...storyActions].sort((a, b) => 
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-300 z-0"></div>

      {/* Timeline items */}
      <div className="space-y-4">
        {sortedActions.map((action, index) => (
          <div
            key={action.id}
            className={`relative flex items-center ${
              index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            {/* Content */}
            <div className={`w-[46%] ${index % 2 === 0 ? 'pr-2' : 'pl-2'} flex justify-${index % 2 === 0 ? 'end' : 'start'}`}>
              <div className="bg-white p-3 rounded-md shadow text-xs max-w-md min-w-[180px] flex flex-col gap-1">
                {action.imageUrl && (
                  <div className="relative h-24 mb-1">
                    <Image
                      src={action.imageUrl}
                      alt={action.actionName}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{action.actionName}</span>
                  <button
                    onClick={() => setSelectedAction(action)}
                    className="text-indigo-600 hover:text-indigo-800 p-1"
                    title="View Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                {action.actionSummary && <div className="text-gray-600 leading-tight">{action.actionSummary}</div>}
                <div className="text-gray-400">{new Date(action.publishDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>

            {/* Circle marker */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 bg-indigo-600 rounded-full z-10"></div>
          </div>
        ))}
      </div>

      {/* Popup/Modal for Action Details */}
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
                <span className="text-gray-500"><strong>Session Story:</strong> {getSessionStoryName(selectedAction.storyId)}</span><br/>
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