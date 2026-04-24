'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, X, Hash } from 'lucide-react';
import type { ChatThread } from '@/types';
import { apiClient } from '@/lib/api';
import { formatMessageTime } from '@/lib/utils';

interface ThreadsPanelProps {
  chatId: number | null;
  selectedThreadId: number | null;
  onThreadSelect: (threadId: number | null) => void;
  onClose: () => void;
}

export function ThreadsPanel({
  chatId,
  selectedThreadId,
  onThreadSelect,
  onClose,
}: ThreadsPanelProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadThreads = async () => {
      if (!chatId) {
        setThreads([]);
        return;
      }

      setLoading(true);
      try {
        const data = await apiClient.getChatThreads(chatId);
        setThreads(data.items || []);
      } catch {
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    void loadThreads();
  }, [chatId]);

  const handleThreadClick = useCallback(
    (threadId: number) => {
      onThreadSelect(threadId);
    },
    [onThreadSelect],
  );

  if (!chatId) return null;

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-gray-600 dark:text-gray-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Topics</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Threads list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            No topics yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {threads.map((thread) => (
              <button
                key={thread.thread_id}
                onClick={() => handleThreadClick(thread.thread_id)}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selectedThreadId === thread.thread_id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Hash size={14} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        Topic {thread.thread_id}
                      </span>
                      {thread.unread_count > 0 && (
                        <span className="flex shrink-0 items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {thread.unread_count > 99 ? '99+' : thread.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {thread.last_message.text ||
                          thread.last_message.caption ||
                          getMessageTypeLabel(thread.last_message.message_type)}
                      </p>
                      <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                        {formatMessageTime(thread.last_message.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getMessageTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    photo: '📷 Photo',
    video: '🎬 Video',
    audio: '🎵 Audio',
    document: '📄 Document',
    sticker: '🙂 Sticker',
    voice: '🎤 Voice message',
    video_note: '📹 Video message',
    animation: '🎞️ GIF',
    location: '📍 Location',
    contact: '👤 Contact',
    poll: '📊 Poll',
  };
  return labels[type] || 'Message';
}
