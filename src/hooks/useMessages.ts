'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Chat, Message, MessageListItem } from '@/types';
import { buildMessageListItems, getLastReadMessageId } from '@/types';
import { apiClient } from '@/lib/api';
import { dbCache } from '@/lib/indexeddb';

/** How many messages before the first unread to load as context */
const BATCH_SIZE = 50;
const UNREAD_CONTEXT = 15;

export type ScrollTarget = 'bottom' | 'unread' | 'none';

export interface UseMessagesReturn {
  listItems: MessageListItem[];
  isLoadingOlder: boolean;
  hasMoreOlder: boolean;
  isLoadingNewer: boolean;
  hasMoreNewer: boolean;
  firstUnreadId: number | null;
  scrollTarget: ScrollTarget;
  onScrolled: () => void;
  loadOlderMessages: (beforeId: number) => Promise<void>;
  loadNewerMessages: (afterId: number) => Promise<void>;
}

export function useMessages(chat: Chat | null): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [hasMoreNewer, setHasMoreNewer] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState<number | null>(null);
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget>('none');

  // Refs to avoid stale-closure problems inside callbacks
  const chatIdRef = useRef<number | null>(null);
  const loadingOlderRef = useRef(false);
  const loadingNewerRef = useRef(false);
  const hasMoreOlderRef = useRef(false);
  const hasMoreNewerRef = useRef(false);

  // ── Derive listItems via memo ─────────────────────────────────────────────

  const listItems = useMemo<MessageListItem[]>(() => {
    return buildMessageListItems(messages, firstUnreadId);
  }, [messages, firstUnreadId]);

  // ── Initial load ──────────────────────────────────────────────────────────

  const loadInitial = useCallback(async (chatObj: Chat) => {
    if (loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);

    try {
      // Serve cached messages immediately for perceived speed
      const cached = await dbCache.getMessages(chatObj.id);
      if (cached.length > 0) {
        setMessages(cached.sort((a, b) => a.message_id - b.message_id));
      }

      const lastReadId = getLastReadMessageId(chatObj);
      const latestId = chatObj.last_message?.message_id;
      const hasUnread =
        lastReadId !== null && latestId !== undefined && lastReadId < latestId;

      if (hasUnread) {
        // ── Load around the unread boundary ─────────────────────────────────
        // after_id: start just before the unread separator for context
        const afterId = Math.max(0, lastReadId - UNREAD_CONTEXT);
        const data = await apiClient.getChatMessages(chatObj.id, BATCH_SIZE, undefined, afterId);

        if (data.items.length > 0) {
          await dbCache.setMessages(chatObj.id, data.items);
          // Re-read from cache to merge with any previously cached messages
          const all = await dbCache.getMessages(chatObj.id);
          setMessages(all.sort((a, b) => a.message_id - b.message_id));
        }

        hasMoreOlderRef.current = data.has_more_older;
        hasMoreNewerRef.current = data.has_more_newer;
        setHasMoreOlder(data.has_more_older);
        setHasMoreNewer(data.has_more_newer);
        setFirstUnreadId(lastReadId + 1);
        setScrollTarget('unread');
      } else {
        // ── Load the latest messages ─────────────────────────────────────────
        const data = await apiClient.getChatMessages(chatObj.id, BATCH_SIZE);

        if (data.items.length > 0) {
          await dbCache.setMessages(chatObj.id, data.items);
          const all = await dbCache.getMessages(chatObj.id);
          setMessages(all.sort((a, b) => a.message_id - b.message_id));

          // Mark as read: we're at the end of history
          const latestItem = data.items.reduce((a, b) =>
            a.message_id > b.message_id ? a : b,
          );
          void apiClient.markChatRead(chatObj.id, latestItem.message_id);
        }

        hasMoreOlderRef.current = data.has_more_older;
        hasMoreNewerRef.current = false;
        setHasMoreOlder(data.has_more_older);
        setHasMoreNewer(false);
        setFirstUnreadId(null);
        setScrollTarget('bottom');
      }
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }, []);

  // ── Load older messages (scroll up) ──────────────────────────────────────

  const loadOlderMessages = useCallback(async (beforeId: number) => {
    const chatId = chatIdRef.current;
    if (!chatId || loadingOlderRef.current || !hasMoreOlderRef.current) return;

    loadingOlderRef.current = true;
    setIsLoadingOlder(true);

    try {
      const data = await apiClient.getChatMessages(chatId, BATCH_SIZE, beforeId);

      if (data.items.length > 0) {
        await dbCache.setMessages(chatId, data.items);
        const all = await dbCache.getMessages(chatId);
        setMessages(all.sort((a, b) => a.message_id - b.message_id));
      }

      hasMoreOlderRef.current = data.has_more_older;
      setHasMoreOlder(data.has_more_older);
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }, []);

  // ── Load newer messages (scroll down) ────────────────────────────────────

  const loadNewerMessages = useCallback(async (afterId: number) => {
    const chatId = chatIdRef.current;
    if (!chatId || loadingNewerRef.current || !hasMoreNewerRef.current) return;

    loadingNewerRef.current = true;
    setIsLoadingNewer(true);

    try {
      const data = await apiClient.getChatMessages(chatId, BATCH_SIZE, undefined, afterId);

      if (data.items.length > 0) {
        await dbCache.setMessages(chatId, data.items);
        const all = await dbCache.getMessages(chatId);
        setMessages(all.sort((a, b) => a.message_id - b.message_id));

        // When we reach the end of new messages, mark as read
        if (!data.has_more_newer) {
          const latestItem = data.items.reduce((a, b) =>
            a.message_id > b.message_id ? a : b,
          );
          void apiClient.markChatRead(chatId, latestItem.message_id);
        }
      }

      hasMoreNewerRef.current = data.has_more_newer;
      setHasMoreNewer(data.has_more_newer);
    } finally {
      loadingNewerRef.current = false;
      setIsLoadingNewer(false);
    }
  }, []);

  // ── React to chat change ──────────────────────────────────────────────────

  useEffect(() => {
    if (!chat) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      setFirstUnreadId(null);
      setHasMoreOlder(false);
      setHasMoreNewer(false);
      setScrollTarget('none');
      chatIdRef.current = null;
      hasMoreOlderRef.current = false;
      hasMoreNewerRef.current = false;
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
    hasMoreOlderRef.current = false;
    hasMoreNewerRef.current = false;
    setHasMoreOlder(false);
    setHasMoreNewer(false);
    loadingOlderRef.current = false;
    loadingNewerRef.current = false;

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
    isLoadingNewer,
    hasMoreNewer,
    firstUnreadId,
    scrollTarget,
    onScrolled,
    loadOlderMessages,
    loadNewerMessages,
  };
}
