import { useState } from 'react';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Bot, User } from '@/types';
import InputField from '@/components/ui/InputField';
import { BOT_TOKEN_REGEX } from '@/constants';

interface BotsTabProps {
  bots: Bot[];
  onLoadBots: () => Promise<void>;
  onSelectBotForWebhook: (bot: Bot) => void;
  user: User | null;
}

export function BotsTab({ bots, onLoadBots, onSelectBotForWebhook, user }: BotsTabProps) {
  const [newBotToken, setNewBotToken] = useState('');
  const [botTokenValid, setBotTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const addBot = async () => {
    if (!newBotToken.trim() || loading || !botTokenValid) return;

    setLoading(true);
    try {
      await apiClient.addBot(newBotToken);
      setNewBotToken('');
      await onLoadBots();
    } catch (error) {
      console.error(error);
      alert('Failed to add bot');
    } finally {
      setLoading(false);
    }
  };

  const deleteBot = async (botId: number) => {
    if (!confirm('Delete this bot?')) return;

    try {
      await apiClient.deleteBot(botId);
      await onLoadBots();
    } catch (error) {
      console.error(error);
      alert('Failed to delete bot');
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <div className="flex-1">
          <InputField
            value={newBotToken}
            onChange={(e) => setNewBotToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addBot()}
            onValidate={(valid) => setBotTokenValid(valid)}
            regexPattern={BOT_TOKEN_REGEX}
            placeholder="Bot token"
            hideErrorMessage
          />
        </div>
        <button
          onClick={addBot}
          disabled={loading || !newBotToken.trim() || !botTokenValid}
          className="mb-3 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-400"
        >
          <Plus size={20} /> Add
        </button>
      </div>

      <div className="space-y-2">
        {bots.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">No bots added yet</div>
        ) : (
          bots.map((bot) => (
            <div
              key={bot.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {bot.first_name} {bot.last_name || ''}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">@{bot.username}</div>
                {bot.role && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    Role: {bot.role}
                  </div>
                )}
              </div>
              <div className="ml-2 flex gap-2">
                {(bot.role === 'owner' || user?.role === 'admin' || user?.role === 'god') && (
                  <button
                    onClick={() => onSelectBotForWebhook(bot)}
                    className="rounded p-2 text-blue-500 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Webhook settings"
                  >
                    <Settings size={20} />
                  </button>
                )}
                <button
                  onClick={() => deleteBot(bot.id)}
                  className="rounded p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
