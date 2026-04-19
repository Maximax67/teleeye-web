'use client';

import { useState, useCallback } from 'react';
import type { Chat } from '@/types';
import { apiClient } from '@/lib/api';
import { dbCache } from '@/lib/indexeddb';

export interface UseChatsReturn {
  chats: Chat[];
  loading: boolean;
  loadChats: () => Promise<void>;
  updateChatReadStatus: (chatId: number, messageId: number) => void;
}

export function useChats(): UseChatsReturn {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChats = useCallback(async () => {
    setLoading(true);
    try {
      // Serve cache immediately for perceived performance
      const cached = await dbCache.getChats();
      if (cached.length > 0) setChats(cached);

      const data = await apiClient.getChats();
      setChats(data.items);
      dbCache.setChats(data.items);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChatReadStatus = useCallback((chatId: number, messageId: number) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        return {
          ...c,
          read_messages: [{ message_thread_id: 1, message_id: messageId }],
        };
      }),
    );
  }, []);

  return { chats, loading, loadChats, updateChatReadStatus };
}
