import { Chat } from '@/types';

export const getChatTitle = (chat: Chat): string => {
  if (chat.title) {
    return chat.title;
  }

  if (chat.last_name) {
    return `${chat.first_name} ${chat.last_name}`;
  }

  if (chat.first_name) {
    return chat.first_name;
  }

  return 'Unknown';
};

export const getChatInitials = (chat: Chat): string => {
  const title = getChatTitle(chat);

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const iterator = segmenter.segment(title)[Symbol.iterator]();
    const first = iterator.next().value;
    return first ? first.segment : '';
  }

  const chars = Array.from(title);
  return chars[0] || '';
};

export const getErrorMessage = (error: unknown, default_value?: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return default_value || 'Error';
};
