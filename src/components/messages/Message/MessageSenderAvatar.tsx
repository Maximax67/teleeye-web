'use client';

import { useUserAvatar } from '@/lib/userAvatarScheduler';
import type { TelegramUserInfo } from '@/types';

interface MessageSenderAvatarProps {
  user: TelegramUserInfo;
  size?: number;
}

// Rich gradient palette keyed by user id
const AVATAR_GRADIENTS = [
  ['#6366f1', '#8b5cf6'], // indigo → violet
  ['#ec4899', '#f43f5e'], // pink → rose
  ['#f59e0b', '#ef4444'], // amber → red
  ['#10b981', '#06b6d4'], // emerald → cyan
  ['#3b82f6', '#6366f1'], // blue → indigo
  ['#f97316', '#f59e0b'], // orange → amber
  ['#8b5cf6', '#ec4899'], // violet → pink
  ['#14b8a6', '#10b981'], // teal → emerald
  ['#06b6d4', '#3b82f6'], // cyan → blue
  ['#84cc16', '#10b981'], // lime → emerald
  ['#a855f7', '#ec4899'], // purple → pink
  ['#f43f5e', '#f97316'], // rose → orange
] as const;

function getGradient(id: number): readonly [string, string] {
  return AVATAR_GRADIENTS[Math.abs(id) % AVATAR_GRADIENTS.length];
}

function getInitials(user: TelegramUserInfo): string {
  const first = user.first_name?.[0] ?? '';
  const last = user.last_name?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

export function MessageSenderAvatar({ user, size = 24 }: MessageSenderAvatarProps) {
  const { url, loading } = useUserAvatar(user.id, 4);
  const [from, to] = getGradient(user.id);
  const initials = getInitials(user);
  const title = [user.first_name, user.last_name].filter(Boolean).join(' ');

  return (
    <div
      className="shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
      title={title}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${from}, ${to})`,
            fontSize: size * 0.38,
          }}
        >
          {loading ? null : initials}
        </div>
      )}
    </div>
  );
}
