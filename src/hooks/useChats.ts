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

  const pageRef = useRef(1);
  const filtersRef = useRef<ChatFilters>({});
  // isLoadingMore as a ref to avoid stale closures in loadMore
  const isLoadingMoreRef = useRef(false);
  // Request ID: each new fetch increments this. Stale responses are ignored.
  const reqIdRef = useRef(0);

  const fetchPage = useCallback(async (
    page: number,
    filters: ChatFilters,
    append: boolean,
  ) => {
    // Assign a unique ID to this request so we can discard stale responses
    // when the user types quickly and multiple requests are in-flight.
    const myReqId = ++reqIdRef.current;

    if (!append) {
      setLoading(true);
    } else {
      if (isLoadingMoreRef.current) return;
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
    }

    try {
      const isUnfiltered =
        !filters.search &&
        !filters.chatTypes?.length &&
        !filters.botIds?.length;

      // Show cached chats immediately, but ONLY for the unfiltered first page.
      // Showing the cache while a search is active would display irrelevant
      // results while the API request completes.
      if (page === 1 && !append && isUnfiltered) {
        const cached = await dbCache.getChats();
        if (cached.length > 0 && myReqId === reqIdRef.current) {
          setChats(cached);
        }
      }

      const data = await apiClient.getChats(
        page,
        PAGE_SIZE,
        filters.chatTypes,
        filters.botIds,
        filters.search,
      );

      // Discard if a newer request has already been dispatched
      if (myReqId !== reqIdRef.current) return;

      if (append) {
        setChats(prev => {
          // Deduplicate by chat id in case the backend returns overlap
          const existingIds = new Set(prev.map(c => c.id));
          const fresh = data.items.filter(c => !existingIds.has(c.id));
          return [...prev, ...fresh];
        });
      } else {
        setChats(data.items);
        // Cache only unfiltered results so searches never pollute the cache
        if (page === 1 && isUnfiltered) {
          dbCache.setChats(data.items);
        }
      }

      setHasMore(data.page < data.pages);
      setTotal(data.total);
      pageRef.current = page;
      filtersRef.current = filters;
    } catch (err) {
      if (myReqId !== reqIdRef.current) return;
      console.error('Failed to load chats:', err);
    } finally {
      if (myReqId !== reqIdRef.current) return;
      if (!append) {
        setLoading(false);
      } else {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, []);

  const loadChats = useCallback(async (filters: ChatFilters = {}) => {
    const hasActiveFilters =
      !!filters.search ||
      !!filters.chatTypes?.length ||
      !!filters.botIds?.length;

    // Clear stale results immediately when switching to a filtered view so
    // the previous unfiltered list does not flash before the response arrives.
    if (hasActiveFilters) {
      setChats([]);
    }

    await fetchPage(1, filters, false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMoreRef.current) return;
    await fetchPage(pageRef.current + 1, filtersRef.current, true);
  }, [hasMore, fetchPage]);

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
