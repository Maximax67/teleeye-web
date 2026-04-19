'use client';

import { MapPin } from 'lucide-react';
import type { LocationInfo } from '@/types';

interface LocationMessageProps {
  location: LocationInfo;
  isOutgoing: boolean;
}

export function LocationMessage({ location, isOutgoing }: LocationMessageProps) {
  const mapUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded"
    >
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded ${
          isOutgoing ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-700'
        }`}
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
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isOutgoing ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
            }`}
          >
            <MapPin size={20} />
          </div>
          <p className="text-xs font-medium opacity-70">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
        </div>
      </div>
      <div
        className={`px-2 py-1 text-xs font-medium ${
          isOutgoing ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
        }`}
      >
        Open in Maps →
      </div>
    </a>
  );
}
