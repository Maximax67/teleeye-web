import { Chat } from '@/types';
import { ChatAvatar } from './ChatAvatar';
import { getChatTitle } from '@/lib/utils';

interface ChatListItemProps {
  chat: Chat;
  selected: boolean;
  onClick: () => void;
  unreadCount: number;
}

export function ChatListItem({ chat, selected, onClick, unreadCount }: ChatListItemProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const chatTitle = getChatTitle(chat);

  let lastMessageText = '';
  if (chat.last_message) {
    const fromUser = chat.last_message.from;
    if (fromUser) {
      const fromUserLabel = fromUser?.last_name
        ? `${fromUser.first_name} ${fromUser.last_name}`
        : fromUser.first_name;

      lastMessageText = `${fromUserLabel}: `;
    }

    lastMessageText += chat.last_message.text;
  }

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 p-3 transition-colors ${
        selected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <ChatAvatar chat={chat} />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="truncate font-medium text-gray-900 dark:text-white">{chatTitle}</h3>
          {chat.last_message && (
            <span className="ml-2 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {formatTime(chat.last_message.date)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="truncate text-sm text-gray-600 dark:text-gray-400">{lastMessageText}</p>
          {unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
