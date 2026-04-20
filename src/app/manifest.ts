import type { MetadataRoute } from 'next';

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TeleEye',
    short_name: 'TeleEye',
    description: 'View and manage your Telegram messages with full-featured bot support.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [],
  };
}
