import { forwardRef } from 'react';

interface UnreadSeparatorProps {
  className?: string;
}

export const UnreadSeparator = forwardRef<HTMLDivElement, UnreadSeparatorProps>(
  function UnreadSeparator({ className }, ref) {
    return (
      <div
        ref={ref}
        className={`relative my-3 flex items-center justify-center ${className ?? ''}`}
        aria-label="Unread messages"
      >
        {/* Line */}
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="h-px w-full bg-blue-200 dark:bg-blue-800" />
        </div>

        {/* Badge */}
        <div className="relative z-10 flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
          Unread messages
        </div>
      </div>
    );
  },
);
