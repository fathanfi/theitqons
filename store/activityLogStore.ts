import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ActivityLog } from '@/types/activity';

interface ActivityLogStore {
  logs: ActivityLog[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  loadLogs: () => Promise<void>;
  loadMoreLogs: () => Promise<void>;
  addLog: (log: ActivityLog) => void;
}

const PAGE_SIZE = 20;

export const useActivityLogStore = create<ActivityLogStore>((set, get) => ({
  logs: [],
  isLoading: false,
  hasMore: true,
  page: 0,

  loadLogs: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    set({ isLoading: false });
    if (data && !error) {
      set({ logs: data, page: 1, hasMore: data.length === PAGE_SIZE });
    }
  },

  loadMoreLogs: async () => {
    const { logs, page, isLoading, hasMore } = get();
    if (isLoading || !hasMore) return;
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    set({ isLoading: false });
    if (data && !error) {
      set({
        logs: [...logs, ...data],
        page: page + 1,
        hasMore: data.length === PAGE_SIZE
      });
    }
  },

  addLog: (log) => {
    set((state) => ({ logs: [log, ...state.logs] }));
  },
})); 