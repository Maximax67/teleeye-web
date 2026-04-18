/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Info,
  X,
  Download,
  Play,
  Pause,
  MapPin,
  Phone,
  User,
  BarChart2,
  Film,
  Music,
} from 'lucide-react';
import { MessageWithGap } from '@/types';
import {
  renderTextWithEntities,
  formatBytes,
  formatDuration,
  getForwardLabel,
  getMimeIcon,
} from '@/lib/telegramEntities';
import { useFileUrl } from '@/lib/fileLoader';

// ─── Sub-components ────────────────────────────────────────────────────────────

function MediaImage({
  fileUniqueId,
  alt,
  className,
  priority,
}: {
  fileUniqueId: string;
  alt?: string;
  className?: string;
  priority?: number;
}) {
  const { url, loading } = useFileUrl(fileUniqueId, priority ?? 0);

  if (loading) {
    return (
      <div
        className={`animate-pulse rounded bg-black/10 dark:bg-white/10 ${className || 'h-48 w-full'}`}
      />
    );
  }
  if (!url) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-black/10 text-sm opacity-60 dark:bg-white/10 ${className || 'h-48 w-full'}`}
      >
        Image unavailable
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt || 'Image'}
      className={`rounded object-cover ${className || 'max-w-full'}`}
    />
  );
}

function MediaFile({
  fileUniqueId,
  fileName,
  mimeType,
  fileSize,
  isOutgoing,
}: {
  fileUniqueId: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  isOutgoing: boolean;
}) {
  const { url, loading } = useFileUrl(fileUniqueId, 0);
  const icon = getMimeIcon(mimeType);

  return (
    <div className={`flex min-w-0 items-center gap-3 ${isOutgoing ? '' : ''}`}>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${isOutgoing ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/30'}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fileName || 'File'}</p>
        <p
          className={`text-xs ${isOutgoing ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}
        >
          {mimeType?.split('/')[1]?.toUpperCase() || 'File'}{' '}
          {fileSize ? `· ${formatBytes(fileSize)}` : ''}
        </p>
      </div>
      {url && (
        <a
          href={url}
          download={fileName}
          className={`shrink-0 rounded-full p-1.5 transition-colors ${isOutgoing ? 'hover:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <Download size={16} />
        </a>
      )}
      {loading && (
        <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" />
      )}
    </div>
  );
}

function VoiceMessage({
  fileUniqueId,
  duration,
  isOutgoing,
}: {
  fileUniqueId: string;
  duration: number;
  isOutgoing: boolean;
}) {
  const { url } = useFileUrl(fileUniqueId, 0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
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

  const barCount = 30;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const height = 20 + Math.sin(i * 0.8) * 15 + Math.sin(i * 2.1) * 10;
    const filled = (i / barCount) * 100 < progress;
    return { height: Math.max(8, height), filled };
  });

  return (
    <div className="flex items-center gap-2 py-1">
      {url && <audio ref={audioRef} src={url} />}
      <button
        onClick={togglePlay}
        disabled={!url}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
          isOutgoing ? 'bg-white/20 hover:bg-white/30' : 'bg-blue-500 text-white hover:bg-blue-600'
        } disabled:opacity-40`}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      <div className="flex flex-1 items-end gap-0.5" style={{ height: 36 }}>
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${
              bar.filled
                ? isOutgoing
                  ? 'bg-white'
                  : 'bg-blue-500'
                : isOutgoing
                  ? 'bg-white/40'
                  : 'bg-gray-300 dark:bg-gray-600'
            }`}
            style={{ height: `${bar.height}px` }}
          />
        ))}
      </div>

      <span
        className={`shrink-0 text-xs tabular-nums ${isOutgoing ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}
      >
        {formatDuration(playing ? currentTime : duration)}
      </span>
    </div>
  );
}

function LocationMessage({
  lat,
  lng,
  isOutgoing,
}: {
  lat: number;
  lng: number;
  isOutgoing: boolean;
}) {
  const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded"
    >
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded ${isOutgoing ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-700'}`}
        style={{ width: 220, height: 120 }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-4 w-4 rounded-sm bg-current" />
            ))}
          </div>
        </div>
        <div className="relative flex flex-col items-center gap-1 text-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${isOutgoing ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}
          >
            <MapPin size={20} />
          </div>
          <p className="text-xs font-medium opacity-70">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
      </div>
      <div
        className={`px-2 py-1 text-xs font-medium ${isOutgoing ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}
      >
        Open in Maps →
      </div>
    </a>
  );
}

function ContactMessage({ contact, isOutgoing }: { contact: any; isOutgoing: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 py-1`}>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isOutgoing ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}
      >
        <User size={20} className="opacity-60" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {contact.first_name} {contact.last_name || ''}
        </p>
        {contact.phone_number && (
          <a
            href={`tel:${contact.phone_number}`}
            className={`flex items-center gap-1 text-xs ${isOutgoing ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}
          >
            <Phone size={10} />
            {contact.phone_number}
          </a>
        )}
      </div>
    </div>
  );
}

function PollMessage({ poll, isOutgoing }: { poll: any; isOutgoing: boolean }) {
  const total = poll.total_voter_count || 1;
  const typeLabel = poll.type === 'quiz' ? '🏆 Quiz' : '📊 Poll';

  return (
    <div className="min-w-[200px] space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-60">
        <BarChart2 size={12} />
        {typeLabel} {poll.is_anonymous ? '· Anonymous' : ''} {poll.is_closed ? '· Closed' : ''}
      </div>
      <p className="text-sm leading-snug font-semibold">{poll.question}</p>
      <div className="space-y-1.5">
        {poll.options?.map((opt: any, i: number) => {
          const pct = total > 0 ? Math.round((opt.voter_count / total) * 100) : 0;
          const isCorrect = poll.type === 'quiz' && i === poll.correct_option_id;
          return (
            <div key={i} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1 truncate">
                  {isCorrect && <span className="text-emerald-400">✓</span>}
                  {opt.text}
                </span>
                <span className="shrink-0 font-medium opacity-70">{pct}%</span>
              </div>
              <div
                className={`h-1.5 rounded-full ${isOutgoing ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}
              >
                <div
                  className={`h-full rounded-full transition-all ${isCorrect ? 'bg-emerald-400' : isOutgoing ? 'bg-white/80' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className={`text-xs opacity-50`}>
        {poll.total_voter_count} vote{poll.total_voter_count !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function StickerMessage({ sticker }: { sticker: any }) {
  const { url } = useFileUrl(sticker.file_unique_id, 5);

  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      {url ? (
        <img src={url} alt={sticker.emoji || 'Sticker'} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-5xl">
          {sticker.emoji || '😊'}
        </div>
      )}
    </div>
  );
}

function VideoMessage({
  video,
  caption,
  entities,
  isOutgoing,
}: {
  video: any;
  caption?: string;
  entities?: any[];
  isOutgoing: boolean;
}) {
  const thumbId = video.thumbnail?.file_unique_id;
  const { url: thumbUrl } = useFileUrl(thumbId, 2);
  const { url: videoUrl } = useFileUrl(video.file_unique_id, 1);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
            style={{
              paddingBottom: video.height ? `${(video.height / video.width) * 100}%` : '56.25%',
            }}
          >
            {thumbUrl ? (
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
                className={`flex h-12 w-12 items-center justify-center rounded-full ${isOutgoing ? 'bg-white/80 text-blue-600' : 'bg-black/50 text-white'}`}
              >
                <Play size={20} fill="currentColor" />
              </div>
            </div>
            {video.duration && (
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

function ReplyQuote({ message, isOutgoing }: { message: any; isOutgoing: boolean }) {
  const senderName = message.from
    ? `${message.from.first_name}${message.from.last_name ? ' ' + message.from.last_name : ''}`
    : message.sender_chat?.title || 'Unknown';

  let preview = message.text || message.caption || '';
  if (!preview) {
    if (message.photo) preview = '📷 Photo';
    else if (message.video) preview = '🎬 Video';
    else if (message.audio) preview = '🎵 Audio';
    else if (message.voice) preview = '🎤 Voice';
    else if (message.document) preview = `📎 ${message.document.file_name || 'File'}`;
    else if (message.sticker) preview = `${message.sticker.emoji || ''} Sticker`;
    else if (message.animation) preview = '🎭 GIF';
    else if (message.location) preview = '📍 Location';
    else if (message.contact) preview = '👤 Contact';
    else if (message.poll) preview = `📊 ${message.poll.question}`;
    else preview = 'Message';
  }

  const thumbId = message.photo
    ? message.photo[0]?.file_unique_id
    : message.video?.thumbnail?.file_unique_id || message.document?.thumbnail?.file_unique_id;

  return (
    <div
      className={`mb-1 flex gap-2 rounded border-l-2 px-2 py-1 text-sm ${
        isOutgoing
          ? 'border-white/50 bg-white/10'
          : 'border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
      }`}
    >
      {thumbId && <ReplyThumb fileUniqueId={thumbId} />}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-semibold ${isOutgoing ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}
        >
          {senderName}
        </p>
        <p className="truncate text-xs opacity-70">{preview}</p>
      </div>
    </div>
  );
}

function ReplyThumb({ fileUniqueId }: { fileUniqueId: string }) {
  const { url } = useFileUrl(fileUniqueId, 3);
  if (!url) return null;
  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded">
      <img src={url} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

function ForwardHeader({
  forwardLabel,
  isOutgoing,
}: {
  forwardLabel: string;
  isOutgoing: boolean;
}) {
  return (
    <div
      className={`mb-1 flex items-center gap-1 text-xs font-medium ${isOutgoing ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 opacity-70">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
      </svg>
      Forwarded from <span className="font-semibold">{forwardLabel}</span>
    </div>
  );
}

function ServiceMessage({ message }: { message: any }) {
  let text = '';

  const name = (u: any) =>
    u ? `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}` : 'Someone';

  if (message.new_chat_members?.length) {
    const names = message.new_chat_members.map(name).join(', ');
    text = `${names} joined the group`;
  } else if (message.left_chat_member) {
    text = `${name(message.left_chat_member)} left the group`;
  } else if (message.new_chat_title) {
    text = `Group renamed to "${message.new_chat_title}"`;
  } else if (message.delete_chat_photo) {
    text = 'Group photo removed';
  } else if (message.new_chat_photo) {
    text = 'Group photo updated';
  } else if (message.group_chat_created) {
    text = 'Group created';
  } else if (message.supergroup_chat_created) {
    text = 'Supergroup created';
  } else if (message.channel_chat_created) {
    text = 'Channel created';
  } else if (message.pinned_message) {
    text = 'Message pinned';
  } else if (message.migrate_to_chat_id) {
    text = 'Group upgraded to supergroup';
  } else {
    text = 'Service message';
  }

  return (
    <div className="my-1.5 flex justify-center">
      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        {text}
      </div>
    </div>
  );
}

function PhotoMessage({
  photo,
  caption,
  entities,
  isOutgoing,
}: {
  photo: any[];
  caption?: string;
  entities?: any[];
  isOutgoing: boolean;
}) {
  // Sort by size descending, pick best within range
  const sorted = [...photo].sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
  const best = sorted.find((p) => p.width >= 100) || sorted[0];

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

function AudioMessage({ audio, isOutgoing }: { audio: any; isOutgoing: boolean }) {
  const { url } = useFileUrl(audio.file_unique_id, 0);
  const thumbId = audio.thumbnail?.file_unique_id;
  const { url: thumbUrl } = useFileUrl(thumbId, 0);

  return (
    <div className="flex min-w-0 items-center gap-3 py-1">
      <div
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ${
          isOutgoing ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/30'
        }`}
      >
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Music size={20} className="opacity-60" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{audio.title || audio.file_name || 'Audio'}</p>
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
          className={`shrink-0 rounded-full p-1.5 transition-colors ${isOutgoing ? 'hover:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <Download size={16} />
        </a>
      )}
    </div>
  );
}

function AnimationMessage({
  message,
  animation,
  isOutgoing,
}: {
  message: any;
  animation: any;
  isOutgoing: boolean;
}) {
  const thumbId = animation.thumbnail?.file_unique_id;
  const { url: animUrl } = useFileUrl(animation.file_unique_id, 2);
  const { url: thumbUrl } = useFileUrl(thumbId, 3);

  return (
    <div className="space-y-1">
      <div className="relative overflow-hidden rounded" style={{ maxWidth: 280 }}>
        {animUrl ? (
          <img src={animUrl} alt="GIF" className="w-full rounded" style={{ maxHeight: 200 }} />
        ) : thumbUrl ? (
          <div className="relative">
            <img src={thumbUrl} alt="" className="w-full rounded" />
            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
              GIF
            </span>
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
      {message.caption && (
        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
          {renderTextWithEntities(message.caption, message.caption_entities, isOutgoing)}
        </p>
      )}
    </div>
  );
}

function VideoNoteMessage({ videoNote }: { videoNote: any }) {
  const { url: vnUrl } = useFileUrl(videoNote.file_unique_id, 2);
  const thumbId = videoNote.thumbnail?.file_unique_id;
  const { url: thumbUrl } = useFileUrl(thumbId, 3);

  return (
    <div className="relative overflow-hidden rounded-full" style={{ width: 140, height: 140 }}>
      {vnUrl ? (
        <video src={vnUrl} controls loop className="h-full w-full object-cover" />
      ) : thumbUrl ? (
        <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black/20">
          <Film size={32} className="opacity-40" />
        </div>
      )}
      {videoNote.duration && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white">
          {formatDuration(videoNote.duration)}
        </span>
      )}
    </div>
  );
}

// ─── Gap indicator ────────────────────────────────────────────────────────────

function GapIndicator({ count }: { count: number }) {
  return (
    <div className="my-2 flex justify-center">
      <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-500 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <span className="h-1 w-1 rounded-full bg-red-400" />
        {count} message{count > 1 ? 's' : ''} missing
      </div>
    </div>
  );
}

// ─── Message footer ───────────────────────────────────────────────────────────

function MessageFooter({ message, isOutgoing }: { message: any; isOutgoing: boolean }) {
  const time = new Date(message.date * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const edited = !!message.edit_date;

  return (
    <div
      className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${isOutgoing ? 'text-blue-100/80' : 'text-gray-400 dark:text-gray-500'}`}
    >
      {edited && <span className="opacity-70">edited</span>}
      <span className="tabular-nums">{time}</span>
    </div>
  );
}

// ─── Main Message component ───────────────────────────────────────────────────

export function Message({ message }: { message: MessageWithGap }) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!contextMenu) return;
    const handle = () => setContextMenu(null);
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [contextMenu]);

  // Gap indicator
  if (message.isGap && message.gapCount) {
    return <GapIndicator count={message.gapCount} />;
  }

  // Service messages
  const msg = message as any;
  if (
    message.message_type === 'service' ||
    msg.new_chat_members?.length ||
    msg.left_chat_member ||
    msg.new_chat_title ||
    msg.group_chat_created ||
    msg.supergroup_chat_created ||
    msg.channel_chat_created ||
    msg.delete_chat_photo ||
    msg.pinned_message
  ) {
    return <ServiceMessage message={msg} />;
  }

  const isOutgoing = message.from?.is_bot || false;
  const isSticker = message.message_type === 'sticker';

  const forwardLabel = getForwardLabel(msg);
  const hasReply = !!msg.reply_to_message;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCopy = () => {
    const text = message.text || message.caption || '';
    if (text) navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  // Sticker — no bubble
  if (isSticker && msg.sticker) {
    return (
      <div
        className={`mb-1 flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
        onContextMenu={handleContextMenu}
      >
        <StickerMessage sticker={msg.sticker} />
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onInfo={() => {
              setShowInfo(true);
              setContextMenu(null);
            }}
          />
        )}
        {showInfo && <FullInfoModal message={message} onClose={() => setShowInfo(false)} />}
      </div>
    );
  }

  // Bubble styles
  const bubbleCls = isOutgoing
    ? 'bg-blue-500 text-white rounded-2xl rounded-br-sm'
    : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-700';

  const bubbleShadow = 'shadow-[0_1px_2px_rgba(0,0,0,0.08)]';

  // Determine if we need extra width for media
  const isPhoto = message.message_type === 'photo' || !!msg.photo;
  const isVideo = message.message_type === 'video' || !!msg.video;
  const isAnimation = message.message_type === 'animation' || !!msg.animation;

  const maxWidthCls =
    isPhoto || isVideo || isAnimation
      ? 'max-w-[280px] sm:max-w-[320px]'
      : 'max-w-[72%] sm:max-w-[60%]';

  return (
    <>
      <div
        className={`mb-1 flex ${isOutgoing ? 'justify-end' : 'justify-start'} items-end gap-2`}
        onContextMenu={handleContextMenu}
      >
        {/* Left-side sender avatar (non-outgoing, group chats) */}
        {!isOutgoing && message.from && (
          <div
            className="mb-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full"
            title={`${message.from.first_name} ${message.from.last_name || ''}`}
          >
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-400 to-purple-500 text-[10px] font-bold text-white">
              {message.from.first_name[0]}
            </div>
          </div>
        )}

        <div className={`${maxWidthCls} flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
          <div
            className={`${bubbleCls} ${bubbleShadow} ${isPhoto || isVideo || isAnimation ? 'overflow-hidden p-0' : 'px-3 py-2'} max-w-full`}
          >
            {/* Inner padding wrapper for photo/video */}
            {isPhoto || isVideo || isAnimation ? (
              <div className="p-1">
                {/* Forward header */}
                {forwardLabel && (
                  <div className="px-2 pt-1">
                    <ForwardHeader forwardLabel={forwardLabel} isOutgoing={isOutgoing} />
                  </div>
                )}
                {/* Reply */}
                {hasReply && (
                  <div className="px-2 pt-1">
                    <ReplyQuote message={msg.reply_to_message} isOutgoing={isOutgoing} />
                  </div>
                )}
                {/* Sender name */}
                {!isOutgoing && message.from && (
                  <div className="px-2 pt-1">
                    <SenderName user={message.from} />
                  </div>
                )}
                {/* Content */}
                <div className="px-1">
                  <MessageContent message={message} isOutgoing={isOutgoing} />
                </div>
                {/* Footer */}
                <div className="px-2 pb-1">
                  <MessageFooter message={message} isOutgoing={isOutgoing} />
                </div>
              </div>
            ) : (
              <>
                {/* Forward header */}
                {forwardLabel && (
                  <ForwardHeader forwardLabel={forwardLabel} isOutgoing={isOutgoing} />
                )}
                {/* Reply */}
                {hasReply && <ReplyQuote message={msg.reply_to_message} isOutgoing={isOutgoing} />}
                {/* Sender name */}
                {!isOutgoing && message.from && <SenderName user={message.from} />}
                {/* Content */}
                <MessageContent message={message} isOutgoing={isOutgoing} />
                {/* Footer */}
                <MessageFooter message={message} isOutgoing={isOutgoing} />
              </>
            )}
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasText={!!(message.text || message.caption)}
          onCopy={handleCopy}
          onInfo={() => {
            setShowInfo(true);
            setContextMenu(null);
          }}
        />
      )}
      {showInfo && <FullInfoModal message={message} onClose={() => setShowInfo(false)} />}
    </>
  );
}

function SenderName({ user }: { user: any }) {
  const colors = [
    'text-blue-600',
    'text-rose-500',
    'text-amber-600',
    'text-emerald-600',
    'text-violet-600',
    'text-cyan-600',
  ];
  const color = colors[Math.abs(user.id) % colors.length];
  return (
    <p className={`mb-0.5 text-xs font-semibold ${color} dark:opacity-90`}>
      {user.first_name} {user.last_name || ''}
      {user.username && <span className="ml-1 font-normal opacity-60">@{user.username}</span>}
    </p>
  );
}

function MessageContent({ message, isOutgoing }: { message: MessageWithGap; isOutgoing: boolean }) {
  const msg = message as any;

  // Photo
  if (message.message_type === 'photo' || msg.photo?.length) {
    return (
      <PhotoMessage
        photo={msg.photo}
        caption={message.caption}
        entities={msg.caption_entities}
        isOutgoing={isOutgoing}
      />
    );
  }

  // Video
  if (message.message_type === 'video' || msg.video) {
    return (
      <VideoMessage
        video={msg.video}
        caption={message.caption}
        entities={msg.caption_entities}
        isOutgoing={isOutgoing}
      />
    );
  }

  // Animation (GIF)
  if (message.message_type === 'animation' || msg.animation) {
    return <AnimationMessage message={msg} animation={msg.animation} isOutgoing={isOutgoing} />;
  }

  // Audio
  if (message.message_type === 'audio' || msg.audio) {
    return <AudioMessage audio={msg.audio} isOutgoing={isOutgoing} />;
  }

  // Voice
  if (message.message_type === 'voice' || msg.voice) {
    return (
      <VoiceMessage
        fileUniqueId={msg.voice.file_unique_id}
        duration={msg.voice.duration || 0}
        isOutgoing={isOutgoing}
      />
    );
  }

  // Document
  if (message.message_type === 'document' || msg.document) {
    return (
      <div className="space-y-1.5">
        <MediaFile
          fileUniqueId={msg.document.file_unique_id}
          fileName={msg.document.file_name}
          mimeType={msg.document.mime_type}
          fileSize={msg.document.file_size}
          isOutgoing={isOutgoing}
        />
        {message.caption && (
          <p className="border-t border-current/10 pt-1.5 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
            {renderTextWithEntities(message.caption, msg.caption_entities, isOutgoing)}
          </p>
        )}
      </div>
    );
  }

  // Sticker — handled separately above but included for safety
  if (message.message_type === 'sticker' || msg.sticker) {
    return <StickerMessage sticker={msg.sticker} />;
  }

  // Video note (round video)
  if (message.message_type === 'video_note' || msg.video_note) {
    return <VideoNoteMessage videoNote={msg.video_note} />;
  }

  // Location
  if (message.message_type === 'location' || msg.location) {
    return (
      <LocationMessage
        lat={msg.location.latitude}
        lng={msg.location.longitude}
        isOutgoing={isOutgoing}
      />
    );
  }

  // Contact
  if (message.message_type === 'contact' || msg.contact) {
    return <ContactMessage contact={msg.contact} isOutgoing={isOutgoing} />;
  }

  // Poll
  if (message.message_type === 'poll' || msg.poll) {
    return <PollMessage poll={msg.poll} isOutgoing={isOutgoing} />;
  }

  // Text (fallback)
  if (message.text) {
    return (
      <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
        {renderTextWithEntities(message.text, msg.entities, isOutgoing)}
      </p>
    );
  }

  // Unknown
  return (
    <p className="text-xs text-red-400 dark:text-red-300">Unsupported: {message.message_type}</p>
  );
}

function ContextMenu({
  x,
  y,
  hasText,
  onCopy,
  onInfo,
}: {
  x: number;
  y: number;
  hasText?: boolean;
  onCopy?: () => void;
  onInfo: () => void;
}) {
  return (
    <div
      className="fixed z-50 min-w-[140px] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
      style={{
        left: Math.min(x, window.innerWidth - 160),
        top: Math.min(y, window.innerHeight - 100),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {hasText && onCopy && (
        <button
          onClick={onCopy}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Copy size={14} className="opacity-60" /> Copy text
        </button>
      )}
      <button
        onClick={onInfo}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <Info size={14} className="opacity-60" /> Message info
      </button>
    </div>
  );
}

function FullInfoModal({ message, onClose }: { message: MessageWithGap; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Message Info</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <pre className="overflow-auto rounded-xl bg-gray-50 p-4 text-xs leading-relaxed dark:bg-gray-900">
          {JSON.stringify(message, null, 2)}
        </pre>
      </div>
    </div>
  );
}
