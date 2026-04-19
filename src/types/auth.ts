export type UserRole = 'user' | 'admin' | 'god';

export interface User {
  id: number;
  email: string;
  username: string;
  is_banned: boolean;
  email_verified: boolean;
  role: UserRole;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface Session {
  id: number;
  name?: string;
  created_at: string;
  updated_at: string;
  is_current: boolean;
}
