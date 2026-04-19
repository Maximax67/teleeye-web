export type UserBotRole = 'owner' | 'viewer';

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
  role?: UserBotRole;
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
