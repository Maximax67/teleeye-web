'use client';

import type { PhotoSize, TelegramEntity } from '@/types';
import { renderTextWithEntities } from '@/lib/telegramEntities';
import { MediaImage } from './MediaImage';

interface PhotoMessageProps {
  photo: PhotoSize[];
  caption?: string;
  entities?: TelegramEntity[];
  isOutgoing: boolean;
}

export function PhotoMessage({ photo, caption, entities, isOutgoing }: PhotoMessageProps) {
  const sorted = [...photo].sort((a, b) => (b.file_size ?? 0) - (a.file_size ?? 0));
  const best = sorted.find((p) => p.width >= 100) ?? sorted[0];

  return (
    <div className="space-y-1">
      <MediaImage
        fileUniqueId={best.file_unique_id}
        className="w-full max-w-full rounded object-cover"
        priority={5}
      />
      {caption && (
        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
          {renderTextWithEntities(caption, entities, isOutgoing)}
        </p>
      )}
    </div>
  );
}
