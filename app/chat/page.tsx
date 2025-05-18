'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import ChatHistory from '@/components/ChatHistory';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user?.email) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    async function fetchHistory() {
      if (!user?.email) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/chat', {
          method: 'GET',
          headers: { 'x-user-email': user.email },
        });
        const data = await res.json();
        if (res.ok && data.history) {
          // Map history to ChatMessage[]
          const history: ChatMessage[] = [];
          data.history.reverse().forEach((item: any) => {
            history.push({
              id: item.id + '-user',
              role: 'user',
              content: item.question,
              created_at: item.created_at,
            });
            history.push({
              id: item.id + '-assistant',
              role: 'assistant',
              content: item.explanation,
              created_at: item.created_at,
            });
          });
          setMessages(history);
        } else {
          setError(data.error || 'Failed to load history');
        }
      } catch (e) {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user?.email]);

  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !user?.email) return;
    setLoading(true);
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, userEmail: user.email }),
      });
      const data = await res.json();
      if (res.ok && data.explanation) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.explanation },
        ]);
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (e) {
      setError('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!user?.email) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-gray-400 text-center mt-8">No messages yet. Start the conversation!</div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg shadow-sm whitespace-pre-line break-words ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white self-end'
                    : 'bg-gray-100 text-gray-900 self-start'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex mb-4 justify-start">
              <div className="max-w-[70%] px-4 py-2 rounded-lg shadow-sm bg-gray-100 text-gray-900 self-start">
                <span className="inline-block animate-pulse">...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="text-center text-red-500 mt-2">{error}</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full p-3 pr-12 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-[200px]"
                rows={1}
                disabled={loading}
              />
              <button
                type="submit"
                className="absolute right-2 bottom-2 p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-400"
                disabled={loading || !input.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 