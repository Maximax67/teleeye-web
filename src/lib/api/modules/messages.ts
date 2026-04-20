import { ChatsApi } from './chats';
import type { MessagesResponse } from '@/types';

export class MessagesApi extends ChatsApi {
  async getChatMessages(
    chatId: number,
    limit = 50,
    beforeId?: number,
    afterId?: number,
  ): Promise<MessagesResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (beforeId !== undefined) params.set('before_id', String(beforeId));
    if (afterId !== undefined) params.set('after_id', String(afterId));
    return this.request(`/telegram/chats/${chatId}/messages?${params.toString()}`);
  }
}
