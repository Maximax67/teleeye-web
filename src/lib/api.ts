import type {
  Bot,
  ChatsResponse,
  MessagesResponse,
  Session,
  Tokens,
  User,
  WebhookCreateRequest,
  WebhookInfo,
} from '@/types';
import { dbCache } from '@/lib/indexeddb';
import { storage } from '@/lib/storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

// ─── Internal types ───────────────────────────────────────────────────────────

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

// ─── APIClient ────────────────────────────────────────────────────────────────

class APIClient {
  private tokens: Tokens | null = null;
  private refreshPromise: Promise<Tokens> | null = null;

  constructor() {
    this.tokens = storage.getTokens();
  }

  // ── Token management ───────────────────────────────────────────────────────

  getTokens(): Tokens | null {
    return this.tokens;
  }

  setTokens(tokens: Tokens | null): void {
    this.tokens = tokens;
    storage.setTokens(tokens);
  }

  // ── Core request ───────────────────────────────────────────────────────────

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, skipRefresh = false, headers: extraHeaders, ...init } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };

    if (this.tokens?.access_token && !skipAuth) {
      headers['Authorization'] = `Bearer ${this.tokens.access_token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...init, headers });

    if (response.status === 401 && this.tokens?.refresh_token && !skipRefresh) {
      await this.refreshToken();
      return this.request<T>(endpoint, { ...options, skipRefresh: true });
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new ApiError(response.status, (body as { detail?: string }).detail ?? 'Request failed');
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response as unknown as T;
  }

  // ── Token refresh ──────────────────────────────────────────────────────────

  async refreshToken(): Promise<Tokens> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.tokens?.refresh_token ?? ''}` },
        });

        if (!response.ok) {
          dbCache.clear();
          this.setTokens(null);
          throw new ApiError(response.status, 'Refresh failed');
        }

        const tokens = (await response.json()) as Tokens;
        this.setTokens(tokens);
        return tokens;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  async login(
    identifier: string,
    password: string,
    isEmail: boolean,
  ): Promise<{ tokens: Tokens; user: User }> {
    const body = isEmail ? { email: identifier, password } : { username: identifier, password };
    const tokens = await this.request<Tokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    });
    this.setTokens(tokens);
    const user = await this.getMe();
    return { tokens, user };
  }

  async register(
    email: string,
    username: string,
    password: string,
  ): Promise<{ tokens: Tokens; user: User }> {
    const tokens = await this.request<Tokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
      skipAuth: true,
    });
    this.setTokens(tokens);
    const user = await this.getMe();
    return { tokens, user };
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.setTokens(null);
  }

  async logoutAll(): Promise<void> {
    await this.request('/auth/logout_all', { method: 'POST' });
    this.setTokens(null);
  }

  async forgotPassword(email: string): Promise<void> {
    await this.request('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await this.request('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password: newPassword }),
      skipAuth: true,
    });
  }

  async changePassword(email: string, oldPassword: string, newPassword: string): Promise<void> {
    await this.request('/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({ email, old_password: oldPassword, new_password: newPassword }),
    });
  }

  async sendEmailConfirmation(): Promise<void> {
    await this.request('/auth/email/send-confirmation', { method: 'POST' });
  }

  async verifyEmail(otp: string, userId: number): Promise<void> {
    await this.request('/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ otp, user_id: userId }),
      skipAuth: true,
    });
  }

  async changeEmail(newEmail: string): Promise<void> {
    await this.request('/auth/email/change', {
      method: 'POST',
      body: JSON.stringify({ new_email: newEmail }),
    });
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  async getSessions(): Promise<{ sessions: Session[] }> {
    return this.request('/auth/sessions');
  }

  async revokeSession(sessionId: number): Promise<void> {
    await this.request(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  }

  // ── Chats ──────────────────────────────────────────────────────────────────

  async getChats(
    page = 1,
    size = 50,
    chatTypes?: string[],
    botIds?: number[],
    search?: string,
  ): Promise<ChatsResponse> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (chatTypes && chatTypes.length > 0) params.set('chat_types', chatTypes.join(','));
    if (botIds && botIds.length > 0) params.set('bots', botIds.join(','));
    if (search && search.trim()) params.set('search', search.trim());
    return this.request(`/telegram/chats?${params.toString()}`);
  }

  /**
   * Fetch messages for a chat.
   *
   * @param beforeId  Load messages with id < beforeId (older messages, DESC).
   * @param afterId   Load messages with id > afterId  (newer messages, ASC).
   *                  Mutually exclusive with beforeId.
   */
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

  async markChatRead(chatId: number, messageId?: number): Promise<void> {
    try {
      await this.request(`/telegram/chats/${chatId}/messages/read`, {
        method: 'PUT',
        body: JSON.stringify({ message_id: messageId ?? null }),
      });
    } catch {
      // Non-critical – don't break the UI
    }
  }

  async getChatAvatar(id: number): Promise<Blob | null> {
    try {
      const response = await this.request<Response>(`/telegram/chats/${id}/avatar`);
      return response.blob();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  // ── Files ──────────────────────────────────────────────────────────────────

  async getFile(fileUniqueId: string): Promise<Blob | null> {
    try {
      const response = await this.request<Response>(`/telegram/files/${fileUniqueId}`);
      return response.blob();
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) return null;
      throw e;
    }
  }

  // ── Bots ───────────────────────────────────────────────────────────────────

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

  // ── Webhooks ───────────────────────────────────────────────────────────────

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

export const apiClient = new APIClient();
