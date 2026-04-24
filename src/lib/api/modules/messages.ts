import { ChatsApi } from './chats';
import type { MessagesResponse } from '@/types';

export class MessagesApi extends ChatsApi {
  async getChatMessages(
    chatId: number,
    limit = 50,
    beforeId?: number,
    afterId?: number,
    threadId?: number,
  ): Promise<MessagesResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (beforeId !== undefined) params.set('before_id', String(beforeId));
    if (afterId !== undefined) params.set('after_id', String(afterId));
    if (threadId !== undefined) params.set('message_thread_id', String(threadId));
    return this.request(`/telegram/chats/${chatId}/messages?${params.toString()}`);
  }
}
