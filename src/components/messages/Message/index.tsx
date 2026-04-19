'use client';

import { useEffect, useState } from 'react';
import type { Message as MessageType } from '@/types';
import { MessageContent } from './MessageContent';
import { MessageFooter, SenderName, ServiceMessage } from './MessageParts';
import { ReplyQuote, ForwardHeader } from './reply/ReplyQuote';
import { ContextMenu } from './ContextMenu';
import { getForwardLabel, isServiceMessage } from './messageHelpers';
import { StickerMessage } from './media/StickerMessage';
import { FullInfoModal } from './FullInfoModal';

interface MessageProps {
  message: MessageType;
}

const isMediaBubble = (msg: MessageType) => !!(msg.photo?.length || msg.video || msg.animation);

export function Message({ message }: MessageProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handle = () => setContextMenu(null);
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [contextMenu]);

  // ── Service messages ───────────────────────────────────────────────────────
  if (isServiceMessage(message)) {
    return <ServiceMessage message={message} />;
  }

  const isOutgoing = message.from?.is_bot ?? false;
  const isSticker = message.message_type === 'sticker' && !!message.sticker;
  const isMedia = isMediaBubble(message);
  const forwardLabel = getForwardLabel(message);
  const hasReply = !!message.reply_to_message;
  const hasText = !!(message.text || message.caption);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCopy = () => {
    const text = message.text ?? message.caption ?? '';
    if (text) void navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  // ── Sticker — no bubble ────────────────────────────────────────────────────
  if (isSticker && message.sticker) {
    return (
      <>
        <div
          className={`mb-1 flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
          onContextMenu={handleContextMenu}
        >
          <StickerMessage sticker={message.sticker} />
        </div>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            hasText={false}
            onInfo={() => {
              setShowInfo(true);
              setContextMenu(null);
            }}
          />
        )}
        {showInfo && <FullInfoModal message={message} onClose={() => setShowInfo(false)} />}
      </>
    );
  }

  // ── Bubble styles ──────────────────────────────────────────────────────────
  const bubbleCls = isOutgoing
    ? 'bg-blue-500 text-white rounded-2xl rounded-br-sm'
    : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-700';

  const maxWidthCls = isMedia ? 'max-w-[280px] sm:max-w-[320px]' : 'max-w-[72%] sm:max-w-[60%]';

  // ── Shared inner content ───────────────────────────────────────────────────
  const inner = (
    <>
      {forwardLabel && <ForwardHeader forwardLabel={forwardLabel} isOutgoing={isOutgoing} />}
      {hasReply && message.reply_to_message && (
        <ReplyQuote replyMessage={message.reply_to_message} isOutgoing={isOutgoing} />
      )}
      {!isOutgoing && message.from && <SenderName user={message.from} />}
      <MessageContent message={message} isOutgoing={isOutgoing} />
      <MessageFooter message={message} isOutgoing={isOutgoing} />
    </>
  );

  return (
    <>
      <div
        className={`mb-1 flex ${isOutgoing ? 'justify-end' : 'justify-start'} items-end gap-2`}
        onContextMenu={handleContextMenu}
      >
        {/* Sender mini-avatar for group messages */}
        {!isOutgoing && message.from && (
          <div
            className="mb-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full"
            title={`${message.from.first_name} ${message.from.last_name ?? ''}`}
          >
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-400 to-purple-500 text-[10px] font-bold text-white">
              {message.from.first_name[0]}
            </div>
          </div>
        )}

        <div className={`${maxWidthCls} flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
          <div
            className={`${bubbleCls} max-w-full shadow-[0_1px_2px_rgba(0,0,0,0.08)] ${
              isMedia ? 'overflow-hidden p-0' : 'px-3 py-2'
            }`}
          >
            {isMedia ? (
              <div className="p-1">
                {forwardLabel && (
                  <div className="px-2 pt-1">
                    <ForwardHeader forwardLabel={forwardLabel} isOutgoing={isOutgoing} />
                  </div>
                )}
                {hasReply && message.reply_to_message && (
                  <div className="px-2 pt-1">
                    <ReplyQuote replyMessage={message.reply_to_message} isOutgoing={isOutgoing} />
                  </div>
                )}
                {!isOutgoing && message.from && (
                  <div className="px-2 pt-1">
                    <SenderName user={message.from} />
                  </div>
                )}
                <div className="px-1">
                  <MessageContent message={message} isOutgoing={isOutgoing} />
                </div>
                <div className="px-2 pb-1">
                  <MessageFooter message={message} isOutgoing={isOutgoing} />
                </div>
              </div>
            ) : (
              inner
            )}
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasText={hasText}
          onCopy={handleCopy}
          onInfo={() => {
            setShowInfo(true);
            setContextMenu(null);
          }}
        />
      )}
      {showInfo && <FullInfoModal message={message} onClose={() => setShowInfo(false)} />}
    </>
  );
}
