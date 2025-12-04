import { RefreshCw, Menu, Sun, Moon } from 'lucide-react';
import { Chat } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { ChatListItem } from './ChatListItem';
import { ResizableDivider } from '../ui/ResizableDivider';

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

  return (
    <>
      <div
        className={`${showMobileChat ? 'hidden' : 'flex'} flex-col border-r border-gray-200 bg-white md:flex dark:border-gray-700 dark:bg-gray-900`}
        style={{ width: window.innerWidth >= 768 ? `${sidebarWidth}px` : '100%' }}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={onShowMenu}
            className="rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Menu size={24} className="text-gray-700 dark:text-gray-300" />
          </button>

          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">TeleEye</h1>

          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <RefreshCw size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {theme === 'light' ? (
                <Sun size={20} className="text-gray-700" />
              ) : (
                <Moon size={20} className="text-gray-300" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
              No chats available
            </div>
          ) : (
            chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                selected={selectedChat?.id === chat.id}
                onClick={() => onSelectChat(chat)}
                unreadCount={10} // TODO: Implement real unread count
              />
            ))
          )}
        </div>
      </div>

      {window.innerWidth >= 768 && (
        <ResizableDivider
          onResize={setSidebarWidth}
          initialWidth={sidebarWidth}
          minWidth={280}
          maxWidth={600}
        />
      )}
    </>
  );
};
