'use client';

import { useCallback, useEffect, useRef } from 'react';
import { MessageWithGap } from '@/types';
import { Message } from './Message';

interface MessagesListProps {
  messages: MessageWithGap[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
  loadMore: (beforeId?: number) => void;
}

export const MessagesList = ({
  messages,
  messagesEndRef,
  messagesContainerRef,
  loading,
  loadMore,
}: MessagesListProps) => {
  const prevScrollHeight = useRef(0);

  // Preserve scroll position when prepending older messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const newScrollHeight = container.scrollHeight;
    if (prevScrollHeight.current > 0 && newScrollHeight > prevScrollHeight.current) {
      const delta = newScrollHeight - prevScrollHeight.current;
      container.scrollTop = container.scrollTop + delta;
    }
    prevScrollHeight.current = newScrollHeight;
  }, [messages.length, messagesContainerRef]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || loading) return;

    if (container.scrollTop < 150) {
      const oldest = messages.find((m) => !m.isGap);
      loadMore(oldest?.message_id);
    }
  }, [loading, messages, loadMore, messagesContainerRef]);

  if (messages.length === 0 && !loading) {
    return (
      <div
        ref={messagesContainerRef}
        className="flex flex-1 items-center justify-center text-gray-400 dark:text-gray-500"
      >
        <div className="space-y-2 text-center">
          <p className="text-4xl">💬</p>
          <p className="text-sm font-medium">No messages yet</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-x-hidden overflow-y-auto"
      style={{ scrollbarWidth: 'thin' }}
    >
      {/* Loading older messages spinner */}
      {loading && messages.length > 0 && (
        <div className="flex justify-center py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* Initial loading */}
      {loading && messages.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* Messages */}
      <div className="space-y-px px-3 py-3">
        {messages.map((msg, idx) => (
          <Message
            key={msg.isGap ? `gap-${msg.message_id}` : `msg-${msg.message_id || idx}`}
            message={msg}
          />
        ))}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
};
