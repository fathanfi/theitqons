import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
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

interface ActivitySplashProps {
  activity: ActivityLogType | null;
  onClose: () => void;
}

export function ActivitySplash({ activity, onClose }: ActivitySplashProps) {
  useEffect(() => {
    if (activity) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [activity, onClose]);

  if (!activity) return null;

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-lg border border-pink-200 flex items-center px-6 py-4 min-w-[320px] max-w-[90vw] animate-fade-in">
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-pink-400 text-lg">{ACTION_ICONS[activity.action_type] || '📝'}</span>
          <span className="text-xs text-pink-400 font-semibold">Aktivitas Baru</span>
        </div>
        <div className="text-base font-semibold text-gray-900">{activity.message}</div>
        <div className="text-xs text-gray-500 mt-1">{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</div>
      </div>
      <button onClick={onClose} className="ml-4 text-gray-400 hover:text-pink-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
} 