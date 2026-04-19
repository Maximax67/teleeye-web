'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { RefreshCw, Menu, Sun, Moon, Search, X, SlidersHorizontal } from 'lucide-react';
import { Chat, Bot } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks';
import { ChatListItem } from './ChatListItem';
import { ResizableDivider } from '../ui/ResizableDivider';
import { apiClient } from '@/lib/api';
import type { ChatFilters } from '@/hooks';

const CHAT_TYPES = [
  { value: 'private', label: 'Private' },
  { value: 'group', label: 'Group' },
  { value: 'supergroup', label: 'Super' },
  { value: 'channel', label: 'Channel' },
] as const;

interface ChatsSidebarProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  showMobileChat: boolean;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  onRefresh: (filters?: ChatFilters) => void;
  onShowMenu: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onFilterChange: (filters: ChatFilters) => void;
  total: number;
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
  hasMore,
  isLoadingMore,
  onLoadMore,
  onFilterChange,
  total,
}: ChatsSidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBotIds, setSelectedBotIds] = useState<number[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const sidebarStyle = isMobile ? { width: '100%' } : { width: `${sidebarWidth}px` };

  // ── Load bots for filter UI ───────────────────────────────────────────────
  useEffect(() => {
    apiClient
      .getBots()
      .then((data) => setBots(data.bots || []))
      .catch(() => {
        /* silently ignore */
      });
  }, []);

  // ── Debounced filter propagation ─────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        search: search.trim() || undefined,
        chatTypes: selectedTypes.length ? selectedTypes : undefined,
        botIds: selectedBotIds.length ? selectedBotIds : undefined,
      });
    }, 250);

    return () => clearTimeout(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedTypes, selectedBotIds]);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    onRefresh({
      search: search.trim() || undefined,
      chatTypes: selectedTypes.length ? selectedTypes : undefined,
      botIds: selectedBotIds.length ? selectedBotIds : undefined,
    });
    // Give the refresh a visual moment
    setTimeout(() => setRefreshing(false), 600);
  }, [onRefresh, search, selectedTypes, selectedBotIds]);

  // ── Clear all filters ─────────────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedTypes([]);
    setSelectedBotIds([]);
  }, []);

  const hasActiveFilters = search.trim() || selectedTypes.length > 0 || selectedBotIds.length > 0;

  // ── Type toggle ───────────────────────────────────────────────────────────
  const toggleType = useCallback((type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  const toggleBot = useCallback((botId: number) => {
    setSelectedBotIds((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId],
    );
  }, []);

  // ── Unread badge total ────────────────────────────────────────────────────
  const totalUnread = useMemo(() => {
    return chats.reduce((sum, c) => {
      const last = c.last_message?.message_id || 0;
      const read = c.read_messages?.[0]?.message_id || 0;
      return sum + Math.max(0, last - read);
    }, 0);
  }, [chats]);

  // ── Infinite scroll on the chat list ─────────────────────────────────────
  const handleChatListScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop - clientHeight < 150 && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore],
  );

  return (
    <>
      <div
        className={`${showMobileChat ? 'hidden' : 'flex'} flex-col border-r border-gray-200 bg-white md:flex dark:border-gray-800 dark:bg-gray-900`}
        style={sidebarStyle}
      >
        {/* ── Header ── */}
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
                {totalUnread > 999 ? '999+' : totalUnread}
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

        {/* ── Search row ── */}
        <div className="flex items-center gap-1.5 px-3 py-2">
          <div className="relative flex-1">
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
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`rounded-lg p-2 transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
            title="Filters"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="space-y-2 border-b border-gray-100 px-3 pb-2 dark:border-gray-800">
            {/* Chat type filter */}
            <div>
              <p className="mb-1 text-[10px] font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                Chat type
              </p>
              <div className="flex flex-wrap gap-1">
                {CHAT_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleType(value)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      selectedTypes.includes(value)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot filter (only when user has ≥2 bots) */}
            {bots.length >= 2 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  Bot
                </p>
                <div className="flex flex-wrap gap-1">
                  {bots.map((bot) => (
                    <button
                      key={bot.id}
                      onClick={() => toggleBot(bot.id)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        selectedBotIds.includes(bot.id)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      @{bot.username}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Chat list with infinite scroll ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin' }}
          onScroll={handleChatListScroll}
        >
          {chats.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              {hasActiveFilters ? 'No chats match the filters' : 'No chats available'}
            </div>
          ) : (
            <>
              {chats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  selected={selectedChat?.id === chat.id}
                  onClick={() => onSelectChat(chat)}
                />
              ))}

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
              )}

              {/* End of list hint */}
              {!hasMore && chats.length > 0 && total > chats.length && (
                <p className="py-2 text-center text-xs text-gray-400 dark:text-gray-600">
                  All {total} chats loaded
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {!isMobile && (
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
