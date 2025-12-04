import { ChevronLeft } from 'lucide-react';
import { Chat } from '@/types';
import { getChatTitle } from '@/lib/utils';
import { ChatAvatar } from './ChatAvatar';

interface ChatHeaderProps {
  selectedChat: Chat;
  onBack: () => void;
}

export const ChatHeader = ({ selectedChat, onBack }: ChatHeaderProps) => {
  const chatTitle = getChatTitle(selectedChat);

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={onBack}
        className="rounded-lg p-2 hover:bg-gray-100 md:hidden dark:hover:bg-gray-700"
      >
        <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
      </button>

      <ChatAvatar chat={selectedChat} />

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold text-gray-900 dark:text-white">{chatTitle}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Chat ID: {selectedChat.id}</p>
      </div>
    </div>
  );
};
