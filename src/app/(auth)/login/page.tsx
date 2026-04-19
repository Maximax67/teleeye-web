'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AuthScaffold from '@/components/AuthScaffold';
import InputField from '@/components/ui/InputField';
import ApiUrlInput from '@/components/ui/ApiUrlInput';
import { EMAIL_REGEX, PASSWORD_REGEX, USERNAME_OR_EMAIL_REGEX } from '@/constants';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierValid, setIdentifierValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const isFormValid = identifierValid && passwordValid;

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError('Please fix the errors before signing in');
      return;
    }

    setError('');
    setLoading(true);

    const isEmailValid = EMAIL_REGEX.test(identifier);

    try {
      await login(identifier, password, isEmailValid);
      router.push('/');
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      subtitle="Sign in to your account"
      titleClassName="text-blue-600 dark:text-blue-400"
      error={error}
    >
      <InputField
        label="Username or Email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        onEnter={handleSubmit}
        regexPattern={USERNAME_OR_EMAIL_REGEX}
        regexPatternMessage="Enter a valid username or email"
        onValidate={(isValid) => setIdentifierValid(isValid)}
      />

      <InputField
        label="Password"
        password
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onEnter={handleSubmit}
        regexPattern={PASSWORD_REGEX}
        regexPatternMessage="Password must include at least one uppercase letter, one lowercase letter and one number"
        minLength={8}
        maxLength={32}
        onValidate={(isValid) => setPasswordValid(isValid)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !isFormValid}
        className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-lg transition-colors hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="mt-4 space-y-2 text-center">
        <Link
          href="/signup"
          className="block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Don&apos;t have an account? Sign up
        </Link>

        <Link
          href="/reset-password"
          className="block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Forgot your password?
        </Link>
      </div>

      <div className="mt-2 border-t border-gray-100 pt-3 dark:border-gray-700">
        <ApiUrlInput />
      </div>
    </AuthScaffold>
  );
}
