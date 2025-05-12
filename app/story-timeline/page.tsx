'use client';

import { useEffect, useState } from 'react';
import { useStoryStore } from '@/store/storyStore';
import Image from 'next/image';
import Select from 'react-select';
import { StoryTimeline } from '@/components/StoryTimeline';

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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Story Timeline</h1>
      <StoryTimeline />
    </div>
  );
}