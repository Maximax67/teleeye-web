import { OctagonX } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Session } from '@/types';

interface SessionsTabProps {
  sessions: Session[];
  onLoadSessions: () => Promise<void>;
  onTerminateAll: () => void;
}

export function SessionsTab({ sessions, onLoadSessions, onTerminateAll }: SessionsTabProps) {
  const revokeSession = async (sessionId: number) => {
    if (!confirm('Revoke this session?')) return;

    try {
      await apiClient.revokeSession(sessionId);
      await onLoadSessions();
    } catch (error) {
      console.error(error);
      alert('Failed to revoke session');
    }
  };

  return (
    <div className="space-y-2">
      {sessions.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">No sessions found</div>
      ) : (
        sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700"
          >
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                {session.name || `Session #${session.id}`}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Created: {new Date(session.created_at).toLocaleString()}
              </div>
              {session.is_current && (
                <div className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                  Current session
                </div>
              )}
            </div>
            {!session.is_current && (
              <button
                onClick={() => revokeSession(session.id)}
                className="ml-2 rounded bg-red-500 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600"
              >
                Revoke
              </button>
            )}
          </div>
        ))
      )}
      <button
        onClick={onTerminateAll}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-medium text-white transition-colors hover:bg-red-600"
      >
        <OctagonX size={20} /> Terminate all sessions
      </button>
    </div>
  );
}
