'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Chat, Message, MessageListItem } from '@/types';
import { buildMessageListItems, getLastReadMessageId, getThreadReadMessageId } from '@/types';
import { apiClient } from '@/lib/api';
import { dbCache } from '@/lib/indexeddb';

const BATCH_SIZE = 50;
const UNREAD_CONTEXT = 15;
const MARK_READ_DEBOUNCE_MS = 4000;

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
  onMessageVisible: (messageId: number) => void;
}

export function useMessages(
  chat: Chat | null,
  threadId: number | null,
  onMarkRead?: (chatId: number, messageId: number, threadId?: number) => void,
): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [hasMoreNewer, setHasMoreNewer] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState<number | null>(null);
  const [scrollTarget, setScrollTarget] = useState<ScrollTarget>('none');

  const chatIdRef = useRef<number | null>(null);
  const threadIdRef = useRef<number | null>(null);
  const loadingOlderRef = useRef(false);
  const loadingNewerRef = useRef(false);
  const hasMoreOlderRef = useRef(false);
  const hasMoreNewerRef = useRef(false);
  const onMarkReadRef = useRef(onMarkRead);

  // For scroll-based read tracking
  const lastMarkedIdRef = useRef<number>(0);
  const pendingReadIdRef = useRef<number | null>(null);
  const readTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onMarkReadRef.current = onMarkRead;
  }, [onMarkRead]);

  const listItems = useMemo<MessageListItem[]>(() => {
    return buildMessageListItems(messages, firstUnreadId);
  }, [messages, firstUnreadId]);

  // ── Fire the actual API call (debounced) ──────────────────────────────────
  const flushPendingRead = useCallback(() => {
    const chatId = chatIdRef.current;
    const tid = threadIdRef.current;
    const msgId = pendingReadIdRef.current;
    if (!chatId || msgId === null) return;
    pendingReadIdRef.current = null;
    void apiClient.markChatRead(chatId, msgId, tid ?? undefined);
  }, []);

  // ── Called by MessagesList whenever a message scrolls into view ───────────
  const onMessageVisible = useCallback((messageId: number) => {
    const chatId = chatIdRef.current;
    if (!chatId) return;
    if (messageId <= lastMarkedIdRef.current) return;

    lastMarkedIdRef.current = messageId;
    pendingReadIdRef.current = messageId;

    // Update sidebar counter immediately
    onMarkReadRef.current?.(chatId, messageId, threadIdRef.current ?? 1);

    // Debounce the API call
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    readTimerRef.current = setTimeout(flushPendingRead, MARK_READ_DEBOUNCE_MS);
  }, [flushPendingRead]);

  // ── Cleanup timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (readTimerRef.current) clearTimeout(readTimerRef.current);
    };
  }, []);

  // ── Hard mark-read helper (e.g. when reaching bottom) ────────────────────
  const markRead = useCallback((chatId: number, messageId: number) => {
    if (readTimerRef.current) clearTimeout(readTimerRef.current);
    pendingReadIdRef.current = null;
    lastMarkedIdRef.current = messageId;
    void apiClient.markChatRead(chatId, messageId, threadIdRef.current ?? undefined);
    onMarkReadRef.current?.(chatId, messageId, threadIdRef.current ?? 1);
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  const loadInitial = useCallback(async (chatObj: Chat, tid: number | null) => {
    if (loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);

    try {
      const cached = await dbCache.getMessages(chatObj.id);
      if (cached.length > 0) {
        const filtered = tid
          ? cached.filter(m => (m.message_thread_id ?? 1) === tid)
          : cached;
        setMessages(filtered.sort((a, b) => a.message_id - b.message_id));
      }

      const lastReadId = tid
        ? getThreadReadMessageId(chatObj, tid)
        : (getLastReadMessageId(chatObj) ?? 0);
      const latestId = chatObj.last_message?.message_id;
      const hasUnread =
        latestId !== undefined && lastReadId < latestId;

      if (hasUnread) {
        const afterId = Math.max(0, lastReadId - UNREAD_CONTEXT);
        const data = await apiClient.getChatMessages(
          chatObj.id, BATCH_SIZE, undefined, afterId, tid ?? undefined,
        );

        if (data.items.length > 0) {
          await dbCache.setMessages(chatObj.id, data.items);
          const all = await dbCache.getMessages(chatObj.id);
          const filtered = tid
            ? all.filter(m => (m.message_thread_id ?? 1) === tid)
            : all;
          setMessages(filtered.sort((a, b) => a.message_id - b.message_id));
        }

        hasMoreOlderRef.current = data.has_more_older;
        hasMoreNewerRef.current = data.has_more_newer;
        setHasMoreOlder(data.has_more_older);
        setHasMoreNewer(data.has_more_newer);
        setFirstUnreadId(lastReadId + 1);
        setScrollTarget('unread');
      } else {
        const data = await apiClient.getChatMessages(
          chatObj.id, BATCH_SIZE, undefined, undefined, tid ?? undefined,
        );

        if (data.items.length > 0) {
          await dbCache.setMessages(chatObj.id, data.items);
          const all = await dbCache.getMessages(chatObj.id);
          const filtered = tid
            ? all.filter(m => (m.message_thread_id ?? 1) === tid)
            : all;
          setMessages(filtered.sort((a, b) => a.message_id - b.message_id));

          const latestItem = data.items.reduce((a, b) =>
            a.message_id > b.message_id ? a : b,
          );
          markRead(chatObj.id, latestItem.message_id);
          lastMarkedIdRef.current = latestItem.message_id;
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
  }, [markRead]);

  // ── Load older messages ───────────────────────────────────────────────────
  const loadOlderMessages = useCallback(async (beforeId: number) => {
    const chatId = chatIdRef.current;
    const tid = threadIdRef.current;
    if (!chatId || loadingOlderRef.current || !hasMoreOlderRef.current) return;

    loadingOlderRef.current = true;
    setIsLoadingOlder(true);

    try {
      const data = await apiClient.getChatMessages(
        chatId, BATCH_SIZE, beforeId, undefined, tid ?? undefined,
      );

      if (data.items.length > 0) {
        await dbCache.setMessages(chatId, data.items);
        const all = await dbCache.getMessages(chatId);
        const filtered = tid
          ? all.filter(m => (m.message_thread_id ?? 1) === tid)
          : all;
        setMessages(filtered.sort((a, b) => a.message_id - b.message_id));
      }

      hasMoreOlderRef.current = data.has_more_older;
      setHasMoreOlder(data.has_more_older);
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }, []);

  // ── Load newer messages ───────────────────────────────────────────────────
  const loadNewerMessages = useCallback(async (afterId: number) => {
    const chatId = chatIdRef.current;
    const tid = threadIdRef.current;
    if (!chatId || loadingNewerRef.current || !hasMoreNewerRef.current) return;

    loadingNewerRef.current = true;
    setIsLoadingNewer(true);

    try {
      const data = await apiClient.getChatMessages(
        chatId, BATCH_SIZE, undefined, afterId, tid ?? undefined,
      );

      if (data.items.length > 0) {
        await dbCache.setMessages(chatId, data.items);
        const all = await dbCache.getMessages(chatId);
        const filtered = tid
          ? all.filter(m => (m.message_thread_id ?? 1) === tid)
          : all;
        setMessages(filtered.sort((a, b) => a.message_id - b.message_id));

        if (!data.has_more_newer) {
          const latestItem = data.items.reduce((a, b) =>
            a.message_id > b.message_id ? a : b,
          );
          markRead(chatId, latestItem.message_id);
          lastMarkedIdRef.current = latestItem.message_id;
        }
      }

      hasMoreNewerRef.current = data.has_more_newer;
      setHasMoreNewer(data.has_more_newer);
    } finally {
      loadingNewerRef.current = false;
      setIsLoadingNewer(false);
    }
  }, [markRead]);

  // ── React to chat OR thread change ────────────────────────────────────────
  useEffect(() => {
    // Flush any pending read before switching
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      flushPendingRead();
    }

    if (!chat) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      setFirstUnreadId(null);
      setHasMoreOlder(false);
      setHasMoreNewer(false);
      setScrollTarget('none');
      chatIdRef.current = null;
      threadIdRef.current = null;
      hasMoreOlderRef.current = false;
      hasMoreNewerRef.current = false;
      lastMarkedIdRef.current = 0;
      return;
    }

    const prevChatId = chatIdRef.current;

    if (prevChatId !== null && prevChatId !== chat.id) {
      void dbCache.trimMessages(prevChatId);
    }

    chatIdRef.current = chat.id;
    threadIdRef.current = threadId;
    lastMarkedIdRef.current = threadId
      ? getThreadReadMessageId(chat, threadId)
      : (getLastReadMessageId(chat) ?? 0);

    setMessages([]);
    setFirstUnreadId(null);
    setScrollTarget('none');
    hasMoreOlderRef.current = false;
    hasMoreNewerRef.current = false;
    setHasMoreOlder(false);
    setHasMoreNewer(false);
    loadingOlderRef.current = false;
    loadingNewerRef.current = false;

    void loadInitial(chat, threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id, threadId]);

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
    onMessageVisible,
  };
}
