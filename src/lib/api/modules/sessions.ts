import { AuthApi } from './auth';
import type { Session } from '@/types';

export class SessionsApi extends AuthApi {
  async getSessions(): Promise<{ sessions: Session[] }> {
    return this.request('/auth/sessions');
  }

  async revokeSession(sessionId: number): Promise<void> {
    await this.request(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  }
}
