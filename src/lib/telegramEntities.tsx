import React from 'react';
import { TelegramEntity } from '@/types';

interface Segment {
  text: string;
  entity?: TelegramEntity;
}

function splitIntoSegments(text: string, entities: TelegramEntity[]): Segment[] {
  if (!entities.length) return [{ text }];

  // Sort by offset
  const sorted = [...entities].sort((a, b) => a.offset - b.offset);
  const segments: Segment[] = [];
  let cursor = 0;

  for (const entity of sorted) {
    // Gap before entity
    if (entity.offset > cursor) {
      segments.push({ text: text.slice(cursor, entity.offset) });
    }
    // Entity segment
    segments.push({
      text: text.slice(entity.offset, entity.offset + entity.length),
      entity,
    });
    cursor = entity.offset + entity.length;
  }

  // Trailing text
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments;
}

function renderSegment(segment: Segment, key: number, isOutgoing: boolean): React.ReactNode {
  const { text, entity } = segment;
  if (!entity) return <React.Fragment key={key}>{text}</React.Fragment>;

  const linkCls = isOutgoing
    ? 'underline underline-offset-2 opacity-90 hover:opacity-100'
    : 'text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80';

  switch (entity.type) {
    case 'bold':
      return (
        <strong key={key} className="font-semibold">
          {text}
        </strong>
      );
    case 'italic':
      return (
        <em key={key} className="italic">
          {text}
        </em>
      );
    case 'underline':
      return (
        <span key={key} className="underline underline-offset-2">
          {text}
        </span>
      );
    case 'strikethrough':
      return (
        <span key={key} className="line-through opacity-80">
          {text}
        </span>
      );
    case 'spoiler':
      return <SpoilerText key={key} text={text} isOutgoing={isOutgoing} />;
    case 'code':
      return (
        <code
          key={key}
          className={`rounded px-1 py-0.5 font-mono text-[0.85em] ${
            isOutgoing
              ? 'bg-white/20'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {text}
        </code>
      );
    case 'pre':
      return (
        <pre
          key={key}
          className={`my-1 overflow-x-auto rounded p-2 font-mono text-xs ${
            isOutgoing ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          {text}
        </pre>
      );
    case 'blockquote':
    case 'expandable_blockquote':
      return (
        <blockquote
          key={key}
          className={`my-1 border-l-2 pl-2 ${
            isOutgoing ? 'border-white/50 opacity-90' : 'border-blue-400 dark:border-blue-500'
          }`}
        >
          {text}
        </blockquote>
      );
    case 'text_link':
      return (
        <a
          key={key}
          href={entity.url}
          target="_blank"
          rel="noopener noreferrer"
          className={linkCls}
        >
          {text}
        </a>
      );
    case 'url':
      return (
        <a key={key} href={text} target="_blank" rel="noopener noreferrer" className={linkCls}>
          {text}
        </a>
      );
    case 'email':
      return (
        <a key={key} href={`mailto:${text}`} className={linkCls}>
          {text}
        </a>
      );
    case 'phone_number':
      return (
        <a key={key} href={`tel:${text}`} className={linkCls}>
          {text}
        </a>
      );
    case 'mention':
      return (
        <span
          key={key}
          className={
            isOutgoing ? 'font-medium opacity-90' : 'font-medium text-blue-600 dark:text-blue-400'
          }
        >
          {text}
        </span>
      );
    case 'hashtag':
    case 'cashtag':
      return (
        <span
          key={key}
          className={
            isOutgoing ? 'font-medium opacity-90' : 'font-medium text-blue-600 dark:text-blue-400'
          }
        >
          {text}
        </span>
      );
    case 'bot_command':
      return (
        <span
          key={key}
          className={
            isOutgoing ? 'font-medium opacity-90' : 'font-medium text-blue-600 dark:text-blue-400'
          }
        >
          {text}
        </span>
      );
    default:
      return <React.Fragment key={key}>{text}</React.Fragment>;
  }
}

function SpoilerText({ text, isOutgoing }: { text: string; isOutgoing: boolean }) {
  const [revealed, setRevealed] = React.useState(false);

  if (revealed) return <span>{text}</span>;

  return (
    <span
      onClick={() => setRevealed(true)}
      className={`cursor-pointer rounded px-0.5 select-none ${
        isOutgoing
          ? 'bg-white/30 text-transparent'
          : 'bg-gray-800/30 text-transparent dark:bg-white/20'
      } transition-opacity hover:opacity-80`}
      title="Click to reveal"
    >
      {text}
    </span>
  );
}

export function renderTextWithEntities(
  text: string,
  entities?: TelegramEntity[],
  isOutgoing = false,
): React.ReactNode {
  if (!text) return null;
  const safeEntities = entities || [];
  const segments = splitIntoSegments(text, safeEntities);

  return <>{segments.map((seg, i) => renderSegment(seg, i, isOutgoing))}</>;
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getForwardLabel(msg: any): string | null {
  if (msg.forward_origin) {
    const o = msg.forward_origin;
    if (o.type === 'user' && o.sender_user) {
      const u = o.sender_user;
      return `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}`;
    }
    if (o.type === 'hidden_user') return o.sender_user_name || 'Hidden user';
    if (o.type === 'chat' && o.sender_chat) return o.sender_chat.title || 'Unknown chat';
    if (o.type === 'channel' && o.chat) return o.chat.title || 'Unknown channel';
  }
  if (msg.forward_from) {
    const u = msg.forward_from;
    return `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}`;
  }
  if (msg.forward_from_chat) return msg.forward_from_chat.title || 'Unknown';
  if (msg.forward_sender_name) return msg.forward_sender_name;
  return null;
}

export function getMimeIcon(mimeType?: string): string {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('archive') ||
    mimeType.includes('rar') ||
    mimeType.includes('7z')
  )
    return '🗜️';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('text/')) return '📄';
  return '📎';
}
