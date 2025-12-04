import { apiClient } from '@/lib/api';
import { dbCache } from '@/lib/indexeddb';
import { getChatInitials } from '@/lib/utils';
import { Chat } from '@/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ChatAvatarProps {
  chat: Chat;
}

export const ChatAvatar = ({ chat }: ChatAvatarProps) => {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAvatar = async () => {
      try {
        const cached = await dbCache.getAvatar(chat.id);
        if (typeof cached !== 'undefined') {
          if (isMounted) {
            setAvatar(cached);
          }

          return;
        }

        const blob = await apiClient.getChatAvatar(chat.id);
        dbCache.setAvatar(chat.id, blob);

        if (blob && isMounted) {
          setAvatar(URL.createObjectURL(blob));
        }
      } catch (error) {
        console.error('Failed to load avatar:', error);
        setAvatar(null);
      }
    };

    fetchAvatar();

    return () => {
      isMounted = false;
    };
  }, [chat.id]);

  const chatInitials = getChatInitials(chat).toUpperCase();

  return (
    <div
      className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${avatar ? '' : 'bg-gradient-to-br from-blue-400 to-purple-500'} `}
    >
      {avatar ? (
        <Image src={avatar} alt="Avatar" className="object-cover" fill sizes="48px" />
      ) : (
        chatInitials
      )}
    </div>
  );
};
