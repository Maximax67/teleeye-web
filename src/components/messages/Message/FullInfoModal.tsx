'use client';

import { X } from 'lucide-react';
import type { Message } from '@/types';

interface FullInfoModalProps {
  message: Message;
  onClose: () => void;
}

export function FullInfoModal({ message, onClose }: FullInfoModalProps) {
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
