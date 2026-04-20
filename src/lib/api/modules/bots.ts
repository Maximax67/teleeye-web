import { FilesApi } from './files';
import type { Bot } from '@/types';

export class BotsApi extends FilesApi {
  async getBots(): Promise<{ bots: Bot[] }> {
    return this.request('/telegram/bots');
  }

  async addBot(token: string): Promise<Bot> {
    return this.request('/telegram/bots', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async deleteBot(botId: number): Promise<void> {
    await this.request(`/telegram/bots/${botId}`, { method: 'DELETE' });
  }
}
