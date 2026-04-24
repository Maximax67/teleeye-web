'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, RefObject } from 'react';
import type { MessageListItem } from '@/types';
import type { ScrollTarget } from '@/hooks';
import { Message } from './Message';
import { UnreadSeparator } from './UnreadSeparator';

interface MessagesListProps {
  listItems: MessageListItem[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  isLoadingOlder: boolean;
  hasMoreOlder: boolean;
  isLoadingNewer: boolean;
  hasMoreNewer: boolean;
  scrollTarget: ScrollTarget;
  onScrolled: () => void;
  loadOlderMessages: (beforeId: number) => Promise<void>;
  loadNewerMessages: (afterId: number) => Promise<void>;
  onMessageVisible?: (messageId: number) => void;
}

export const MessagesList = ({
  listItems,
  messagesEndRef,
  messagesContainerRef,
  isLoadingOlder,
  hasMoreOlder,
  isLoadingNewer,
  hasMoreNewer,
  scrollTarget,
  onScrolled,
  loadOlderMessages,
  loadNewerMessages,
  onMessageVisible,
}: MessagesListProps) => {
  const unreadSeparatorRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Map<number, HTMLElement>>(new Map());

  // Track scroll state for restoration when prepending older messages
  const scrollRestoreRef = useRef({ savedHeight: 0, savedTop: 0, active: false });

  // ── Restore scroll position after older messages are prepended ─────────────
  useLayoutEffect(() => {
    const { active, savedHeight, savedTop } = scrollRestoreRef.current;
    if (!active) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const heightDiff = container.scrollHeight - savedHeight;
    if (heightDiff > 0) {
      container.scrollTop = savedTop + heightDiff;
    }
    scrollRestoreRef.current.active = false;
  });

  // ── Scroll to target after initial load ────────────────────────────────────
  useEffect(() => {
    if (scrollTarget === 'none' || listItems.length === 0) return;

    const rafId = requestAnimationFrame(() => {
      if (scrollTarget === 'unread' && unreadSeparatorRef.current) {
        unreadSeparatorRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        const container = messagesContainerRef.current;
        if (container) container.scrollTop = Math.max(0, container.scrollTop - 80);
      } else if (scrollTarget === 'bottom') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }
      onScrolled();
    });

    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTarget, listItems.length > 0]);

  // ── Intersection Observer for tracking visible messages ───────────────────
  useEffect(() => {
    if (!onMessageVisible) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = Number((entry.target as HTMLElement).dataset.messageId);
            if (!isNaN(messageId)) {
              onMessageVisible(messageId);
            }
          }
        });
      },
      {
        root: messagesContainerRef.current,
        rootMargin: '0px',
        threshold: 0.1, // Trigger when 10% of the message is visible
      },
    );

    observerRef.current = observer;

    // Observe all message elements
    const messageElements = messagesContainerRef.current?.querySelectorAll('[data-message-id]');
    messageElements?.forEach((el) => {
      const messageId = Number((el as HTMLElement).dataset.messageId);
      if (!isNaN(messageId)) {
        observer.observe(el);
        observedElementsRef.current.set(messageId, el as HTMLElement);
      }
    });

    const elements = observedElementsRef.current;

    return () => {
      observer.disconnect();
      elements.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listItems, onMessageVisible]);

  // ── Infinite scroll — up (older) and down (newer) ─────────────────────────
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Load older on scroll near the top
    if (!isLoadingOlder && hasMoreOlder && scrollTop < 200) {
      const firstMessage = listItems.find((item) => item.type === 'message');
      if (firstMessage && firstMessage.type === 'message') {
        scrollRestoreRef.current = {
          savedHeight: scrollHeight,
          savedTop: scrollTop,
          active: true,
        };
        void loadOlderMessages(firstMessage.message.message_id);
      }
    }

    // Load newer on scroll near the bottom
    if (!isLoadingNewer && hasMoreNewer) {
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      if (distanceFromBottom < 200) {
        const lastMessage = [...listItems].reverse().find((item) => item.type === 'message');
        if (lastMessage && lastMessage.type === 'message') {
          void loadNewerMessages(lastMessage.message.message_id);
        }
      }
    }
  }, [
    isLoadingOlder,
    hasMoreOlder,
    isLoadingNewer,
    hasMoreNewer,
    listItems,
    loadOlderMessages,
    loadNewerMessages,
    messagesContainerRef,
  ]);

  // ── Empty / initial loading state ─────────────────────────────────────────
  if (listItems.length === 0 && !isLoadingOlder) {
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
      {/* Spinner: loading older messages at the top */}
      {isLoadingOlder && listItems.length > 0 && (
        <div className="flex justify-center py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* Full-screen spinner on initial load */}
      {isLoadingOlder && listItems.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* Message list */}
      <div className="space-y-px px-3 py-3">
        {listItems.map((item) => {
          if (item.type === 'unread-separator') {
            return <UnreadSeparator key="unread-separator" ref={unreadSeparatorRef} />;
          }
          if (item.type === 'gap') {
            return (
              <div key={`gap-${item.id}`} className="my-2 flex justify-center">
                <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-500 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <span className="h-1 w-1 rounded-full bg-red-400" />
                  {item.gapCount} message{item.gapCount > 1 ? 's' : ''} missing
                </div>
              </div>
            );
          }
          return <Message key={`msg-${item.id}`} message={item.message} />;
        })}
      </div>

      {/* Spinner: loading newer messages at the bottom */}
      {isLoadingNewer && (
        <div className="flex justify-center py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
