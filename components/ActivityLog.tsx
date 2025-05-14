import { useEffect, useRef, useCallback, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useActivityLogStore } from '@/store/activityLogStore';
import { supabase } from '@/lib/supabase';
import { ActivityLog as ActivityLogType } from '@/types/activity';

const ACTION_ICONS: { [key: string]: string } = {
  points_added: '➕',
  points_removed: '➖',
  points_redeemed: '🎁',
  redemption_deleted: '🗑️',
  student_badge_added: '🏅',
  student_badge_removed: '❌',
  itqon_level_updated: '📈',
  story_action_added: '📝',
  story_action_updated: '✏️',
  story_action_deleted: '🗑️'
};

export function ActivityLog() {
  const { logs, loadLogs, loadMoreLogs, isLoading, hasMore } = useActivityLogStore();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);

  // Load initial logs (20)
  useEffect(() => {
    loadLogs().then(() => setFirstLoad(false));
  }, [loadLogs]);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('activity_logs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs'
      }, (payload) => {
        if (payload.new && !logs.some(log => log.id === payload.new.id)) {
          useActivityLogStore.getState().addLog(payload.new as ActivityLogType);
          setHighlightedId(payload.new.id);
          setTimeout(() => setHighlightedId(null), 4000);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [logs]);

  // Highlight the most recent activity on first load
  useEffect(() => {
    if (!firstLoad && logs.length > 0) {
      setHighlightedId(logs[0].id);
      const timer = setTimeout(() => setHighlightedId(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [firstLoad, logs]);

  // Infinite scroll observer
  const observer = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMoreLogs();
      }
    });
    if (node) {
      observerRef.current.observe(node);
    }
  }, [isLoading, hasMore, loadMoreLogs]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy HH:mm');
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  const timeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: undefined });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {logs.map((log, idx) => (
        <div
          key={log.id}
          className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg transition-all duration-500 ${highlightedId === log.id ? 'border-2 border-pink-400 bg-pink-50 shadow-lg' : ''}`}
        >
          <span className="text-xl">{ACTION_ICONS[log.action_type] || '📝'}</span>
          <div className="flex-1">
            <p className="text-sm text-gray-900">{log.message}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{formatDate(log.created_at)}</p>
              <span className="text-xs text-pink-500 font-semibold">• {timeAgo(log.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div ref={loadingRef} className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      )}
      {!isLoading && logs.length === 0 && (
        <p className="text-center text-gray-500 py-4">No recent activities</p>
      )}
      <div ref={observer} className="h-4" />
    </div>
  );
} 