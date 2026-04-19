'use client';

import { Phone, User } from 'lucide-react';
import type { ContactInfo } from '@/types';

interface ContactMessageProps {
  contact: ContactInfo;
  isOutgoing: boolean;
}

export function ContactMessage({ contact, isOutgoing }: ContactMessageProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 py-1">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isOutgoing ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
        }`}
      >
        <User size={20} className="opacity-60" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {contact.first_name} {contact.last_name ?? ''}
        </p>
        {contact.phone_number && (
          <a
            href={`tel:${contact.phone_number}`}
            className={`flex items-center gap-1 text-xs ${
              isOutgoing ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            <Phone size={10} />
            {contact.phone_number}
          </a>
        )}
      </div>
    </div>
  );
}
