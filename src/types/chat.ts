import type { Message } from './message';

export type ChatType = 'private' | 'group' | 'supergroup' | 'channel';

export interface ReadMessage {
  message_thread_id: number;
  message_id: number;
}

export interface Chat {
  id: number;
  type: ChatType;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_forum?: boolean;
  is_direct_messages?: boolean;
  last_message?: Message;
  read_messages: ReadMessage[];
}

export interface ChatsResponse {
  items: Chat[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export function getLastReadMessageId(chat: Chat): number | null {
  if (!chat.read_messages || chat.read_messages.length === 0) return 0;
  const max = Math.max(...chat.read_messages.map((r) => r.message_id));
  return max > 0 ? max : null;
}

export function getUnreadCount(chat: Chat): number {
  if (!chat.last_message) return 0;
  const lastReadId = getLastReadMessageId(chat);
  if (lastReadId === null) return 1; // at least one unread
  return Math.max(0, chat.last_message.message_id - lastReadId);
}
