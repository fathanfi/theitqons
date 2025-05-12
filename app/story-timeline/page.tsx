'use client';

import { useEffect, useState } from 'react';
import { useStoryStore } from '@/store/storyStore';
import Image from 'next/image';
import Select from 'react-select';

export default function StoryTimelinePage() {
  const storyActions = useStoryStore((state) => state.storyActions);
  const sessionStories = useStoryStore((state) => state.sessionStories);
  const loadStoryActions = useStoryStore((state) => state.loadStoryActions);
  const loadSessionStories = useStoryStore((state) => state.loadSessionStories);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    loadStoryActions();
    loadSessionStories();
  }, [loadStoryActions, loadSessionStories]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const sessionOptions = sessionStories.map(session => ({
    value: session.id,
    label: session.name
  }));

  const filteredActions = selectedSession
    ? storyActions.filter(action => action.story?.sessionStoryId === selectedSession)
    : storyActions;

  const sortedActions = [...filteredActions].sort((a, b) => 
    new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Story Timeline</h1>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Session Story
        </label>
        <Select
          options={sessionOptions}
          value={sessionOptions.find(option => option.value === selectedSession)}
          onChange={(selected) => setSelectedSession(selected?.value || null)}
          isClearable
          placeholder="Select a session story..."
          className="w-full max-w-md"
        />
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200"></div>

        {/* Timeline items */}
        <div className="space-y-12">
          {sortedActions.map((action, index) => (
            <div
              key={action.id}
              className={`relative flex items-center ${
                index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* Content */}
              <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  {action.imageUrl && (
                    <div className="relative h-48 mb-4">
                      <Image
                        src={action.imageUrl}
                        alt={action.actionName}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{action.actionName}</h3>
                  <p className="text-gray-600 mb-4">{action.actionSummary}</p>
                  <div className="text-sm text-gray-500">
                    {formatDate(action.publishDate)}
                  </div>
                  {action.docUrl && (
                    <a
                      href={action.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm mt-2 inline-block"
                    >
                      View Document
                    </a>
                  )}
                </div>
              </div>

              {/* Circle marker */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-indigo-600 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}