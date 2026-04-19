import type { Chat } from '@/types';

// ─── Chat utilities ───────────────────────────────────────────────────────────

export function getChatTitle(chat: Chat): string {
  if (chat.title) return chat.title;
  if (chat.first_name && chat.last_name) return `${chat.first_name} ${chat.last_name}`;
  if (chat.first_name) return chat.first_name;
  return 'Unknown';
}

export function getChatInitials(chat: Chat): string {
  const title = getChatTitle(chat);

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const first = segmenter.segment(title)[Symbol.iterator]().next().value;
    return first ? first.segment.toUpperCase() : '';
  }

  return (Array.from(title)[0] ?? '').toUpperCase();
}

// ─── Format utilities ─────────────────────────────────────────────────────────

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

export function formatMessageTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatChatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isThisYear) return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
}

// ─── Error utilities ──────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown, defaultValue = 'An error occurred'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return defaultValue;
}

// ─── Mime / icon utilities ────────────────────────────────────────────────────

export function getMimeIcon(mimeType?: string): string {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '🗜️';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.startsWith('text/')) return '📄';
  return '📎';
}
