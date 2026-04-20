import { HttpClient } from '../client';
import type { Tokens, User } from '@/types';

export class AuthApi extends HttpClient {
  async login(
    identifier: string,
    password: string,
    isEmail: boolean,
  ): Promise<{ tokens: Tokens; user: User }> {
    const body = isEmail
      ? { email: identifier, password }
      : { username: identifier, password };

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
}
