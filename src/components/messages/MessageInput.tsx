import { Send } from 'lucide-react';

export const MessageInput = () => (
  <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 rounded-full border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        disabled
      />
      <button
        className="rounded-full bg-blue-500 p-3 text-white hover:bg-blue-600 disabled:opacity-50"
        disabled
      >
        <Send size={20} />
      </button>
    </div>
  </div>
);
