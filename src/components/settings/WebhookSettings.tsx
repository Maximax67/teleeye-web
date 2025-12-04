import { apiClient, ApiError } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { WebhookInfo } from '@/types';
import { AlertCircle, CheckCircle, RefreshCw, Settings, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { MultiSelect } from '../ui/MultiSelect';
import { UPDATE_TYPES } from '@/constants';
import InputField from '../ui/InputField';

interface WebhookSettingsProps {
  botId: number;
  botName: string;
  onClose: () => void;
}

export function WebhookSettings({ botId, botName, onClose }: WebhookSettingsProps) {
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasWebhook, setHasWebhook] = useState(false);

  const [url, setUrl] = useState('');
  const [maxConnections, setMaxConnections] = useState<string>('40');
  const [allowedUpdates, setAllowedUpdates] = useState<string[]>([]);
  const [dropPendingUpdates, setDropPendingUpdates] = useState(false);
  const [secretToken, setSecretToken] = useState('');

  const [urlValid, setUrlValid] = useState(true);
  const [maxConnValid, setMaxConnValid] = useState(true);
  const [tokenValid, setTokenValid] = useState(true);

  const loadWebhookInfo = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const info = await apiClient.getWebhookInfo(botId);
      setWebhookInfo(info);
      setHasWebhook(true);

      setUrl(info.url || '');
      setMaxConnections(info.max_connections?.toString() || '40');
      setAllowedUpdates(info.allowed_updates || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setHasWebhook(false);
        setWebhookInfo(null);
      } else {
        setError(getErrorMessage(err, 'Failed to load webhook info'));
      }
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    loadWebhookInfo();
  }, [loadWebhookInfo]);

  const handleSetWebhook = async () => {
    setLoading(true);
    setError('');

    try {
      const data = {
        url: url.trim() || null,
        max_connections: maxConnections ? parseInt(maxConnections) : null,
        allowed_updates: allowedUpdates.length > 0 ? allowedUpdates : null,
        drop_pending_updates: dropPendingUpdates,
        secret_token: secretToken.trim() || null,
      };

      await apiClient.setWebhook(botId, data);
      setIsEditing(false);
      await loadWebhookInfo();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to set webhook'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    setLoading(true);
    setError('');

    try {
      await apiClient.deleteWebhook(botId, dropPendingUpdates);
      setHasWebhook(false);
      setWebhookInfo(null);
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete webhook'));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    if (!hasWebhook) {
      setUrl('');
      setMaxConnections('40');
      setAllowedUpdates([]);
      setDropPendingUpdates(false);
      setSecretToken('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Webhook Settings
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{botName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading && !webhookInfo && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-blue-500" size={32} />
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* VIEW MODE */}
          {!loading && !isEditing && (
            <>
              {!hasWebhook && (
                <div className="py-12 text-center">
                  <Settings className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="mb-4 text-gray-600 dark:text-gray-400">No webhook configured</p>
                  <button
                    onClick={startEditing}
                    className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
                  >
                    Configure Webhook
                  </button>
                </div>
              )}

              {hasWebhook && webhookInfo && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Webhook URL</label>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm break-all dark:bg-gray-900">
                      {webhookInfo.url || <span className="text-gray-500">Not set</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Custom Certificate</label>
                      <div
                        className={`rounded-lg px-3 py-2 text-sm ${webhookInfo.has_custom_certificate ? 'bg-green-50 text-green-700 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-900'}`}
                      >
                        {webhookInfo.has_custom_certificate ? 'Yes' : 'No'}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Pending Updates</label>
                      <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900">
                        {webhookInfo.pending_update_count ?? 0}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Max Connections</label>
                      <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900">
                        {webhookInfo.max_connections ?? 'Default'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Allowed Updates</label>
                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
                      {webhookInfo.allowed_updates?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {webhookInfo.allowed_updates.map((u) => (
                            <span
                              key={u}
                              className="rounded bg-blue-100 px-2 py-1 text-xs dark:bg-blue-900/30"
                            >
                              {u}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">All updates</span>
                      )}
                    </div>
                  </div>

                  {webhookInfo.last_error_message && (
                    <div>
                      <label className="mb-1 block text-sm font-medium">Last Error</label>
                      <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        {webhookInfo.last_error_message}
                        {webhookInfo.last_error_date && (
                          <div className="mt-1 text-xs">
                            {new Date(webhookInfo.last_error_date * 1000).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 border-t border-gray-300 pt-4 dark:border-gray-700">
                    <button
                      onClick={startEditing}
                      className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
                      Edit Webhook
                    </button>
                    <button
                      onClick={handleDeleteWebhook}
                      className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                    <button
                      onClick={loadWebhookInfo}
                      className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300 dark:bg-gray-700"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* EDIT MODE */}
          {isEditing && (
            <div className="space-y-4">
              <InputField
                label="Webhook URL (HTTPS only)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                regexPattern={/^https:\/\//}
                regexPatternMessage="URL must start with HTTPS"
                helperText="If empty, bot will be only used for logging"
                onValidate={(valid) => setUrlValid(valid)}
              />

              <InputField
                label="Max Connections (1-100)"
                type="number"
                min={1}
                max={100}
                value={maxConnections}
                onChange={(e) => setMaxConnections(e.target.value)}
                regexPattern={/^(?:[1-9][0-9]?|100)$/}
                regexPatternMessage="Must be between 1 and 100"
                onValidate={(valid) => setMaxConnValid(valid)}
              />

              <div>
                <label className="mb-1 block text-sm font-medium">Allowed Updates</label>
                <MultiSelect
                  options={UPDATE_TYPES}
                  selected={allowedUpdates}
                  onChange={setAllowedUpdates}
                />
              </div>

              <InputField
                label="Secret Token"
                value={secretToken}
                onChange={(e) => setSecretToken(e.target.value)}
                regexPattern={/^[A-Za-z0-9_-]{0,256}$/}
                regexPatternMessage="Only A-Z, a-z, 0-9, underscore and hyphen allowed"
                maxLength={256}
                onValidate={(valid) => setTokenValid(valid)}
              />

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dropPendingUpdates}
                    onChange={(e) => setDropPendingUpdates(e.target.checked)}
                  />
                  <span className="text-sm">Drop pending updates</span>
                </label>
              </div>

              <div className="flex gap-2 border-t border-gray-300 pt-4 dark:border-gray-700">
                <button
                  onClick={handleSetWebhook}
                  disabled={
                    (url && !urlValid) || !maxConnValid || (secretToken && !tokenValid) || loading
                  }
                  className="flex flex-1 items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:bg-gray-400"
                >
                  <CheckCircle size={18} />{' '}
                  {loading ? 'Saving...' : hasWebhook ? 'Update Webhook' : 'Set Webhook'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg bg-gray-300 px-4 py-2 dark:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
