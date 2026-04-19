'use client';

import { Download, Music } from 'lucide-react';
import type { AudioInfo } from '@/types';
import { formatBytes, formatDuration } from '@/lib/utils';
import { useFileUrl } from '@/lib/fileLoader';

interface AudioMessageProps {
  audio: AudioInfo;
  isOutgoing: boolean;
}

export function AudioMessage({ audio, isOutgoing }: AudioMessageProps) {
  const { url } = useFileUrl(audio.file_unique_id, 0);
  const { url: thumbUrl } = useFileUrl(audio.thumbnail?.file_unique_id, 0);

  return (
    <div className="flex min-w-0 items-center gap-3 py-1">
      <div
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ${
          isOutgoing ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/30'
        }`}
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Music size={20} className="opacity-60" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{audio.title ?? audio.file_name ?? 'Audio'}</p>
        {audio.performer && (
          <p
            className={`truncate text-xs ${isOutgoing ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}
          >
            {audio.performer}
          </p>
        )}
        <p
          className={`text-xs ${isOutgoing ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}
        >
          {formatDuration(audio.duration)}
          {audio.file_size ? ` · ${formatBytes(audio.file_size)}` : ''}
        </p>
      </div>

      {url && (
        <a
          href={url}
          download={audio.file_name}
          className={`shrink-0 rounded-full p-1.5 transition-colors ${
            isOutgoing ? 'hover:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Download size={16} />
        </a>
      )}
    </div>
  );
}
