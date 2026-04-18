'use client';

import { getChatInitials } from '@/lib/utils';
import { Chat } from '@/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { avatarScheduler } from '@/lib/avatarScheduler';

interface ChatAvatarProps {
  chat: Chat;
  priority?: number;
  size?: 'sm' | 'md' | 'lg';
}

const AVATAR_COLORS = [
  'from-blue-400 to-indigo-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-sky-500',
  'from-lime-400 to-green-500',
  'from-fuchsia-400 to-rose-500',
];

function getChatColor(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

export const ChatAvatar = ({ chat, priority = 0, size = 'md' }: ChatAvatarProps) => {
  const [avatar, setAvatar] = useState<string | null>(null);

  const sizeClass =
    size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-base' : 'h-12 w-12 text-sm';
  const imgSize = size === 'sm' ? 32 : size === 'lg' ? 56 : 48;

  useEffect(() => {
    let cancelled = false;
    avatarScheduler.getAvatar(chat.id, priority).then((url) => {
      if (!cancelled) setAvatar(url);
    });
    return () => {
      cancelled = true;
    };
  }, [chat.id, priority]);

  const initials = getChatInitials(chat).toUpperCase();
  const colorClass = getChatColor(chat.id);

  return (
    <div
      className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${!avatar ? `bg-linear-to-br ${colorClass}` : ''}`}
    >
      {avatar ? (
        <Image
          src={avatar}
          alt={initials}
          className="object-cover"
          fill
          sizes={`${imgSize}px`}
          unoptimized
        />
      ) : (
        initials
      )}
    </div>
  );
};
