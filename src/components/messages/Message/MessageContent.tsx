'use client';

import type { Message } from '@/types';
import { renderTextWithEntities } from '@/lib/telegramEntities';
import { PhotoMessage } from './media/PhotoMessage';
import { VideoMessage } from './media/VideoMessage';
import { MediaFile } from './media/MediaFile';
import { VoiceMessage } from './media/VoiceMessage';
import { AudioMessage } from './media/AudioMessage';
import { StickerMessage } from './media/StickerMessage';
import { VideoNoteMessage } from './media/VideoNote';
import { LocationMessage } from './media/LocationMessage';
import { ContactMessage } from './media/ContactMessage';
import { PollMessage } from './media/PollMessage';
import { AnimationMessage } from './media/AnimationMessage';

interface MessageContentProps {
  message: Message;
  isOutgoing: boolean;
}

export function MessageContent({ message, isOutgoing }: MessageContentProps) {
  // Photo
  if (message.photo?.length) {
    return (
      <PhotoMessage
        photo={message.photo}
        caption={message.caption}
        entities={message.caption_entities}
        isOutgoing={isOutgoing}
      />
    );
  }

  // Video
  if (message.video) {
    return (
      <VideoMessage
        video={message.video}
        caption={message.caption}
        entities={message.caption_entities}
        isOutgoing={isOutgoing}
      />
    );
  }

  // Animation / GIF
  if (message.animation) {
    return (
      <AnimationMessage
        animation={message.animation}
        caption={message.caption}
        captionEntities={message.caption_entities}
        isOutgoing={isOutgoing}
      />
    );
  }

  // Audio
  if (message.audio) {
    return <AudioMessage audio={message.audio} isOutgoing={isOutgoing} />;
  }

  // Voice
  if (message.voice) {
    return <VoiceMessage voice={message.voice} isOutgoing={isOutgoing} />;
  }

  // Document
  if (message.document) {
    return (
      <div className="space-y-1.5">
        <MediaFile document={message.document} isOutgoing={isOutgoing} />
        {message.caption && (
          <p className="border-t border-current/10 pt-1.5 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
            {renderTextWithEntities(message.caption, message.caption_entities, isOutgoing)}
          </p>
        )}
      </div>
    );
  }

  // Sticker
  if (message.sticker) {
    return <StickerMessage sticker={message.sticker} />;
  }

  // Video note (round video)
  if (message.video_note) {
    return <VideoNoteMessage videoNote={message.video_note} />;
  }

  // Location
  if (message.location) {
    return <LocationMessage location={message.location} isOutgoing={isOutgoing} />;
  }

  // Contact
  if (message.contact) {
    return <ContactMessage contact={message.contact} isOutgoing={isOutgoing} />;
  }

  // Poll
  if (message.poll) {
    return <PollMessage poll={message.poll} isOutgoing={isOutgoing} />;
  }

  // Text
  if (message.text) {
    return (
      <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
        {renderTextWithEntities(message.text, message.entities, isOutgoing)}
      </p>
    );
  }

  // Unknown / unsupported
  return (
    <p className="text-xs text-red-400 dark:text-red-300">Unsupported: {message.message_type}</p>
  );
}
