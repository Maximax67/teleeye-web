import {
  Bot,
  Chat,
  MessagesResponse,
  Session,
  Tokens,
  User,
  WebhookCreateRequest,
  WebhookInfo,
} from '@/types';
import { dbCache } from '@/lib/indexeddb';
import { storage } from './storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class ApiError<T = unknown> extends Error {
  status: number;
  detail: string;
  response: T | null;

  constructor(status: number, detail: string, response: T | null = null) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.response = response;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

class APIClient {
  private tokens: Tokens | null = null;
  private refreshPromise: Promise<Tokens> | null = null;

  constructor() {
    this.tokens = storage.getTokens();
  }

  setTokens(tokens: Tokens | null): void {
    this.tokens = tokens;
    storage.setTokens(tokens);
  }

  getTokens(): Tokens | null {
    return this.tokens;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { skipAuth?: boolean; skipRefresh?: boolean } = {},
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.tokens?.access_token && !options.skipAuth) {
      if (headers instanceof Headers) {
        headers.set('Authorization', `Bearer ${this.tokens.access_token}`);
      } else if (Array.isArray(headers)) {
        headers.push(['Authorization', `Bearer ${this.tokens.access_token}`]);
      } else {
        headers['Authorization'] = `Bearer ${this.tokens.access_token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.tokens?.refresh_token && !options.skipRefresh) {
      await this.refreshToken();
      return this.request<T>(endpoint, { ...options, skipRefresh: true });
    }

    if (!response.ok) {
      console.log(response);
      const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new ApiError<typeof errorData>(
        response.status,
        errorData.detail ?? 'Request failed',
        errorData,
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response as T;
  }

  async refreshToken(): Promise<Tokens> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.tokens?.refresh_token}`,
          },
        });

        if (response.ok) {
          const tokens: Tokens = await response.json();
          this.setTokens(tokens);
          return tokens;
        }

        dbCache.clear();

        throw new Error('Refresh failed');
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Auth endpoints
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
    const user = await this.request<User>('/auth/me');
    return { tokens, user };
  }

  async loginByUsername(email: string, password: string): Promise<{ tokens: Tokens; user: User }> {
    const tokens = await this.request<Tokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });

    this.setTokens(tokens);
    const user = await this.request<User>('/auth/me');
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
    const user = await this.request<User>('/auth/me');
    return { tokens, user };
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
      body: JSON.stringify({
        email,
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.setTokens(null);
  }

  async logoutAll(): Promise<void> {
    await this.request(`/auth/logout_all`, { method: 'POST' });
    this.setTokens(null);
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Email verification endpoints
  async sendEmailConfirmation(): Promise<void> {
    await this.request('/auth/email/send-confirmation', {
      method: 'POST',
    });
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

  // Chat endpoints
  async getChats(page = 1, size = 50): Promise<{ items: Chat[]; total: number }> {
    return this.request(`/telegram/chats?page=${page}&size=${size}`);
  }

  async getChatMessages(chatId: number, limit = 50, beforeId?: number): Promise<MessagesResponse> {
    const url = `/telegram/chats/${chatId}/messages?limit=${limit}${beforeId ? `&before_id=${beforeId}` : ''}`;
    return this.request(url);
  }

  async getChatAvatar(id: number): Promise<Blob | null> {
    try {
      const response = await this.request<Response>(`/telegram/chats/${id}/avatar`, {
        headers: { 'Content-Type': 'image/jpeg' },
      });
      return response.blob();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        return null;
      }

      throw e;
    }
  }

  // Bot endpoints
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

  // Session endpoints
  async getSessions(): Promise<{ sessions: Session[] }> {
    return this.request('/auth/sessions');
  }

  async revokeSession(sessionId: number): Promise<void> {
    await this.request(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  }

  async getWebhookInfo(botId: number): Promise<WebhookInfo> {
    return this.request<WebhookInfo>(`/telegram/bots/${botId}/webhook`);
  }

  async setWebhook(botId: number, data: WebhookCreateRequest): Promise<{ detail: string }> {
    return this.request<{ detail: string }>(`/telegram/bots/${botId}/webhook`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(botId: number, dropPendingUpdates: boolean = true): Promise<void> {
    await this.request(
      `/telegram/bots/${botId}/webhook?drop_pending_updates=${dropPendingUpdates}`,
      {
        method: 'DELETE',
      },
    );
  }
}

export const apiClient = new APIClient();
