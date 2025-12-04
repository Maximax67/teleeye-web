import { useState } from 'react';
import { LogOut, Key } from 'lucide-react';
import { User } from '@/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { EmailSection } from '../EmailSection';
import { EmailVerification } from '../EmailVerification';
import { ChangePassword } from '../ChangePassword';

interface ProfileTabProps {
  user: User | null;
  onLogout: () => void;
  onClose: () => void;
  router: AppRouterInstance;
}

export function ProfileTab({ user, onLogout, onClose, router }: ProfileTabProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <EmailSection user={user} router={router} onClose={onClose} />
        <EmailVerification user={user} />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-base text-gray-900 dark:bg-gray-900 dark:text-white">
            @{user?.username}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Role
          </label>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-base text-gray-900 capitalize dark:bg-gray-900 dark:text-white">
            {user?.role}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
        {!showChangePassword && (
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <Key size={20} /> Change Password
          </button>
        )}

        {showChangePassword && (
          <ChangePassword
            user={user}
            onCancel={() => setShowChangePassword(false)}
            router={router}
            onClose={onClose}
          />
        )}
      </div>

      <button
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-medium text-white transition-colors hover:bg-red-600"
      >
        <LogOut size={20} /> Logout
      </button>
    </div>
  );
}
