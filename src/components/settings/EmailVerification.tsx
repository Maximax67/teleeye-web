import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { User } from '@/types';
import { OTP_LENGTH } from '@/constants';
import { getErrorMessage } from '@/lib/utils';

interface EmailVerificationProps {
  user: User | null;
}

export function EmailVerification({ user }: EmailVerificationProps) {
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  const handleSendVerificationEmail = async () => {
    setVerifyLoading(true);
    setVerifyError('');
    setVerifySuccess('');

    try {
      await apiClient.sendEmailConfirmation();
      setVerifySuccess('Verification email sent! Please check your inbox.');
      setShowVerifyEmail(true);
    } catch (error) {
      setVerifyError(getErrorMessage(error, 'Failed to send verification email'));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (verifyOtp.length !== OTP_LENGTH || !user) return;

    setVerifyLoading(true);
    setVerifyError('');

    try {
      await apiClient.verifyEmail(verifyOtp, user.id);
      await apiClient.refreshToken();
      setVerifySuccess('Email verified successfully!');
      setShowVerifyEmail(false);
      setVerifyOtp('');
      window.location.reload();
    } catch (error) {
      setVerifyError(getErrorMessage(error, 'Invalid verification code'));
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Status
        </label>
        <div className="flex items-center gap-2">
          <div
            className={`flex-1 rounded-lg px-3 py-2 text-base ${
              user?.email_verified
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}
          >
            {user?.email_verified ? 'Verified' : 'Not Verified'}
          </div>
          {!user?.email_verified && (
            <button
              onClick={handleSendVerificationEmail}
              disabled={verifyLoading}
              className="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 disabled:bg-gray-400"
            >
              {verifyLoading ? 'Sending...' : 'Verify'}
            </button>
          )}
        </div>
      </div>

      {verifySuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle size={16} />
          {verifySuccess}
        </div>
      )}

      {showVerifyEmail && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Enter Verification Code
          </h3>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Please enter the {OTP_LENGTH}-digit code sent to your email
          </p>
          <input
            type="text"
            value={verifyOtp}
            onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            onKeyDown={(e) =>
              e.key === 'Enter' && verifyOtp.length === OTP_LENGTH && handleVerifyEmail()
            }
            placeholder="000000"
            maxLength={OTP_LENGTH}
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          {verifyError && (
            <p className="mb-2 text-sm text-red-600 dark:text-red-400">{verifyError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleVerifyEmail}
              disabled={verifyOtp.length !== OTP_LENGTH || verifyLoading}
              className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 disabled:bg-gray-400"
            >
              {verifyLoading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button
              onClick={() => {
                setShowVerifyEmail(false);
                setVerifyOtp('');
                setVerifyError('');
              }}
              className="rounded-lg bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
