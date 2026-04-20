'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { dbCache } from '@/lib/indexeddb';
import type { Chat } from '@/types';
import type { ChatFilters } from '@/hooks';

import { ChatsSidebar } from '@/components/chats/ChatsSidebar';
import { ChatHeader } from '@/components/chats/ChatHeader';
import { MessagesList } from '@/components/messages/MessagesList';
import { MessageInput } from '@/components/messages/MessageInput';
import { SettingsMenu } from '@/components/settings/SettingsMenu';
import { useChats, useMessages, useIsMobile } from '@/hooks';

function HomeContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const { chats, loadChats, loadMore, hasMore, isLoadingMore, total, updateChatReadStatus } =
    useChats();

  const {
    listItems,
    isLoadingOlder,
    hasMoreOlder,
    isLoadingNewer,
    hasMoreNewer,
    scrollTarget,
    onScrolled,
    loadOlderMessages,
    loadNewerMessages,
  } = useMessages(selectedChat, updateChatReadStatus);

  const handleChatSelect = useCallback(
    (chat: Chat, pushUrl = true) => {
      if (selectedChat?.id === chat.id) return;
      setSelectedChat(chat);
      setShowMobileChat(true);
      if (pushUrl) router.push(`?chatId=${chat.id}`, { scroll: false });
    },
    [selectedChat, router],
  );

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isMobile) setShowMobileChat(false);
  }, [isMobile]);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      await dbCache.init();
      await loadChats();
      setInitialized(true);
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!initialized || chats.length === 0) return;
    const chatIdParam = searchParams.get('chatId');
    if (!chatIdParam) return;
    const chatId = parseInt(chatIdParam, 10);
    if (isNaN(chatId) || selectedChat?.id === chatId) return;
    const chat = chats.find((c) => c.id === chatId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (chat) handleChatSelect(chat, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, chats, searchParams]);

  const handleBackToChats = useCallback(() => {
    setShowMobileChat(false);
    setSelectedChat(null);
    router.push('/', { scroll: false });
  }, [router]);

  const handleRefresh = useCallback(
    async (filters?: ChatFilters) => {
      await loadChats(filters);
    },
    [loadChats],
  );

  const handleFilterChange = useCallback(
    (filters: ChatFilters) => {
      void loadChats(filters);
    },
    [loadChats],
  );

  // ── Loading screen ─────────────────────────────────────────────────────────
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
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
        onRefresh={handleRefresh}
        onShowMenu={() => setShowMenu(true)}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onFilterChange={handleFilterChange}
        total={total}
      />

      {selectedChat ? (
        <div className="flex flex-1 flex-col overflow-hidden bg-[#eae6df] dark:bg-gray-900">
          <ChatHeader selectedChat={selectedChat} onBack={handleBackToChats} />

          <div className="relative flex flex-1 flex-col overflow-hidden">
            <MessagesList
              listItems={listItems}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              isLoadingOlder={isLoadingOlder}
              hasMoreOlder={hasMoreOlder}
              isLoadingNewer={isLoadingNewer}
              hasMoreNewer={hasMoreNewer}
              scrollTarget={scrollTarget}
              onScrolled={onScrolled}
              loadOlderMessages={loadOlderMessages}
              loadNewerMessages={loadNewerMessages}
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
