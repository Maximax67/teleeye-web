'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { dbCache } from '@/lib/indexeddb';
import type { Chat } from '@/types';

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
  const { chats, loadChats } = useChats();
  const { listItems, isLoadingOlder, hasMoreOlder, scrollTarget, onScrolled, loadOlderMessages } =
    useMessages(selectedChat);

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

  const handleRefresh = useCallback(async () => {
    await loadChats();
  }, [loadChats]);

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
      />

      {selectedChat ? (
        <div className="flex flex-1 flex-col overflow-hidden bg-[#eae6df] dark:bg-gray-900">
          {/* Subtle chat background pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <ChatHeader selectedChat={selectedChat} onBack={handleBackToChats} />

          <div className="relative flex flex-1 flex-col overflow-hidden">
            <MessagesList
              listItems={listItems}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              isLoadingOlder={isLoadingOlder}
              hasMoreOlder={hasMoreOlder}
              scrollTarget={scrollTarget}
              onScrolled={onScrolled}
              loadOlderMessages={loadOlderMessages}
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
