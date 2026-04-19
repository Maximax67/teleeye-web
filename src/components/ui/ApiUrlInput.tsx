'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2, Server } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { storage, DEFAULT_API_URL } from '@/lib/storage';

interface ApiUrlInputProps {
  /** Called after the URL is successfully tested and saved */
  onSaved?: (url: string) => void;
}

type TestStatus = 'idle' | 'testing' | 'ok' | 'fail';

export default function ApiUrlInput({ onSaved }: ApiUrlInputProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState('');
  const [status, setStatus] = useState<TestStatus>('idle');

  // Read current value from storage on mount (client-only)
  useEffect(() => {
    const current = storage.getApiUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(current);
    setSaved(current);
  }, []);

  const isDirty = url.trim().replace(/\/$/, '') !== saved;

  const handleTest = async () => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (!trimmed) return;

    setStatus('testing');
    const ok = await apiClient.testApiUrl(trimmed);
    setStatus(ok ? 'ok' : 'fail');
  };

  const handleSave = async () => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (!trimmed) return;

    setStatus('testing');
    const ok = await apiClient.testApiUrl(trimmed);

    if (!ok) {
      setStatus('fail');
      return;
    }

    apiClient.setApiUrl(trimmed);
    setSaved(trimmed);
    setStatus('ok');
    onSaved?.(trimmed);
  };

  const handleReset = () => {
    setUrl(DEFAULT_API_URL);
    setStatus('idle');
  };

  const statusIcon = {
    idle: null,
    testing: <Loader2 size={14} className="animate-spin text-gray-400" />,
    ok: <CheckCircle size={14} className="text-green-500" />,
    fail: <XCircle size={14} className="text-red-500" />,
  }[status];

  const isCustom = saved !== DEFAULT_API_URL;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-xs text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <Server size={12} />
        <span className="flex-1 text-left">
          API:{' '}
          <span className={`font-mono ${isCustom ? 'text-blue-500 dark:text-blue-400' : ''}`}>
            {saved}
          </span>
        </span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            API Server URL
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setStatus('idle');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={DEFAULT_API_URL}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 pr-7 font-mono text-xs transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                spellCheck={false}
                autoComplete="off"
              />
              {statusIcon && (
                <span className="absolute top-1/2 right-2.5 -translate-y-1/2">{statusIcon}</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleTest}
              disabled={status === 'testing' || !url.trim()}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Test
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={status === 'testing' || !url.trim() || !isDirty}
              className="rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
            >
              Save
            </button>
          </div>

          {status === 'fail' && (
            <p className="mt-1.5 text-xs text-red-500">
              Server did not return 200. Check the URL and try again.
            </p>
          )}
          {status === 'ok' && !isDirty && (
            <p className="mt-1.5 text-xs text-green-500">Connected ✓</p>
          )}

          {url !== DEFAULT_API_URL && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 hover:underline dark:hover:text-gray-300"
            >
              Reset to default ({DEFAULT_API_URL})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
