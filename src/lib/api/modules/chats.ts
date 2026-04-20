import { SessionsApi } from './sessions';
import { ApiError } from '../error';
import type { ChatsResponse } from '@/types';

export class ChatsApi extends SessionsApi {
  async getChats(
    page = 1,
    size = 50,
    chatTypes?: string[],
    botIds?: number[],
    search?: string,
  ): Promise<ChatsResponse> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (chatTypes?.length) params.set('chat_types', chatTypes.join(','));
    if (botIds?.length) params.set('bots', botIds.join(','));
    if (search?.trim()) params.set('search', search.trim());
    return this.request(`/telegram/chats?${params.toString()}`);
  }

  async markChatRead(chatId: number, messageId?: number): Promise<void> {
    try {
      await this.request(`/telegram/chats/${chatId}/messages/read`, {
        method: 'PUT',
        body: JSON.stringify({ message_id: messageId ?? null }),
      });
    } catch (e) {
      console.error(e);
      // Non-critical — swallow so a failed mark-read never breaks the UI
    }
  }

  async getChatAvatar(chatId: number): Promise<Blob | null> {
    try {
      const response = await this.request<Response>(`/telegram/chats/${chatId}/avatar`);
      return response.blob();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
}
