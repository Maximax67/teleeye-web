import React from 'react';
import type { TelegramEntity, Message, ForwardOrigin } from '@/types';

// ─── Text segmentation ────────────────────────────────────────────────────────

interface Segment {
  text: string;
  entity?: TelegramEntity;
}

function splitIntoSegments(text: string, entities: TelegramEntity[]): Segment[] {
  if (entities.length === 0) return [{ text }];

  const sorted = [...entities].sort((a, b) => a.offset - b.offset);
  const segments: Segment[] = [];
  let cursor = 0;

  for (const entity of sorted) {
    if (entity.offset > cursor) {
      segments.push({ text: text.slice(cursor, entity.offset) });
    }
    segments.push({ text: text.slice(entity.offset, entity.offset + entity.length), entity });
    cursor = entity.offset + entity.length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return segments;
}

// ─── Spoiler ──────────────────────────────────────────────────────────────────

function SpoilerText({ text, isOutgoing }: { text: string; isOutgoing: boolean }) {
  const [revealed, setRevealed] = React.useState(false);

  if (revealed) return <span>{text}</span>;

  return (
    <span
      onClick={() => setRevealed(true)}
      className={`cursor-pointer rounded px-0.5 transition-opacity select-none hover:opacity-80 ${
        isOutgoing
          ? 'bg-white/30 text-transparent'
          : 'bg-gray-800/30 text-transparent dark:bg-white/20'
      }`}
      title="Click to reveal"
    >
      {text}
    </span>
  );
}

// ─── Segment renderer ─────────────────────────────────────────────────────────

function renderSegment(seg: Segment, key: number, isOutgoing: boolean): React.ReactNode {
  const { text, entity } = seg;
  if (!entity) return <React.Fragment key={key}>{text}</React.Fragment>;

  const linkCls = isOutgoing
    ? 'underline underline-offset-2 opacity-90 hover:opacity-100'
    : 'text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80';

  const mentionCls = isOutgoing
    ? 'font-medium opacity-90'
    : 'font-medium text-blue-600 dark:text-blue-400';

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
    case 'hashtag':
    case 'cashtag':
    case 'bot_command':
      return (
        <span key={key} className={mentionCls}>
          {text}
        </span>
      );
    default:
      return <React.Fragment key={key}>{text}</React.Fragment>;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function renderTextWithEntities(
  text: string,
  entities?: TelegramEntity[],
  isOutgoing = false,
): React.ReactNode {
  if (!text) return null;
  const segments = splitIntoSegments(text, entities ?? []);
  return <>{segments.map((seg, i) => renderSegment(seg, i, isOutgoing))}</>;
}

export function getForwardLabel(message: Message): string | null {
  if (message.forward_origin) {
    const o: ForwardOrigin = message.forward_origin;
    switch (o.type) {
      case 'user':
        return `${o.sender_user.first_name}${o.sender_user.last_name ? ' ' + o.sender_user.last_name : ''}`;
      case 'hidden_user':
        return o.sender_user_name;
      case 'chat':
        return o.sender_chat.title ?? 'Unknown chat';
      case 'channel':
        return o.chat.title ?? 'Unknown channel';
    }
  }
  if (message.forward_from) {
    const u = message.forward_from;
    return `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}`;
  }
  if (message.forward_from_chat?.title) return message.forward_from_chat.title;
  if (message.forward_sender_name) return message.forward_sender_name;
  return null;
}
