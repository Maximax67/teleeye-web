'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);

  return isMobile;
}

function addMissingMessageIndicators(msgs: MessageWithGap[]): MessageWithGap[] {
  if (msgs.length < 2) return msgs;
  const sorted = [...msgs].sort((a, b) => a.message_id - b.message_id);
  const result: MessageWithGap[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    result.push(sorted[i]);
    const gap = sorted[i + 1].message_id - sorted[i].message_id - 1;
    if (gap > 0) {
      result.push({
        ...sorted[i],
        message_id: sorted[i].message_id - 0.5,
        isGap: true,
        gapCount: gap,
      });
    }
  }
  result.push(sorted[sorted.length - 1]);
  return result;
}

function HomeContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<MessageWithGap[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasMore, setHasMore] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const isMobile = useIsMobile();

  const loadMessages = useCallback(
    async (chatId: number, beforeId?: number, ignoreHasMore?: boolean) => {
      if (loadingRef.current || (!ignoreHasMore && !hasMoreRef.current)) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        if (!beforeId) {
          const cached = await dbCache.getMessages(chatId);
          if (cached.length) {
            setMessages(addMissingMessageIndicators(cached));
            if (cached.length > 50) {
              loadingRef.current = false;
              setLoading(false);
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
        hasMoreRef.current = data.has_more;
        setHasMore(data.has_more);

        if (!beforeId) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);

          // Mark as read when opening a chat
          if (data.items && data.items.length > 0) {
            const lastMsg = [...data.items].sort((a, b) => b.message_id - a.message_id)[0];
            apiClient.markChatRead(chatId, lastMsg.message_id).then(() => {
              // Update the local chats list to clear unread count
              setChats((prev) =>
                prev.map((c) => {
                  if (c.id !== chatId) return c;
                  return {
                    ...c,
                    read_messages: [{ message_thread_id: 1, message_id: lastMsg.message_id }],
                  };
                }),
              );
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [],
  );

  const handleChatSelect = useCallback(
    async (chat: Chat, pushUrl = true) => {
      if (selectedChat?.id === chat.id) return;

      if (selectedChat) {
        await dbCache.trimMessages(selectedChat.id);
      }

      setSelectedChat(chat);
      setMessages([]);
      hasMoreRef.current = true;
      setHasMore(true);
      await loadMessages(chat.id, undefined, true);
      setShowMobileChat(true);

      if (pushUrl) {
        router.push(`?chatId=${chat.id}`, { scroll: false });
      }
    },
    [selectedChat, loadMessages, router],
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isMobile) setShowMobileChat(false);
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
    setInitialized(true);
  }, [loadChats]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) initializeApp();
  }, [user, initializeApp]);

  // Handle URL param for chat selection
  useEffect(() => {
    if (!initialized || chats.length === 0) return;
    const chatIdParam = searchParams.get('chatId');
    if (!chatIdParam) return;
    const chatId = parseInt(chatIdParam);
    if (isNaN(chatId)) return;
    if (selectedChat?.id === chatId) return;
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleChatSelect(chat, false); // don't push URL again
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, chats, searchParams]);

  const handleRefresh = async () => {
    await loadChats();
    if (selectedChat) {
      hasMoreRef.current = true;
      await loadMessages(selectedChat.id, undefined, true);
    }
  };

  const handleBackToChats = () => {
    setShowMobileChat(false);
    setSelectedChat(null);
    router.push('/', { scroll: false });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
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
        <div className="flex flex-1 flex-col overflow-hidden bg-[#eae6df] dark:bg-gray-900">
          {/* Subtle chat background pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <ChatHeader selectedChat={selectedChat} onBack={handleBackToChats} />

          <div className="relative flex flex-1 flex-col overflow-hidden">
            <MessagesList
              messages={messages}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              loading={loading}
              loadMore={(beforeId) => loadMessages(selectedChat.id, beforeId)}
            />
            <MessageInput />
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center bg-[#eae6df] md:flex dark:bg-gray-900">
          <div className="space-y-3 text-center">
            <div className="text-6xl">💬</div>
            <p className="text-xl font-medium text-gray-600 dark:text-gray-300">TeleEye</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Select a chat to start viewing messages
            </p>
          </div>
        </div>
      )}

      {showMenu && <SettingsMenu onClose={() => setShowMenu(false)} />}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
