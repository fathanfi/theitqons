export interface SessionStory {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  parentId: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: SessionStory;
  children?: SessionStory[];
}

export interface Story {
  id: string;
  sessionStoryId: string;
  name: string;
  description: string;
  publishDate: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  sessionStory?: SessionStory;
}

export interface StoryAction {
  id: string;
  storyId: string;
  actionName: string;
  actionSummary: string;
  actionDetails: string;
  participants: string[];
  imageUrl: string;
  docUrl: string;
  publishDate: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
  story?: {
    id: string;
    name: string;
    session_story?: {
      id: string;
      name: string;
    };
  };
}