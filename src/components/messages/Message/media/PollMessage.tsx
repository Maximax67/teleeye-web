'use client';

import { BarChart2 } from 'lucide-react';
import type { PollInfo } from '@/types';

interface PollMessageProps {
  poll: PollInfo;
  isOutgoing: boolean;
}

export function PollMessage({ poll, isOutgoing }: PollMessageProps) {
  const total = poll.total_voter_count || 1;
  const typeLabel = poll.type === 'quiz' ? '🏆 Quiz' : '📊 Poll';

  return (
    <div className="min-w-50 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-60">
        <BarChart2 size={12} />
        {typeLabel} {poll.is_anonymous ? '· Anonymous' : ''} {poll.is_closed ? '· Closed' : ''}
      </div>

      <p className="text-sm leading-snug font-semibold">{poll.question}</p>

      <div className="space-y-1.5">
        {poll.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((opt.voter_count / total) * 100) : 0;
          const isCorrect = poll.type === 'quiz' && i === poll.correct_option_id;

          return (
            <div key={i} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1 truncate">
                  {isCorrect && <span className="text-emerald-400">✓</span>}
                  {opt.text}
                </span>
                <span className="shrink-0 font-medium opacity-70">{pct}%</span>
              </div>
              <div
                className={`h-1.5 rounded-full ${isOutgoing ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    isCorrect ? 'bg-emerald-400' : isOutgoing ? 'bg-white/80' : 'bg-blue-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs opacity-50">
        {poll.total_voter_count} vote{poll.total_voter_count !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
