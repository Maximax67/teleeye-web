export interface TelegramUserInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  is_premium?: boolean;
  language_code?: string;
}

export interface TelegramChatRef {
  id: number;
  type: string;
  title?: string;
  username?: string;
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

export interface PhotoSize {
  file_unique_id: string;
  file_id?: string;
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

export interface ForwardOriginUser {
  type: 'user';
  date: number;
  sender_user: TelegramUserInfo;
}

export interface ForwardOriginHiddenUser {
  type: 'hidden_user';
  date: number;
  sender_user_name: string;
}

export interface ForwardOriginChat {
  type: 'chat';
  date: number;
  sender_chat: TelegramChatRef;
  author_signature?: string;
}

export interface ForwardOriginChannel {
  type: 'channel';
  date: number;
  chat: TelegramChatRef;
  message_id?: number;
  author_signature?: string;
}

export type ForwardOrigin =
  | ForwardOriginUser
  | ForwardOriginHiddenUser
  | ForwardOriginChat
  | ForwardOriginChannel;
