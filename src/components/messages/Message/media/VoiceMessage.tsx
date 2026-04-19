'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { VoiceInfo } from '@/types';
import { formatDuration } from '@/lib/utils';
import { useFileUrl } from '@/lib/fileLoader';

interface VoiceMessageProps {
  voice: VoiceInfo;
  isOutgoing: boolean;
}

const BAR_COUNT = 30;
const bars = Array.from({ length: BAR_COUNT }, (_, i) => ({
  height: Math.max(8, 20 + Math.sin(i * 0.8) * 15 + Math.sin(i * 2.1) * 10),
}));

export function VoiceMessage({ voice, isOutgoing }: VoiceMessageProps) {
  const { url } = useFileUrl(voice.file_unique_id, 0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play();
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [url]);

  return (
    <div className="flex items-center gap-2 py-1">
      {url && <audio ref={audioRef} src={url} />}

      <button
        onClick={togglePlay}
        disabled={!url}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
          isOutgoing ? 'bg-white/20 hover:bg-white/30' : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className="flex flex-1 items-end gap-0.5" style={{ height: 36 }}>
        {bars.map((bar, i) => {
          const filled = (i / BAR_COUNT) * 100 < progress;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-colors ${
                filled
                  ? isOutgoing
                    ? 'bg-white'
                    : 'bg-blue-500'
                  : isOutgoing
                    ? 'bg-white/40'
                    : 'bg-gray-300 dark:bg-gray-600'
              }`}
              style={{ height: `${bar.height}px` }}
            />
          );
        })}
      </div>

      <span
        className={`shrink-0 text-xs tabular-nums ${
          isOutgoing ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {formatDuration(playing ? currentTime : voice.duration)}
      </span>
    </div>
  );
}
