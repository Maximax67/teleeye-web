'use client';

import { ChevronLeft, Hash, User, Users } from 'lucide-react';
import { Chat } from '@/types';
import { getChatTitle } from '@/lib/utils';
import { ChatAvatar } from './ChatAvatar';

interface ChatHeaderProps {
  selectedChat: Chat;
  onBack: () => void;
}

export const ChatHeader = ({ selectedChat, onBack }: ChatHeaderProps) => {
  const chatTitle = getChatTitle(selectedChat);

  const getChatTypeLabel = () => {
    switch (selectedChat.type) {
      case 'private':
        return 'Private chat';
      case 'group':
        return 'Group';
      case 'supergroup':
        return 'Supergroup';
      case 'channel':
        return 'Channel';
      default:
        return selectedChat.type;
    }
  };

  const getChatTypeIcon = () => {
    switch (selectedChat.type) {
      case 'private':
        return <User size={12} />;
      case 'group':
      case 'supergroup':
        return <Users size={12} />;
      case 'channel':
        return <Hash size={12} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <button
        onClick={onBack}
        className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
      >
        <ChevronLeft size={22} className="text-gray-600 dark:text-gray-400" />
      </button>

      <ChatAvatar chat={selectedChat} priority={15} />

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm leading-tight font-semibold text-gray-900 dark:text-white">
          {chatTitle}
        </h2>
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          {getChatTypeIcon()}
          <span>{getChatTypeLabel()}</span>
          {selectedChat.username && (
            <>
              <span>·</span>
              <span>@{selectedChat.username}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
