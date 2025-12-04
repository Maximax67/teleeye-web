import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { ReactNode } from 'react';

type AuthScaffoldProps = {
  children: ReactNode;
  subtitle?: string;
  error?: string;
  titleClassName?: string;
};

export default function AuthScaffold({
  subtitle,
  error,
  children,
  titleClassName = '',
}: AuthScaffoldProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="rounded-full bg-white p-2 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800"
        >
          {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800">
          <div className="mb-8 text-center">
            <h1 className={`mb-2 text-4xl font-bold ${titleClassName}`}>TeleEye</h1>
            <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
