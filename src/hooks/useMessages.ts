'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Chat, Message, MessageListItem } from '@/types';
import { buildMessageListItems, getLastReadMessageId } from '@/types';
import { apiClient } from '@/lib/api';
import { dbCache } from '@/lib/indexeddb';

const BATCH_SIZE = 50;

export type ScrollTarget = 'bottom' | 'unread' | 'none';

export interface UseMessagesReturn {
  listItems: MessageListItem[];
  isLoadingOlder: boolean;
  hasMoreOlder: boolean;
  firstUnreadId: number | null;
  /** Where to scroll after the initial render */
  scrollTarget: ScrollTarget;
  /** Call once the initial scroll has been performed */
  onScrolled: () => void;
  loadOlderMessages: (beforeId: number) => Promise<void>;
}

export function useMessages(chat: Chat | null): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState<number | null>(null);
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget>('none');

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(false);
  const chatIdRef = useRef<number | null>(null);

  // Derive sorted messages → listItems via memo
  const listItems = useMemo<MessageListItem[]>(() => {
    const sorted = [...messages].sort((a, b) => a.message_id - b.message_id);
    return buildMessageListItems(sorted, firstUnreadId);
  }, [messages, firstUnreadId]);

  // ── Initial load ──────────────────────────────────────────────────────────

  const loadInitial = useCallback(async (chatObj: Chat) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoadingOlder(true);

    try {
      // Serve cached messages first for perceived speed
      const cached = await dbCache.getMessages(chatObj.id);
      if (cached.length > 0) {
        setMessages(cached);
      }

      const data = await apiClient.getChatMessages(chatObj.id, BATCH_SIZE);

      if (data.items.length > 0) {
        await dbCache.setMessages(chatObj.id, data.items);
        const all = await dbCache.getMessages(chatObj.id);
        setMessages(all);
      }

      hasMoreRef.current = data.has_more;
      setHasMoreOlder(data.has_more);

      // Determine unread boundary
      const lastReadId = getLastReadMessageId(chatObj);
      if (lastReadId !== null) {
        const unreadStart = lastReadId + 1;
        setFirstUnreadId(unreadStart);
        setScrollTarget('unread');
      } else {
        setFirstUnreadId(null);
        setScrollTarget('bottom');
      }

      // Mark latest message as read
      const latestItem = data.items[0]; // API returns newest first
      if (latestItem) {
        void apiClient.markChatRead(chatObj.id, latestItem.message_id);
      }
    } finally {
      loadingRef.current = false;
      setIsLoadingOlder(false);
    }
  }, []);

  // ── Load older ────────────────────────────────────────────────────────────

  const loadOlderMessages = useCallback(async (beforeId: number) => {
    const chatId = chatIdRef.current;
    if (!chatId || loadingRef.current || !hasMoreRef.current) return;

    loadingRef.current = true;
    setIsLoadingOlder(true);

    try {
      const data = await apiClient.getChatMessages(chatId, BATCH_SIZE, beforeId);

      if (data.items.length > 0) {
        await dbCache.setMessages(chatId, data.items);
        const all = await dbCache.getMessages(chatId);
        setMessages(all);
      }

      hasMoreRef.current = data.has_more;
      setHasMoreOlder(data.has_more);
    } finally {
      loadingRef.current = false;
      setIsLoadingOlder(false);
    }
  }, []);

  // ── React to chat change ──────────────────────────────────────────────────

  useEffect(() => {
    if (!chat) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      setFirstUnreadId(null);
      setHasMoreOlder(false);
      setScrollTarget('none');
      chatIdRef.current = null;
      return;
    }

    // Trim previous chat cache before switching
    if (chatIdRef.current !== null && chatIdRef.current !== chat.id) {
      void dbCache.trimMessages(chatIdRef.current);
    }

    chatIdRef.current = chat.id;
    setMessages([]);
    setFirstUnreadId(null);
    setScrollTarget('none');
    hasMoreRef.current = false;

    void loadInitial(chat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id]);

  const onScrolled = useCallback(() => {
    setScrollTarget('none');
  }, []);

  return {
    listItems,
    isLoadingOlder,
    hasMoreOlder,
    firstUnreadId,
    scrollTarget,
    onScrolled,
    loadOlderMessages,
  };
}
