'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ChatHistoryItem {
  id: string;
  question: string;
  explanation: string;
  created_at: string;
  user_email: string;
}

interface ChatHistoryProps {
  userEmail: string;
}

export default function ChatHistory({ userEmail }: ChatHistoryProps) {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/chat', {
          headers: {
            'X-User-Email': userEmail,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }

        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userEmail]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        Error: {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        No chat history found
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto rounded-lg border bg-white">
      <div className="divide-y">
        {history.map((item) => (
          <div key={item.id} className="p-4 hover:bg-gray-50">
            <div className="space-y-3">
              {/* Question */}
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-blue-500 text-white rounded-lg p-3">
                  <p className="whitespace-pre-wrap text-sm">{item.question}</p>
                </div>
              </div>

              {/* Answer */}
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-gray-100 rounded-lg p-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-900">{item.explanation}</p>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 text-right">
                {format(new Date(item.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 