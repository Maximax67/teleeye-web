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

export interface Message {
  message_id: number;
  date: number;
  chat?: {
    id: number;
    type: string;
    title?: string;
  };
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  text?: string;
  message_type: string;
}

export interface ReadMessage {
  message_thread_id: number;
  message_id: number;
}

export interface Chat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  last_message?: Message;
  read_messages: ReadMessage[];
}

export interface ChatsResponse {
  items: Chat[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MessagesResponse {
  items: Message[];
  next_cursor?: number;
  has_more: boolean;
}

export interface Bot {
  id: number;
  first_name: string;
  last_name?: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
  can_connect_to_business: boolean;
  has_main_web_app: boolean;
  role?: 'owner' | 'viewer';
}

export interface Session {
  id: number;
  name?: string;
  created_at: string;
  updated_at: string;
  is_current: boolean;
}

export interface MessageWithGap extends Message {
  isGap?: boolean;
  gapCount?: number;
}

export interface WebhookCreateRequest {
  url?: string | null;
  max_connections?: number | null;
  allowed_updates?: string[] | null;
  drop_pending_updates?: boolean | null;
  secret_token?: string | null;
}

export interface WebhookInfo {
  url: string | null;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  last_synchronization_error_date?: number;
  max_connections: number;
  allowed_updates: string[];
}
