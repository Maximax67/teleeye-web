interface SettingsTabsProps {
  activeTab: 'profile' | 'bots' | 'sessions';
  onTabChange: (tab: 'profile' | 'bots' | 'sessions') => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const tabs: Array<'profile' | 'bots' | 'sessions'> = ['profile', 'bots', 'sessions'];

  return (
    <div className="flex border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab
              ? 'border-b-2 border-blue-600 bg-white text-blue-600 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}
