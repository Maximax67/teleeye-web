import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import InputField from '@/components/ui/InputField';
import { EMAIL_REGEX } from '@/constants';
import { getErrorMessage } from '@/lib/utils';

interface ChangeEmailProps {
  onCancel: () => void;
  router: AppRouterInstance;
  onClose: () => void;
}

export function ChangeEmail({ onCancel, router, onClose }: ChangeEmailProps) {
  const { logout } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [newEmailValid, setNewEmailValid] = useState(false);
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState('');

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEmail(e.target.value);
    setChangeEmailError('');
  };

  const handleChangeEmail = async () => {
    if (!newEmailValid || changeEmailLoading) return;

    setChangeEmailLoading(true);
    setChangeEmailError('');

    try {
      await apiClient.changeEmail(newEmail);
      await logout();
      router.push('/login');
      onClose();
    } catch (error) {
      setChangeEmailError(getErrorMessage(error, 'Failed to change email'));
    } finally {
      setChangeEmailLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Change Email</h3>
      <InputField
        label="New Email"
        value={newEmail}
        onChange={handleEmailInputChange}
        regexPattern={EMAIL_REGEX}
        regexPatternMessage="Enter a valid email address"
        onValidate={(isValid) => setNewEmailValid(isValid)}
        onEnter={handleChangeEmail}
      />
      {changeEmailError && (
        <p className="text-sm text-red-600 dark:text-red-400">{changeEmailError}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleChangeEmail}
          disabled={!newEmailValid || changeEmailLoading}
          className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-400"
        >
          {changeEmailLoading ? 'Changing...' : 'Change Email'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300"
        >
          Cancel
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        Note: Changing your email will log you out
      </p>
    </div>
  );
}
