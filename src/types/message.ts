import type {
  TelegramUserInfo,
  TelegramChatRef,
  TelegramEntity,
  PhotoSize,
  VideoInfo,
  AudioInfo,
  DocumentInfo,
  StickerInfo,
  VoiceInfo,
  VideoNoteInfo,
  AnimationInfo,
  LocationInfo,
  ContactInfo,
  PollInfo,
  ForwardOrigin,
} from './telegram';

// Re-export for convenience
export type {
  TelegramEntity,
  PhotoSize,
  VideoInfo,
  AudioInfo,
  DocumentInfo,
  StickerInfo,
  VoiceInfo,
  VideoNoteInfo,
  AnimationInfo,
  LocationInfo,
  ContactInfo,
  PollInfo,
};

export type MessageType =
  | 'text'
  | 'photo'
  | 'audio'
  | 'document'
  | 'video'
  | 'animation'
  | 'voice'
  | 'video_note'
  | 'paid_media'
  | 'location'
  | 'venue'
  | 'contact'
  | 'poll'
  | 'checklist'
  | 'dice'
  | 'sticker'
  | 'story'
  | 'invoice'
  | 'game'
  | 'giveaway'
  | 'passport'
  | 'service';

export interface Message {
  message_id: number;
  date: number;
  edit_date?: number;
  chat?: TelegramChatRef;
  from?: TelegramUserInfo;
  sender_chat?: TelegramChatRef;
  sender_business_bot?: TelegramUserInfo;
  message_type: MessageType;
  message_thread_id?: number;
  text?: string;
  caption?: string;

  // Entities
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

  // Forward info
  forward_origin?: ForwardOrigin;
  forward_from?: TelegramUserInfo;
  forward_from_chat?: TelegramChatRef;
  forward_date?: number;
  forward_sender_name?: string;

  // Reply
  reply_to_message?: Message;

  // Service messages
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

  // Flags
  is_topic_message?: boolean;
  is_automatic_forward?: boolean;
  has_media_spoiler?: boolean;
  has_protected_content?: boolean;
  is_from_offline?: boolean;
  is_paid_post?: boolean;
  author_signature?: string;
  sender_boost_count?: number;
  paid_star_count?: number;
  business_connection_id?: string;
}

export interface MessagesResponse {
  items: Message[];
  next_cursor?: number;
  has_more: boolean;
}

// ─── Discriminated union for rendering ───────────────────────────────────────

export interface MessageListMessage {
  type: 'message';
  message: Message;
  /** Synthetic numeric id for React key */
  id: number;
}

export interface MessageListGap {
  type: 'gap';
  gapCount: number;
  /** Synthetic numeric id for React key (fractional) */
  id: number;
}

export interface MessageListUnreadSeparator {
  type: 'unread-separator';
  /** Synthetic numeric id for React key */
  id: number;
}

export type MessageListItem =
  | MessageListMessage
  | MessageListGap
  | MessageListUnreadSeparator;

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Takes a flat, already-sorted (asc) array of messages and produces
 * a `MessageListItem[]` with gap indicators and an unread separator.
 */
export function buildMessageListItems(
  messages: Message[],
  firstUnreadId: number | null,
): MessageListItem[] {
  if (messages.length === 0) return [];

  const items: MessageListItem[] = [];
  let separatorInserted = false;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = messages[i - 1];

    // Gap between consecutive messages?
    if (prev && msg.message_id - prev.message_id > 1) {
      const gapCount = msg.message_id - prev.message_id - 1;
      items.push({ type: 'gap', gapCount, id: prev.message_id + 0.5 });
    }

    // Unread separator before first unread message
    if (
      firstUnreadId !== null &&
      !separatorInserted &&
      msg.message_id >= firstUnreadId
    ) {
      items.push({ type: 'unread-separator', id: -1 });
      separatorInserted = true;
    }

    items.push({ type: 'message', message: msg, id: msg.message_id });
  }

  return items;
}
