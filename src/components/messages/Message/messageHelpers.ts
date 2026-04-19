import type { Message, ForwardOrigin } from '@/types';

export function getForwardLabel(message: Message): string | null {
  if (message.forward_origin) {
    const origin: ForwardOrigin = message.forward_origin;
    switch (origin.type) {
      case 'user': {
        const u = origin.sender_user;
        return `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}`;
      }
      case 'hidden_user':
        return origin.sender_user_name;
      case 'chat':
        return origin.sender_chat.title ?? 'Unknown chat';
      case 'channel':
        return origin.chat.title ?? 'Unknown channel';
    }
  }
  if (message.forward_from) {
    const u = message.forward_from;
    return `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}`;
  }
  if (message.forward_from_chat?.title) return message.forward_from_chat.title;
  if (message.forward_sender_name) return message.forward_sender_name;
  return null;
}

export function isServiceMessage(message: Message): boolean {
  return (
    message.message_type === 'service' ||
    !!message.new_chat_members?.length ||
    !!message.left_chat_member ||
    !!message.new_chat_title ||
    !!message.group_chat_created ||
    !!message.supergroup_chat_created ||
    !!message.channel_chat_created ||
    !!message.delete_chat_photo ||
    !!message.pinned_message
  );
}
