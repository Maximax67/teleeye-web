import type { Chat } from '@/types';
import { getUnreadCount } from '@/types';
import { ChatAvatar } from './ChatAvatar';
import { getChatTitle, formatChatTime } from '@/lib/utils';

interface ChatListItemProps {
  chat: Chat;
  selected: boolean;
  onClick: () => void;
}

function getLastMessagePreview(chat: Chat): { prefix: string; text: string } {
  const msg = chat.last_message;
  if (!msg) return { prefix: '', text: '' };

  let prefix = '';
  if (msg.from && chat.type !== 'private') {
    prefix = msg.from.last_name
      ? `${msg.from.first_name} ${msg.from.last_name}`
      : msg.from.first_name;
  }

  let text = '';
  if (msg.text) {
    text = msg.text;
  } else if (msg.caption) {
    text = msg.caption;
  } else {
    const mt = msg.message_type;
    const docName = msg.document?.file_name ?? 'File';
    const stickerEmoji = msg.sticker?.emoji ?? '😊';
    const pollQ = msg.poll?.question ?? 'Poll';

    const TYPE_LABELS: Partial<Record<typeof mt, string>> = {
      photo: '📷 Photo',
      video: '🎬 Video',
      audio: '🎵 Audio',
      voice: '🎤 Voice message',
      document: `📎 ${docName}`,
      sticker: `${stickerEmoji} Sticker`,
      animation: '🎭 GIF',
      location: '📍 Location',
      contact: '👤 Contact',
      poll: `📊 ${pollQ}`,
      video_note: '⭕ Video message',
    };

    text = TYPE_LABELS[mt] ?? 'Message';
  }

  return { prefix, text };
}

export function ChatListItem({ chat, selected, onClick }: ChatListItemProps) {
  const chatTitle = getChatTitle(chat);
  const unreadCount = getUnreadCount(chat);
  const { prefix, text } = getLastMessagePreview(chat);
  const isOutgoing = chat.last_message?.from?.is_bot ?? false;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors ${
        selected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <ChatAvatar chat={chat} priority={selected ? 10 : 5} />

      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`truncate text-sm font-semibold ${
              selected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
            }`}
          >
            {chatTitle}
          </h3>
          {chat.last_message && (
            <span
              className={`shrink-0 text-xs ${
                unreadCount > 0
                  ? 'font-medium text-blue-500 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {formatChatTime(chat.last_message.date)}
            </span>
          )}
        </div>

        {/* Preview row */}
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1">
            {isOutgoing && (
              <span className="shrink-0 text-xs text-blue-500 dark:text-blue-400">✓</span>
            )}
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {prefix && (
                <span className="font-medium text-gray-700 dark:text-gray-300">{prefix}: </span>
              )}
              {text}
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="min-w-4.5 shrink-0 rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-[10px] leading-none font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
