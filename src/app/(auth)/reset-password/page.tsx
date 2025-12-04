'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthScaffold from '@/components/AuthScaffold';
import InputField from '@/components/ui/InputField';
import { EMAIL_REGEX, PASSWORD_REGEX, OTP_LENGTH } from '@/constants';
import { apiClient } from '@/lib/api';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpValid, setOtpValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  const handleEmailSubmit = async () => {
    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await apiClient.forgotPassword(email);
      setSuccessMessage('If an account exists with this email, a reset code has been sent.');
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async () => {
    if (!otpValid || !passwordValid) {
      setError('Please fix the errors before resetting your password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await apiClient.resetPassword(email, otp, newPassword);
      setSuccessMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      setLoading(false);
    }
  };

  const isEmailFormValid = emailValid;
  const isResetFormValid = otpValid && passwordValid;

  return (
    <AuthScaffold
      subtitle={step === 'email' ? 'Reset your password' : 'Enter reset code and new password'}
      titleClassName="text-red-600 dark:text-red-400"
      error={error}
    >
      {successMessage && !error && !loading && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
          {successMessage}
        </div>
      )}

      {step === 'email' ? (
        <>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onEnter={handleEmailSubmit}
            regexPattern={EMAIL_REGEX}
            regexPatternMessage="Please enter a valid email address"
            onValidate={(isValid) => setEmailValid(isValid)}
            placeholder="Enter your email"
          />

          <button
            onClick={handleEmailSubmit}
            disabled={loading || !isEmailFormValid}
            className="mt-2 w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white shadow-lg transition-colors hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </>
      ) : (
        <>
          <InputField
            label="Reset Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            onEnter={handleResetSubmit}
            regexPattern={new RegExp(`^\\d{${OTP_LENGTH}}$`)}
            regexPatternMessage={`Please enter a ${OTP_LENGTH}-digit code`}
            onValidate={(isValid) => setOtpValid(isValid)}
            placeholder="Enter 6-digit code"
          />

          <InputField
            label="New Password"
            password
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onEnter={handleResetSubmit}
            regexPattern={PASSWORD_REGEX}
            regexPatternMessage="Password must include at least one uppercase letter, one lowercase letter and one number"
            minLength={8}
            maxLength={32}
            onValidate={(isValid) => setPasswordValid(isValid)}
            placeholder="Enter new password"
          />

          <button
            onClick={handleResetSubmit}
            disabled={loading || !isResetFormValid}
            className="mt-2 w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white shadow-lg transition-colors hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <button
            onClick={() => {
              setStep('email');
              setOtp('');
              setNewPassword('');
              setError('');
              setSuccessMessage('');
            }}
            className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Back to Email
          </button>
        </>
      )}

      <div className="text-center">
        <Link href="/login" className="text-sm text-red-600 hover:underline dark:text-red-400">
          Back to sign in
        </Link>
      </div>
    </AuthScaffold>
  );
}
