'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { dbCache } from '@/lib/indexeddb';
import { Chat, MessageWithGap } from '@/types';

import { ChatsSidebar } from '@/components/chats/ChatsSidebar';
import { ChatHeader } from '@/components/chats/ChatHeader';
import { MessagesList } from '@/components/messages/MessagesList';
import { MessageInput } from '@/components/messages/MessageInput';
import { SettingsMenu } from '@/components/settings/SettingsMenu';
import { MESSAGE_LOAD_BATCH_SIZE } from '@/constants';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<MessageWithGap[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(
      typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
    );

    useEffect(() => {
      const handler = () => setIsMobile(window.innerWidth < breakpoint);
      window.addEventListener('resize', handler);
      return () => window.removeEventListener('resize', handler);
    }, [breakpoint]);

    return isMobile;
  };

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setShowMobileChat(false);
    }
  }, [isMobile]);

  const loadChats = useCallback(async () => {
    try {
      const cachedChats = await dbCache.getChats();
      if (cachedChats.length) setChats(cachedChats);

      const data = await apiClient.getChats();
      setChats(data.items);
      dbCache.setChats(data.items);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  }, []);

  const initializeApp = useCallback(async () => {
    await dbCache.init();
    await loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (user) initializeApp();
  }, [user, initializeApp]);

  const loadMessages = useCallback(
    async (chatId: number, beforeId?: number, ignoreHasMore?: boolean) => {
      if (loading || (!ignoreHasMore && !hasMore)) return;

      setLoading(true);
      try {
        if (!beforeId) {
          const cached = await dbCache.getMessages(chatId);
          if (cached.length) {
            setMessages(addMissingMessageIndicators(cached));

            if (cached.length > 50) {
              return;
            }
          }
        }

        const data = await apiClient.getChatMessages(chatId, MESSAGE_LOAD_BATCH_SIZE, beforeId);
        if (data.items) {
          dbCache.setMessages(chatId, data.items);
        }

        const all = await dbCache.getMessages(chatId);
        setMessages(addMissingMessageIndicators(all));
        setHasMore(data.has_more);

        if (!beforeId) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore],
  );

  const addMissingMessageIndicators = (msgs: MessageWithGap[]) => {
    if (msgs.length < 2) return msgs;
    const sorted = [...msgs].sort((a, b) => a.message_id - b.message_id);
    const result: MessageWithGap[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      result.push(sorted[i]);
      const gap = sorted[i + 1].message_id - sorted[i].message_id - 1;
      if (gap > 0)
        result.push({
          ...sorted[i],
          message_id: sorted[i].message_id - 0.5,
          isGap: true,
          gapCount: gap,
        });
    }
    result.push(sorted[sorted.length - 1]);
    return result;
  };

  const handleRefresh = async () => {
    await loadChats();
    if (selectedChat) {
      await loadMessages(selectedChat.id, undefined, true);
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    if (selectedChat?.id !== chat.id) {
      if (selectedChat) {
        await dbCache.trimMessages(selectedChat.id);
      }

      setSelectedChat(chat);
      await loadMessages(chat.id, undefined, true);
      setShowMobileChat(true);
    }
  };

  const handleBackToChats = () => {
    setShowMobileChat(false);
    setSelectedChat(null);
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <ChatsSidebar
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={handleChatSelect}
        showMobileChat={showMobileChat}
        setSidebarWidth={setSidebarWidth}
        sidebarWidth={sidebarWidth}
        onRefresh={handleRefresh}
        onShowMenu={() => setShowMenu(true)}
      />

      {selectedChat ? (
        <div className="flex flex-1 flex-col bg-gray-50 dark:bg-gray-900">
          <ChatHeader selectedChat={selectedChat} onBack={handleBackToChats} />
          <MessagesList
            messages={messages}
            messagesEndRef={messagesEndRef}
            messagesContainerRef={messagesContainerRef}
            loading={loading}
            loadMore={(beforeId) => loadMessages(selectedChat.id, beforeId)}
          />
          <MessageInput />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <span className="text-6xl">💬</span>
            <p className="text-xl font-medium">Select a chat to start</p>
            <p className="mt-2 text-sm">Choose a conversation from the sidebar</p>
          </div>
        </div>
      )}

      {showMenu && <SettingsMenu onClose={() => setShowMenu(false)} />}
    </div>
  );
}
