import { useState, useEffect } from 'react';
import { Copy, Info, X } from 'lucide-react';
import { MessageWithGap } from '@/types';

interface MessageProps {
  message: MessageWithGap;
}

const IMPLEMENTED_MESSAGE_TYPES = new Set(['text']);

export function Message({ message }: MessageProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const isImplemented = IMPLEMENTED_MESSAGE_TYPES.has(message.message_type);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  if (message.isGap && message.gapCount) {
    return (
      <div className="my-2 flex justify-center">
        <div className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400">
          Missing {message.gapCount} message{message.gapCount > 1 && 's'}
        </div>
      </div>
    );
  }

  const isOutgoing = message.from?.is_bot || false;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const copyText = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
    }
    setContextMenu(null);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        className={`mb-2 flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
            isOutgoing
              ? 'rounded-br-none bg-blue-500 text-white'
              : 'rounded-bl-none border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
          }`}
        >
          {!isImplemented ? (
            <span className="text-sm font-medium text-red-500 dark:text-red-400">
              Not implemented: {message.message_type}
            </span>
          ) : (
            <>
              {message.from && !isOutgoing && (
                <div className="mb-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {message.from.first_name} {message.from.last_name || ''}
                </div>
              )}
              <div className="break-words whitespace-pre-wrap">{message.text}</div>
              <div
                className={`mt-1 text-xs ${
                  isOutgoing ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {formatTime(message.date)}
              </div>
            </>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-[150px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-800"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {isImplemented && (
            <button
              onClick={copyText}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Copy size={16} /> Copy
            </button>
          )}
          <button
            onClick={() => {
              setShowFullInfo(true);
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Info size={16} /> Show Full Info
          </button>
        </div>
      )}

      {showFullInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowFullInfo(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-4 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Message Info</h3>
              <button
                onClick={() => setShowFullInfo(false)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <pre className="overflow-auto rounded bg-gray-100 p-4 text-xs dark:bg-gray-900">
              {JSON.stringify(message, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
