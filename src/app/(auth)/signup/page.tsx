'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import AuthScaffold from '@/components/AuthScaffold';
import InputField from '@/components/ui/InputField';
import ApiUrlInput from '@/components/ui/ApiUrlInput';
import { EMAIL_REGEX, PASSWORD_REGEX, USERNAME_REGEX } from '@/constants';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(false);

  const [username, setUsername] = useState('');
  const [usernameValid, setUsernameValid] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmValid, setConfirmValid] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const isFormValid =
    emailValid && usernameValid && passwordValid && confirmValid && passwordsMatch;

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError('Please fix form errors before submitting');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(email, username, password);
      router.push('/');
    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      subtitle="Create your account"
      titleClassName="text-purple-600 dark:text-purple-400"
      error={error}
    >
      <InputField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onEnter={handleSubmit}
        regexPattern={EMAIL_REGEX}
        regexPatternMessage="Enter a valid email"
        onValidate={(valid) => setEmailValid(valid)}
      />

      <InputField
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onEnter={handleSubmit}
        regexPattern={USERNAME_REGEX}
        regexPatternMessage="Username must contain only letters, numbers, or underscores"
        minLength={4}
        maxLength={16}
        onValidate={(valid) => setUsernameValid(valid)}
      />

      <InputField
        password
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onEnter={handleSubmit}
        regexPattern={PASSWORD_REGEX}
        regexPatternMessage="Password must include at least one uppercase letter, one lowercase letter and one number"
        minLength={8}
        maxLength={32}
        onValidate={(valid) => setPasswordValid(valid)}
      />

      <InputField
        password
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onEnter={handleSubmit}
        regexPattern={PASSWORD_REGEX}
        regexPatternMessage="Password must include at least one uppercase letter, one lowercase letter and one number"
        minLength={8}
        maxLength={32}
        onValidate={(valid) => setConfirmValid(valid)}
      />

      {confirmPassword.length > 0 && password.length > 0 && !passwordsMatch && (
        <p className="-mt-3 mb-4 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !isFormValid}
        className="mt-2 w-full rounded-lg bg-purple-600 px-4 py-3 font-medium text-white shadow-lg transition-colors hover:bg-purple-700 disabled:bg-gray-400"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-purple-600 hover:underline dark:text-purple-400"
        >
          Already have an account? Sign in
        </Link>
      </div>

      <div className="mt-2 border-t border-gray-100 pt-3 dark:border-gray-700">
        <ApiUrlInput />
      </div>
    </AuthScaffold>
  );
}
