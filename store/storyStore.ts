import { create } from 'zustand';
import { SessionStory, Story, StoryAction } from '@/types/story';
import { supabase } from '@/lib/supabase';

interface StoryStore {
  sessionStories: SessionStory[];
  stories: Story[];
  storyActions: StoryAction[];
  
  // Session Story actions
  loadSessionStories: () => Promise<void>;
  addSessionStory: (story: Omit<SessionStory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSessionStory: (story: SessionStory) => Promise<void>;
  deleteSessionStory: (id: string) => Promise<void>;
  
  // Story actions
  loadStories: () => Promise<void>;
  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStory: (story: Story) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  
  // Story Action actions
  loadStoryActions: () => Promise<void>;
  addStoryAction: (action: Omit<StoryAction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStoryAction: (action: StoryAction) => Promise<void>;
  deleteStoryAction: (id: string) => Promise<void>;
}

export const useStoryStore = create<StoryStore>((set, get) => ({
  sessionStories: [],
  stories: [],
  storyActions: [],

  loadSessionStories: async () => {
    const { data } = await supabase
      .from('session_stories')
      .select(`
        *,
        parent:session_stories(*),
        children:session_stories(*)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      set({ sessionStories: data });
    }
  },

  addSessionStory: async (story) => {
    const { data, error } = await supabase
      .from('session_stories')
      .insert([{
        name: story.name,
        description: story.description,
        start_date: story.startDate,
        end_date: story.endDate,
        parent_id: story.parentId,
        status: story.status
      }])
      .select(`
        *,
        parent:session_stories(*),
        children:session_stories(*)
      `)
      .single();

    if (data && !error) {
      set(state => ({
        sessionStories: [data, ...state.sessionStories]
      }));
    }
  },

  updateSessionStory: async (story) => {
    const { data, error } = await supabase
      .from('session_stories')
      .update({
        name: story.name,
        description: story.description,
        start_date: story.startDate,
        end_date: story.endDate,
        parent_id: story.parentId,
        status: story.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', story.id)
      .select(`
        *,
        parent:session_stories(*),
        children:session_stories(*)
      `)
      .single();

    if (data && !error) {
      set(state => ({
        sessionStories: state.sessionStories.map(s =>
          s.id === story.id ? data : s
        )
      }));
    }
  },

  deleteSessionStory: async (id) => {
    const { error } = await supabase
      .from('session_stories')
      .delete()
      .eq('id', id);

    if (!error) {
      set(state => ({
        sessionStories: state.sessionStories.filter(s => s.id !== id)
      }));
    }
  },

  loadStories: async () => {
    const { data } = await supabase
      .from('stories')
      .select(`
        *,
        session_story:session_stories(*)
      `)
      .order('publish_date', { ascending: false });

    if (data) {
      set({
        stories: data.map(story => ({
          ...story,
          sessionStoryId: story.session_story_id,
          publishDate: story.publish_date,
          sessionStory: story.session_story
        }))
      });
    }
  },

  addStory: async (story) => {
    const { data, error } = await supabase
      .from('stories')
      .insert([{
        session_story_id: story.sessionStoryId,
        name: story.name,
        description: story.description,
        publish_date: story.publishDate,
        status: story.status
      }])
      .select(`
        *,
        session_story:session_stories(*)
      `)
      .single();

    if (data && !error) {
      const newStory = {
        ...data,
        sessionStoryId: data.session_story_id,
        publishDate: data.publish_date,
        sessionStory: data.session_story
      };

      set(state => ({
        stories: [newStory, ...state.stories]
      }));

      // Reload stories to ensure we have the latest data
      await get().loadStories();
    }
  },

  updateStory: async (story) => {
    const { data, error } = await supabase
      .from('stories')
      .update({
        session_story_id: story.sessionStoryId,
        name: story.name,
        description: story.description,
        publish_date: story.publishDate,
        status: story.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', story.id)
      .select(`
        *,
        session_story:session_stories(*)
      `)
      .single();

    if (data && !error) {
      const updatedStory = {
        ...data,
        sessionStoryId: data.session_story_id,
        publishDate: data.publish_date,
        sessionStory: data.session_story
      };

      set(state => ({
        stories: state.stories.map(s =>
          s.id === story.id ? updatedStory : s
        )
      }));
    }
  },

  deleteStory: async (id) => {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (!error) {
      set(state => ({
        stories: state.stories.filter(s => s.id !== id)
      }));
    }
  },

  loadStoryActions: async () => {
    const { data } = await supabase
      .from('story_actions')
      .select(`
        *,
        story:stories(
          *,
          session_story:session_stories(*)
        )
      `)
      .order('publish_date', { ascending: false });

    if (data) {
      set({
        storyActions: data.map(action => ({
          ...action,
          storyId: action.story_id,
          actionName: action.action_name,
          actionSummary: action.action_summary,
          actionDetails: action.action_details,
          imageUrl: action.image_url,
          docUrl: action.doc_url,
          publishDate: action.publish_date,
          story: action.story
        }))
      });
    }
  },

  addStoryAction: async (action) => {
    const { data, error } = await supabase
      .from('story_actions')
      .insert([{
        story_id: action.storyId,
        action_name: action.actionName,
        action_summary: action.actionSummary,
        action_details: action.actionDetails,
        participants: action.participants,
        image_url: action.imageUrl,
        doc_url: action.docUrl,
        publish_date: action.publishDate,
        status: action.status
      }])
      .select(`
        *,
        story:stories(
          *,
          session_story:session_stories(*)
        )
      `)
      .single();

    if (data && !error) {
      const newAction = {
        ...data,
        storyId: data.story_id,
        actionName: data.action_name,
        actionSummary: data.action_summary,
        actionDetails: data.action_details,
        imageUrl: data.image_url,
        docUrl: data.doc_url,
        publishDate: data.publish_date,
        story: data.story
      };

      set(state => ({
        storyActions: [newAction, ...state.storyActions]
      }));

      // Reload actions to ensure we have the latest data
      await get().loadStoryActions();
    }
  },

  updateStoryAction: async (action) => {
    const { data, error } = await supabase
      .from('story_actions')
      .update({
        story_id: action.storyId,
        action_name: action.actionName,
        action_summary: action.actionSummary,
        action_details: action.actionDetails,
        participants: action.participants,
        image_url: action.imageUrl,
        doc_url: action.docUrl,
        publish_date: action.publishDate,
        status: action.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', action.id)
      .select(`
        *,
        story:stories(
          *,
          session_story:session_stories(*)
        )
      `)
      .single();

    if (data && !error) {
      const updatedAction = {
        ...data,
        storyId: data.story_id,
        actionName: data.action_name,
        actionSummary: data.action_summary,
        actionDetails: data.action_details,
        imageUrl: data.image_url,
        docUrl: data.doc_url,
        publishDate: data.publish_date,
        story: data.story
      };

      set(state => ({
        storyActions: state.storyActions.map(a =>
          a.id === action.id ? updatedAction : a
        )
      }));
    }
  },

  deleteStoryAction: async (id) => {
    const { error } = await supabase
      .from('story_actions')
      .delete()
      .eq('id', id);

    if (!error) {
      set(state => ({
        storyActions: state.storyActions.filter(a => a.id !== id)
      }));
    }
  }
}));