import { BotsApi } from './bots';
import type { WebhookCreateRequest, WebhookInfo } from '@/types';

export class WebhooksApi extends BotsApi {
  async getWebhookInfo(botId: number): Promise<WebhookInfo> {
    return this.request<WebhookInfo>(`/telegram/bots/${botId}/webhook`);
  }

  async setWebhook(botId: number, data: WebhookCreateRequest): Promise<{ detail: string }> {
    return this.request<{ detail: string }>(`/telegram/bots/${botId}/webhook`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(botId: number, dropPendingUpdates = true): Promise<void> {
    await this.request(
      `/telegram/bots/${botId}/webhook?drop_pending_updates=${String(dropPendingUpdates)}`,
      { method: 'DELETE' },
    );
  }
}
