import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { User } from '@/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ChangeEmail } from './ChangeEmail';

interface EmailSectionProps {
  user: User | null;
  router: AppRouterInstance;
  onClose: () => void;
}

export function EmailSection({ user, router, onClose }: EmailSectionProps) {
  const [showChangeEmail, setShowChangeEmail] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Email
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-base text-gray-900 dark:bg-gray-900 dark:text-white">
          {user?.email}
        </div>
        {!showChangeEmail && (
          <button
            onClick={() => setShowChangeEmail(true)}
            className="rounded-lg bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
            title="Change email"
          >
            <Pencil size={20} />
          </button>
        )}
      </div>

      {showChangeEmail && (
        <ChangeEmail onCancel={() => setShowChangeEmail(false)} router={router} onClose={onClose} />
      )}
    </div>
  );
}
