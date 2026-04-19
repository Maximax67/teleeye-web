'use client';

import { Copy, Info } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  hasText: boolean;
  onCopy?: () => void;
  onInfo: () => void;
}

export function ContextMenu({ x, y, hasText, onCopy, onInfo }: ContextMenuProps) {
  const safeX = typeof window !== 'undefined' ? Math.min(x, window.innerWidth - 160) : x;
  const safeY = typeof window !== 'undefined' ? Math.min(y, window.innerHeight - 100) : y;

  return (
    <div
      className="fixed z-50 min-w-35 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
      style={{ left: safeX, top: safeY }}
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
