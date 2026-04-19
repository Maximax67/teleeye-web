'use client';

import { useFileUrl } from '@/lib/fileLoader';

interface MediaImageProps {
  fileUniqueId: string;
  alt?: string;
  className?: string;
  priority?: number;
}

export function MediaImage({ fileUniqueId, alt, className, priority = 0 }: MediaImageProps) {
  const { url, loading } = useFileUrl(fileUniqueId, priority);

  if (loading) {
    return (
      <div
        className={`animate-pulse rounded bg-black/10 dark:bg-white/10 ${className ?? 'h-48 w-full'}`}
      />
    );
  }

  if (!url) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-black/10 text-sm opacity-60 dark:bg-white/10 ${className ?? 'h-48 w-full'}`}
      >
        Image unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt ?? 'Image'}
      className={`rounded object-cover ${className ?? 'max-w-full'}`}
    />
  );
}
