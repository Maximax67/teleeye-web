'use client';

import { useState, useRef } from 'react';
import { Play, Film } from 'lucide-react';
import type { VideoInfo, TelegramEntity } from '@/types';
import { formatDuration } from '@/lib/utils';
import { renderTextWithEntities } from '@/lib/telegramEntities';
import { useFileUrl } from '@/lib/fileLoader';

interface VideoMessageProps {
  video: VideoInfo;
  caption?: string;
  entities?: TelegramEntity[];
  isOutgoing: boolean;
}

export function VideoMessage({ video, caption, entities, isOutgoing }: VideoMessageProps) {
  const thumbId = video.thumbnail?.file_unique_id;
  const { url: thumbUrl } = useFileUrl(thumbId, 2);
  const { url: videoUrl } = useFileUrl(video.file_unique_id, 1);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const aspectRatio = video.height ? `${(video.height / video.width) * 100}%` : '56.25%';

  return (
    <div className="space-y-1">
      <div className="relative overflow-hidden rounded" style={{ maxWidth: 280 }}>
        {playing && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            className="w-full rounded"
            style={{ maxHeight: 200 }}
          />
        ) : (
          <div
            className="relative cursor-pointer"
            onClick={() => videoUrl && setPlaying(true)}
            style={{ paddingBottom: aspectRatio }}
          >
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbUrl}
                className="absolute inset-0 h-full w-full rounded object-cover"
                alt=""
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center rounded bg-black/30">
                <Film size={32} className="opacity-60" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isOutgoing ? 'bg-white/80 text-blue-600' : 'bg-black/50 text-white'
                }`}
              >
                <Play size={20} fill="currentColor" />
              </div>
            </div>
            {video.duration !== undefined && (
              <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-xs text-white">
                {formatDuration(video.duration)}
              </span>
            )}
          </div>
        )}
      </div>

      {caption && (
        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
          {renderTextWithEntities(caption, entities, isOutgoing)}
        </p>
      )}
    </div>
  );
}
