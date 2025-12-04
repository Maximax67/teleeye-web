import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { User } from '@/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import InputField from '@/components/ui/InputField';
import { PASSWORD_REGEX } from '@/constants';
import { getErrorMessage } from '@/lib/utils';

interface ChangePasswordProps {
  user: User | null;
  onCancel: () => void;
  router: AppRouterInstance;
  onClose: () => void;
}

export function ChangePassword({ user, onCancel, router, onClose }: ChangePasswordProps) {
  const { logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPasswordValid, setOldPasswordValid] = useState(false);
  const [newPasswordValid, setNewPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

  const handleChangePassword = async () => {
    if (!oldPasswordValid || !newPasswordValid || changePasswordLoading) return;

    if (newPassword !== confirmPassword) {
      setChangePasswordError('Passwords do not match');
      return;
    }

    if (!user?.email) {
      setChangePasswordError('Email not found');
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError('');

    try {
      await apiClient.changePassword(user.email, oldPassword, newPassword);
      await logout();
      router.push('/login');
      onClose();
    } catch (error) {
      setChangePasswordError(getErrorMessage(error, 'Failed to change password'));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Change Password</h3>
      <InputField
        label="Current Password"
        password
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        regexPattern={PASSWORD_REGEX}
        regexPatternMessage="Password must include at least one uppercase letter, one lowercase letter and one number"
        minLength={8}
        maxLength={32}
        onValidate={(isValid) => setOldPasswordValid(isValid)}
      />
      <InputField
        label="New Password"
        password
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        regexPattern={PASSWORD_REGEX}
        regexPatternMessage="Password must include at least one uppercase letter, one lowercase letter and one number"
        minLength={8}
        maxLength={32}
        onValidate={(isValid) => setNewPasswordValid(isValid)}
      />
      <InputField
        label="Confirm New Password"
        password
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onEnter={handleChangePassword}
        regexPattern={PASSWORD_REGEX}
        regexPatternMessage="Password must include at least one uppercase letter, one lowercase letter and one number"
        minLength={8}
        maxLength={32}
        onValidate={(isValid) => setConfirmPasswordValid(isValid)}
      />
      {confirmPassword.length > 0 && newPassword.length > 0 && confirmPassword !== newPassword && (
        <p className="-mt-3 mb-4 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
      )}
      {changePasswordError && (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">{changePasswordError}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleChangePassword}
          disabled={
            !oldPasswordValid ||
            !newPasswordValid ||
            !confirmPasswordValid ||
            newPassword !== confirmPassword ||
            changePasswordLoading
          }
          className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-400"
        >
          {changePasswordLoading ? 'Changing...' : 'Change Password'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300"
        >
          Cancel
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        Note: Changing your password will log you out
      </p>
    </div>
  );
}
