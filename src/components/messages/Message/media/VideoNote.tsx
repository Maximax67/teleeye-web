'use client';

import { Film } from 'lucide-react';
import type { VideoNoteInfo } from '@/types';
import { formatDuration } from '@/lib/utils';
import { useFileUrl } from '@/lib/fileLoader';

interface VideoNoteMessageProps {
  videoNote: VideoNoteInfo;
}

export function VideoNoteMessage({ videoNote }: VideoNoteMessageProps) {
  const { url: vnUrl } = useFileUrl(videoNote.file_unique_id, 2);
  const { url: thumbUrl } = useFileUrl(videoNote.thumbnail?.file_unique_id, 3);

  return (
    <div className="relative overflow-hidden rounded-full" style={{ width: 140, height: 140 }}>
      {vnUrl ? (
        <video src={vnUrl} controls loop className="h-full w-full object-cover" />
      ) : thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black/20">
          <Film size={32} className="opacity-40" />
        </div>
      )}
      {videoNote.duration !== undefined && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white">
          {formatDuration(videoNote.duration)}
        </span>
      )}
    </div>
  );
}
