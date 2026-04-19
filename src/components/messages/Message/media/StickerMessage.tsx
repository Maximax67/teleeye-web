'use client';

import type { StickerInfo } from '@/types';
import { useFileUrl } from '@/lib/fileLoader';

interface StickerMessageProps {
  sticker: StickerInfo;
}

const MAX_STICKER_SIZE = 160;

export function StickerMessage({ sticker }: StickerMessageProps) {
  // Thumbnail is always a static .webp — safe to render in all browsers.
  // The main sticker file may be .tgs (animated, unrenderable) or .webm (video).
  // Strategy: prefer thumbnail; additionally try main file for static stickers.
  const thumbId = sticker.thumbnail?.file_unique_id;
  const mainId = !sticker.is_animated && !sticker.is_video ? sticker.file_unique_id : undefined;

  const { url: thumbUrl } = useFileUrl(thumbId, 6);
  const { url: mainUrl } = useFileUrl(mainId, 5);

  // Prefer thumbnail URL; fall back to main file URL (for static stickers without thumbnail)
  const displayUrl = thumbUrl ?? mainUrl;

  // Use thumbnail dimensions when available (they are the actual rendered size)
  const srcW = sticker.thumbnail?.width ?? sticker.width;
  const srcH = sticker.thumbnail?.height ?? sticker.height;
  const scale = Math.min(MAX_STICKER_SIZE / srcW, MAX_STICKER_SIZE / srcH, 1);
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  return (
    <div className="relative flex items-center justify-center" style={{ width: w, height: h }}>
      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt={sticker.emoji ?? 'Sticker'}
          width={w}
          height={h}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ fontSize: Math.round(h * 0.6) }}
          aria-label="Sticker"
        >
          {sticker.emoji ?? '🔲'}
        </div>
      )}
    </div>
  );
}
