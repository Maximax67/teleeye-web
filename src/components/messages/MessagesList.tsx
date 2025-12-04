import { useCallback } from 'react';
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
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || loading) return;

    if (container.scrollTop < 100) {
      const oldest = messages[0];
      const beforeId = oldest && !oldest.isGap ? oldest.message_id : undefined;
      loadMore(beforeId);
    }
  }, [loading, messages, loadMore, messagesContainerRef]);

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 space-y-2 overflow-y-auto p-4"
    >
      {loading && messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
          No messages yet
        </div>
      ) : (
        <>
          {loading && (
            <div className="flex justify-center py-2 text-sm text-gray-500 dark:text-gray-400">
              Loading more...
            </div>
          )}
          {messages.map((msg, idx) => (
            <Message key={msg.message_id || idx} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};
