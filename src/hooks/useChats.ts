'use client';

import { useState, useCallback, useRef } from 'react';
import type { Chat } from '@/types';
import { apiClient } from '@/lib/api';
import { dbCache } from '@/lib/indexeddb';

export interface ChatFilters {
  search?: string;
  chatTypes?: string[];
  botIds?: number[];
}

export interface UseChatsReturn {
  chats: Chat[];
  loading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  total: number;
  loadChats: (filters?: ChatFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  updateChatReadStatus: (chatId: number, messageId: number, threadId?: number) => void;
}

const PAGE_SIZE = 50;

export function useChats(): UseChatsReturn {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Refs to track current pagination state without stale closures
  const pageRef = useRef(1);
  const filtersRef = useRef<ChatFilters>({});
  const loadingRef = useRef(false);

  const fetchPage = useCallback(async (
    page: number,
    filters: ChatFilters,
    append: boolean,
  ) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    if (!append) setLoading(true);
    else setIsLoadingMore(true);

    try {
      // For page 1 without filters, serve cache immediately
      if (page === 1 && !append) {
        const cached = await dbCache.getChats();
        if (cached.length > 0) setChats(cached);
      }

      const data = await apiClient.getChats(
        page,
        PAGE_SIZE,
        filters.chatTypes,
        filters.botIds,
        filters.search,
      );

      if (append) {
        setChats(prev => [...prev, ...data.items]);
      } else {
        setChats(data.items);
        if (page === 1 && !filters.chatTypes?.length && !filters.botIds?.length && !filters.search) {
          dbCache.setChats(data.items);
        }
      }

      setHasMore(data.page < data.pages);
      setTotal(data.total);
      pageRef.current = page;
      filtersRef.current = filters;
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      loadingRef.current = false;
      if (!append) setLoading(false);
      else setIsLoadingMore(false);
    }
  }, []);

  const loadChats = useCallback(async (filters: ChatFilters = {}) => {
    await fetchPage(1, filters, false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || loadingRef.current) return;
    await fetchPage(pageRef.current + 1, filtersRef.current, true);
  }, [hasMore, isLoadingMore, fetchPage]);

  // Update read status for a specific thread (or thread 1 by default)
  const updateChatReadStatus = useCallback((chatId: number, messageId: number, threadId = 1) => {
    setChats(prev =>
      prev.map(c => {
        if (c.id !== chatId) return c;

        const existingIdx = c.read_messages.findIndex(
          r => r.message_thread_id === threadId,
        );

        let newReadMessages;
        if (existingIdx >= 0) {
          // Only update if the new messageId is higher
          if (c.read_messages[existingIdx].message_id >= messageId) return c;
          newReadMessages = c.read_messages.map((r, i) =>
            i === existingIdx ? { ...r, message_id: messageId } : r,
          );
        } else {
          newReadMessages = [
            ...c.read_messages,
            { message_thread_id: threadId, message_id: messageId },
          ];
        }

        return { ...c, read_messages: newReadMessages };
      }),
    );
  }, []);

  return {
    chats,
    loading,
    isLoadingMore,
    hasMore,
    total,
    loadChats,
    loadMore,
    updateChatReadStatus,
  };
}
