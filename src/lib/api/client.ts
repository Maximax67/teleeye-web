import { storage, DEFAULT_API_URL } from '@/lib/storage';
import { dbCache } from '@/lib/indexeddb';
import type { Tokens } from '@/types';
import { ApiError } from './error';

export type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  /** Skip attaching the Authorization header (e.g. for public endpoints). */
  skipAuth?: boolean;
  /** Internal flag — set to true on the single retry after a token refresh. */
  _isRetry?: boolean;
};

/**
 * Bare HTTP client.
 *
 * Interceptor behaviour:
 *  - Every response with status 401 (and !skipAuth, !_isRetry) triggers one
 *    token-refresh attempt, then retries the original request once.
 *  - If the refresh endpoint itself returns 401, tokens are cleared, the
 *    `onSessionExpired` callback fires, and an ApiError(401) is thrown.
 *  - Any other non-401 failure from the refresh endpoint throws without
 *    touching auth state — the user stays logged in.
 */
export class HttpClient {
  protected tokens: Tokens | null = null;
  private refreshPromise: Promise<Tokens> | null = null;
  private _apiUrl: string = DEFAULT_API_URL;
  private _onSessionExpired?: () => void;

  constructor() {
    this.tokens = storage.getTokens();
    if (typeof window !== 'undefined') {
      this._apiUrl = storage.getApiUrl();
    }
  }

  /**
   * Register a callback that fires when the refresh token is rejected (401).
   * Use this to update React auth state without creating a circular dependency.
   */
  setOnSessionExpired(cb: () => void): void {
    this._onSessionExpired = cb;
  }

  get apiUrl(): string {
    if (typeof window !== 'undefined') {
      this._apiUrl = storage.getApiUrl();
    }
    return this._apiUrl;
  }

  setApiUrl(url: string): void {
    const trimmed = url.trim().replace(/\/$/, '');
    this._apiUrl = trimmed;
    storage.setApiUrl(trimmed);
  }

  async testApiUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url.trim().replace(/\/$/, '')}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  getTokens(): Tokens | null {
    return this.tokens;
  }

  setTokens(tokens: Tokens | null): void {
    this.tokens = tokens;
    storage.setTokens(tokens);
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, _isRetry = false, headers: extraHeaders, ...init } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };

    if (this.tokens?.access_token && !skipAuth) {
      headers['Authorization'] = `Bearer ${this.tokens.access_token}`;
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, { ...init, headers });

    // Only intercept when: we have a refresh token, we aren't already on a
    // retry, and the request wasn't explicitly unauthenticated.
    if (response.status === 401 && !skipAuth && !_isRetry && this.tokens?.refresh_token) {
      // refreshToken() will force-logout and throw if the refresh is also 401.
      // Any other error from refreshToken() propagates naturally.
      await this.refreshToken();
      return this.request<T>(endpoint, { ...options, _isRetry: true });
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new ApiError(
        response.status,
        (body as { detail?: string }).detail ?? 'Request failed',
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    // Return raw Response for binary endpoints (avatars, files, etc.)
    return response as unknown as T;
  }

  /**
   * Refresh the access token using the stored refresh token.
   *
   * Refresh returns 401  → clear tokens, fire `onSessionExpired`, throw.
   * Refresh returns other error → throw WITHOUT touching auth state.
   * Refresh succeeds → store new tokens, return them.
   *
   * Concurrent calls share a single in-flight promise.
   */
  async refreshToken(): Promise<Tokens> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async (): Promise<Tokens> => {
      try {
        const response = await fetch(`${this.apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.tokens?.refresh_token ?? ''}` },
        });

        if (response.status === 401) {
          // Refresh token is expired or revoked — must sign the user out.
          this.setTokens(null);
          dbCache.clear();
          this._onSessionExpired?.();
          throw new ApiError(401, 'Session expired. Please sign in again.');
        }

        if (!response.ok) {
          // Transient server / network error — do NOT sign the user out.
          throw new ApiError(response.status, 'Failed to refresh token. Please try again.');
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
}
