'use client';

import { useState, useMemo } from 'react';
import { RefreshCw, Menu, Sun, Moon, Search, X } from 'lucide-react';
import { Chat } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { ChatListItem } from './ChatListItem';
import { ResizableDivider } from '../ui/ResizableDivider';
import { getChatTitle } from '@/lib/utils';

interface ChatsSidebarProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  showMobileChat: boolean;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  onRefresh: () => void;
  onShowMenu: () => void;
}

export const ChatsSidebar = ({
  chats,
  selectedChat,
  onSelectChat,
  showMobileChat,
  sidebarWidth,
  setSidebarWidth,
  onRefresh,
  onShowMenu,
}: ChatsSidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const sidebarStyle = isMobile ? { width: '100%' } : { width: `${sidebarWidth}px` };

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter((c) => {
      const title = getChatTitle(c).toLowerCase();
      return title.includes(q) || c.username?.toLowerCase().includes(q);
    });
  }, [chats, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const totalUnread = chats.reduce((sum, c) => {
    const last = c.last_message?.message_id || 0;
    const read = c.read_messages?.[0]?.message_id || 0;
    return sum + Math.max(0, last - read);
  }, 0);

  return (
    <>
      <div
        className={`${showMobileChat ? 'hidden' : 'flex'} flex-col border-r border-gray-200 bg-white md:flex dark:border-gray-800 dark:bg-gray-900`}
        style={sidebarStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={onShowMenu}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">TeleEye</h1>
            {totalUnread > 0 && (
              <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>

          <div className="flex gap-1">
            <button
              onClick={handleRefresh}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Refresh"
            >
              <RefreshCw
                size={16}
                className={`text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'light' ? (
                <Moon size={16} className="text-gray-600" />
              ) : (
                <Sun size={16} className="text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-gray-100 py-2 pr-8 pl-8 text-sm transition-colors outline-none placeholder:text-gray-400 focus:bg-gray-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {filteredChats.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              {search ? 'No chats found' : 'No chats available'}
            </div>
          ) : (
            <div>
              {filteredChats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  selected={selectedChat?.id === chat.id}
                  onClick={() => onSelectChat(chat)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {typeof window !== 'undefined' && window.innerWidth >= 768 && (
        <ResizableDivider
          onResize={setSidebarWidth}
          initialWidth={sidebarWidth}
          minWidth={260}
          maxWidth={520}
        />
      )}
    </>
  );
};
