'use client';

import type { AnimationInfo, TelegramEntity } from '@/types';
import { renderTextWithEntities } from '@/lib/telegramEntities';
import { useFileUrl } from '@/lib/fileLoader';

interface AnimationMessageProps {
  animation: AnimationInfo;
  caption?: string;
  captionEntities?: TelegramEntity[];
  isOutgoing: boolean;
}

export function AnimationMessage({
  animation,
  caption,
  captionEntities,
  isOutgoing,
}: AnimationMessageProps) {
  const { url: animUrl } = useFileUrl(animation.file_unique_id, 2);
  const { url: thumbUrl } = useFileUrl(animation.thumbnail?.file_unique_id, 3);

  return (
    <div className="space-y-1">
      <div className="relative overflow-hidden rounded" style={{ maxWidth: 280 }}>
        {animUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={animUrl} alt="GIF" className="w-full rounded" style={{ maxHeight: 200 }} />
        ) : thumbUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl} alt="" className="w-full rounded" />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded bg-black/10 text-sm opacity-50">
            GIF
          </div>
        )}
        {!animUrl && (
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
            GIF
          </span>
        )}
      </div>

      {caption && (
        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
          {renderTextWithEntities(caption, captionEntities, isOutgoing)}
        </p>
      )}
    </div>
  );
}
