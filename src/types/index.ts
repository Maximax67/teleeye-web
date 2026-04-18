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

export interface TelegramEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  language?: string;
  custom_emoji_id?: string;
  user?: TelegramUserInfo;
}

export interface TelegramUserInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  is_premium?: boolean;
  language_code?: string;
}

export interface PhotoSize {
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface VideoInfo {
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  mime_type?: string;
  file_name?: string;
  file_size?: number;
  thumbnail?: PhotoSize;
}

export interface AudioInfo {
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  mime_type?: string;
  file_name?: string;
  file_size?: number;
  thumbnail?: PhotoSize;
}

export interface DocumentInfo {
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  thumbnail?: PhotoSize;
}

export interface StickerInfo {
  file_unique_id: string;
  type: 'regular' | 'mask' | 'custom_emoji';
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
  emoji?: string;
  set_name?: string;
  thumbnail?: PhotoSize;
}

export interface VoiceInfo {
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

export interface VideoNoteInfo {
  file_unique_id: string;
  length: number;
  duration: number;
  file_size?: number;
  thumbnail?: PhotoSize;
}

export interface AnimationInfo {
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  mime_type?: string;
  file_name?: string;
  file_size?: number;
  thumbnail?: PhotoSize;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number;
}

export interface ContactInfo {
  phone_number: string;
  first_name: string;
  last_name?: string;
  user_id?: number;
  vcard?: string;
}

export interface PollOption {
  text: string;
  voter_count: number;
}

export interface PollInfo {
  id: string;
  question: string;
  options: PollOption[];
  total_voter_count: number;
  is_closed: boolean;
  is_anonymous: boolean;
  type: 'regular' | 'quiz';
  allows_multiple_answers?: boolean;
  correct_option_id?: number;
  explanation?: string;
}

export interface ForwardOrigin {
  type: 'user' | 'hidden_user' | 'chat' | 'channel';
  date: number;
  sender_user?: TelegramUserInfo;
  sender_user_name?: string;
  sender_chat?: { id: number; title?: string; username?: string; type: string };
  chat?: { id: number; title?: string; username?: string };
  message_id?: number;
  author_signature?: string;
}

export interface Message {
  message_id: number;
  date: number;
  edit_date?: number;
  chat?: { id: number; type: string; title?: string };
  from?: TelegramUserInfo;
  sender_chat?: { id: number; title?: string; username?: string; type: string };
  message_type: string;
  message_thread_id?: number;
  text?: string;
  caption?: string;
  // Entities (from other_data)
  entities?: TelegramEntity[];
  caption_entities?: TelegramEntity[];
  // Media (from other_data)
  photo?: PhotoSize[];
  video?: VideoInfo;
  audio?: AudioInfo;
  document?: DocumentInfo;
  sticker?: StickerInfo;
  voice?: VoiceInfo;
  video_note?: VideoNoteInfo;
  animation?: AnimationInfo;
  location?: LocationInfo;
  contact?: ContactInfo;
  poll?: PollInfo;
  // Forward info (from other_data)
  forward_origin?: ForwardOrigin;
  forward_from?: TelegramUserInfo;
  forward_from_chat?: { id: number; title?: string };
  forward_date?: number;
  forward_sender_name?: string;
  // Reply (from other_data)
  reply_to_message?: Message;
  // Service messages (from other_data)
  new_chat_members?: TelegramUserInfo[];
  left_chat_member?: TelegramUserInfo;
  new_chat_title?: string;
  new_chat_photo?: PhotoSize[];
  delete_chat_photo?: boolean;
  group_chat_created?: boolean;
  supergroup_chat_created?: boolean;
  channel_chat_created?: boolean;
  migrate_to_chat_id?: number;
  migrate_from_chat_id?: number;
  pinned_message?: Message;
  // State flags
  is_automatic_forward?: boolean;
  has_protected_content?: boolean;
  is_paid_post?: boolean;
  author_signature?: string;
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

// Utility functions
export function getUnreadCount(chat: Chat): number {
  if (!chat.last_message) return 0;
  const lastMsgId = chat.last_message.message_id;
  if (!chat.read_messages || chat.read_messages.length === 0) return 1;
  const maxRead = Math.max(...chat.read_messages.map(r => r.message_id));
  return Math.max(0, lastMsgId - maxRead);
}
