import { Chat, getUnreadCount } from '@/types';
import { ChatAvatar } from './ChatAvatar';
import { getChatTitle } from '@/lib/utils';

interface ChatListItemProps {
  chat: Chat;
  selected: boolean;
  onClick: () => void;
}

export function ChatListItem({ chat, selected, onClick }: ChatListItemProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (isThisYear) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const chatTitle = getChatTitle(chat);
  const unreadCount = getUnreadCount(chat);

  // Compose last message preview
  let lastMessageText = '';
  let lastMessagePrefix = '';
  if (chat.last_message) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = chat.last_message as any;
    const from = chat.last_message.from;

    if (from && chat.type !== 'private') {
      lastMessagePrefix = from.first_name + (from.last_name ? ' ' + from.last_name : '');
    }

    if (chat.last_message.text) {
      lastMessageText = chat.last_message.text;
    } else if (chat.last_message.caption) {
      lastMessageText = chat.last_message.caption;
    } else {
      // Media type label
      const mt = chat.last_message.message_type;
      if (mt === 'photo') lastMessageText = '📷 Photo';
      else if (mt === 'video') lastMessageText = '🎬 Video';
      else if (mt === 'audio') lastMessageText = '🎵 Audio';
      else if (mt === 'voice') lastMessageText = '🎤 Voice message';
      else if (mt === 'document') lastMessageText = `📎 ${msg?.document?.file_name || 'File'}`;
      else if (mt === 'sticker') lastMessageText = `${msg?.sticker?.emoji || '😊'} Sticker`;
      else if (mt === 'animation') lastMessageText = '🎭 GIF';
      else if (mt === 'location') lastMessageText = '📍 Location';
      else if (mt === 'contact') lastMessageText = '👤 Contact';
      else if (mt === 'poll') lastMessageText = `📊 ${msg?.poll?.question || 'Poll'}`;
      else if (mt === 'video_note') lastMessageText = '⭕ Video message';
      else if (mt === 'service') {
        if (msg?.new_chat_members?.length) lastMessageText = '👥 New members';
        else if (msg?.left_chat_member) lastMessageText = '👋 Member left';
        else if (msg?.new_chat_title) lastMessageText = `Chat renamed to "${msg.new_chat_title}"`;
        else lastMessageText = 'Service message';
      } else {
        lastMessageText = 'Message';
      }
    }
  }

  // Determine if message is outgoing (from bot)
  const isOutgoing = chat.last_message?.from?.is_bot;

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${
        selected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <ChatAvatar chat={chat} priority={selected ? 10 : 5} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`truncate text-sm font-semibold ${selected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}
          >
            {chatTitle}
          </h3>
          {chat.last_message && (
            <span
              className={`shrink-0 text-xs ${unreadCount > 0 ? 'font-medium text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {formatTime(chat.last_message.date)}
            </span>
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            {isOutgoing && (
              <span className="shrink-0 text-xs text-blue-500 dark:text-blue-400">✓</span>
            )}
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {lastMessagePrefix && (
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {lastMessagePrefix}:{' '}
                </span>
              )}
              {lastMessageText}
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="min-w-4.5 shrink-0 rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-[10px] leading-none font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
