import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Bot, Session } from '@/types';
import { useRouter } from 'next/navigation';
import { SettingsTabs } from './SettingsTabs';
import { ProfileTab } from './tabs/ProfileTab';
import { BotsTab } from './tabs/BotsTab';
import { SessionsTab } from './tabs/SessionsTab';
import { WebhookSettings } from './WebhookSettings';

interface SettingsMenuProps {
  onClose: () => void;
}

export function SettingsMenu({ onClose }: SettingsMenuProps) {
  const { user, logout, logoutAll } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'bots' | 'sessions'>('profile');
  const [bots, setBots] = useState<Bot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedBotForWebhook, setSelectedBotForWebhook] = useState<Bot | null>(null);

  const loadBots = useCallback(async () => {
    try {
      const data = await apiClient.getBots();
      setBots(data.bots || []);
    } catch (error) {
      console.error('Failed to load bots:', error);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const data = await apiClient.getSessions();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'bots') {
      queueMicrotask(loadBots);
      return;
    }

    if (activeTab === 'sessions') {
      queueMicrotask(loadSessions);
    }
  }, [activeTab, loadBots, loadSessions]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/login');
      onClose();
    }
  };

  const handleTerminateSessions = async () => {
    if (confirm('Are you sure you want to terminate all sessions?')) {
      await logoutAll();
      router.push('/login');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'profile' && (
            <ProfileTab user={user} onLogout={handleLogout} onClose={onClose} router={router} />
          )}

          {activeTab === 'bots' && (
            <BotsTab
              bots={bots}
              onLoadBots={loadBots}
              onSelectBotForWebhook={setSelectedBotForWebhook}
              user={user}
            />
          )}

          {activeTab === 'sessions' && (
            <SessionsTab
              sessions={sessions}
              onLoadSessions={loadSessions}
              onTerminateAll={handleTerminateSessions}
            />
          )}

          {selectedBotForWebhook && (
            <WebhookSettings
              botId={selectedBotForWebhook.id}
              botName={`${selectedBotForWebhook.first_name} (@${selectedBotForWebhook.username})`}
              onClose={() => setSelectedBotForWebhook(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
