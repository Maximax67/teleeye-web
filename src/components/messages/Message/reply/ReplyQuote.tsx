'use client';

import type { Message } from '@/types';
import { useFileUrl } from '@/lib/fileLoader';

interface ReplyQuoteProps {
  replyMessage: Message;
  isOutgoing: boolean;
}

function replyPreview(message: Message): string {
  if (message.text) return message.text;
  if (message.caption) return message.caption;
  if (message.photo) return '📷 Photo';
  if (message.video) return '🎬 Video';
  if (message.audio) return '🎵 Audio';
  if (message.voice) return '🎤 Voice';
  if (message.document) return `📎 ${message.document.file_name ?? 'File'}`;
  if (message.sticker) return `${message.sticker.emoji ?? ''} Sticker`;
  if (message.animation) return '🎭 GIF';
  if (message.location) return '📍 Location';
  if (message.contact) return '👤 Contact';
  if (message.poll) return `📊 ${message.poll.question}`;
  return 'Message';
}

function getThumbId(message: Message): string | undefined {
  if (message.photo?.length) return message.photo[0].file_unique_id;
  if (message.video?.thumbnail) return message.video.thumbnail.file_unique_id;
  if (message.document?.thumbnail) return message.document.thumbnail.file_unique_id;
  return undefined;
}

function ReplyThumb({ fileUniqueId }: { fileUniqueId: string }) {
  const { url } = useFileUrl(fileUniqueId, 3);
  if (!url) return null;
  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

function getSenderName(message: Message): string {
  if (message.from) {
    const { first_name, last_name } = message.from;
    return `${first_name}${last_name ? ' ' + last_name : ''}`;
  }
  if (message.sender_chat?.title) return message.sender_chat.title;
  return 'Unknown';
}

export function ReplyQuote({ replyMessage, isOutgoing }: ReplyQuoteProps) {
  const thumbId = getThumbId(replyMessage);
  const senderName = getSenderName(replyMessage);
  const preview = replyPreview(replyMessage);

  return (
    <div
      className={`mb-1 flex gap-2 rounded border-l-2 px-2 py-1 text-sm ${
        isOutgoing
          ? 'border-white/50 bg-white/10'
          : 'border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
      }`}
    >
      {thumbId && <ReplyThumb fileUniqueId={thumbId} />}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-semibold ${
            isOutgoing ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
          }`}
        >
          {senderName}
        </p>
        <p className="truncate text-xs opacity-70">{preview}</p>
      </div>
    </div>
  );
}

interface ForwardHeaderProps {
  forwardLabel: string;
  isOutgoing: boolean;
}

export function ForwardHeader({ forwardLabel, isOutgoing }: ForwardHeaderProps) {
  return (
    <div
      className={`mb-1 flex items-center gap-1 text-xs font-medium ${
        isOutgoing ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
      }`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 opacity-70" aria-hidden>
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
      </svg>
      Forwarded from <span className="font-semibold">{forwardLabel}</span>
    </div>
  );
}
