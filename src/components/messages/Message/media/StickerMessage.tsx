'use client';

import type { StickerInfo } from '@/types';
import { useFileUrl } from '@/lib/fileLoader';

interface StickerMessageProps {
  sticker: StickerInfo;
}

export function StickerMessage({ sticker }: StickerMessageProps) {
  const { url } = useFileUrl(sticker.file_unique_id, 5);

  return (
    <div className="relative" style={{ width: 160, height: 120 }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={sticker.emoji ?? 'Sticker'} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-5xl">
          {sticker.emoji ?? '?'}
        </div>
      )}
    </div>
  );
}
