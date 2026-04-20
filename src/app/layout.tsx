import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.CF_PAGES_URL) return process.env.CF_PAGES_URL; // Cloudflare
  return 'http://localhost:3000'; // Fallback
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: 'TeleEye',
    template: '%s · TeleEye',
  },
  description: 'View and manage your Telegram messages with full-featured bot support.',
  applicationName: 'TeleEye',
  keywords: ['telegram', 'bot', 'messages', 'viewer', 'teleeye'],
  authors: [{ name: 'TeleEye' }],
  creator: 'TeleEye',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TeleEye',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'TeleEye',
    title: 'TeleEye — Telegram Message Viewer',
    description: 'View and manage your Telegram messages with full-featured bot support.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeleEye',
    description: 'View and manage your Telegram messages with full-featured bot support.',
  },
  icons: {
    icon: [
      { url: '/icon/32', type: 'image/png', sizes: '32x32' },
      { url: '/icon/192', type: 'image/png', sizes: '192x192' },
      { url: '/icon/512', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
    shortcut: '/icon/32',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
