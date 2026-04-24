'use client';

import type { Message, TelegramUserInfo } from '@/types';
import { formatMessageTime } from '@/lib/utils';

// ─── Service message ──────────────────────────────────────────────────────────

function userName(u: TelegramUserInfo): string {
  return `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}`;
}

function serviceText(message: Message): string {
  if (message.new_chat_members?.length) {
    return `${message.new_chat_members.map(userName).join(', ')} joined the group`;
  }
  if (message.left_chat_member) return `${userName(message.left_chat_member)} left the group`;
  if (message.new_chat_title) return `Group renamed to "${message.new_chat_title}"`;
  if (message.delete_chat_photo) return 'Group photo removed';
  if (message.new_chat_photo) return 'Group photo updated';
  if (message.group_chat_created) return 'Group created';
  if (message.supergroup_chat_created) return 'Supergroup created';
  if (message.channel_chat_created) return 'Channel created';
  if (message.pinned_message) return 'Message pinned';
  if (message.migrate_to_chat_id) return 'Group upgraded to supergroup';
  return 'Service message';
}

interface ServiceMessageProps {
  message: Message;
}

export function ServiceMessage({ message }: ServiceMessageProps) {
  return (
    <div className="my-1.5 flex justify-center" data-message-id={message.message_id}>
      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        {serviceText(message)}
      </div>
    </div>
  );
}

// ─── Sender name ──────────────────────────────────────────────────────────────

const SENDER_COLORS = [
  'text-blue-600',
  'text-rose-500',
  'text-amber-600',
  'text-emerald-600',
  'text-violet-600',
  'text-cyan-600',
];

interface SenderNameProps {
  user: TelegramUserInfo;
}

export function SenderName({ user }: SenderNameProps) {
  const color = SENDER_COLORS[Math.abs(user.id) % SENDER_COLORS.length];

  return (
    <p className={`mb-0.5 text-xs font-semibold ${color} dark:opacity-90`}>
      {user.first_name} {user.last_name ?? ''}
      {user.username && <span className="ml-1 font-normal opacity-60">@{user.username}</span>}
    </p>
  );
}

// ─── Message footer (timestamp + edited) ─────────────────────────────────────

interface MessageFooterProps {
  message: Message;
  isOutgoing: boolean;
}

export function MessageFooter({ message, isOutgoing }: MessageFooterProps) {
  return (
    <div
      className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${
        isOutgoing ? 'text-blue-100/80' : 'text-gray-400 dark:text-gray-500'
      }`}
    >
      {message.edit_date && <span className="opacity-70">edited</span>}
      <span className="tabular-nums">{formatMessageTime(message.date)}</span>
    </div>
  );
}
