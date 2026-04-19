'use client';

import { Download } from 'lucide-react';
import type { DocumentInfo } from '@/types';
import { formatBytes, getMimeIcon } from '@/lib/utils';
import { useFileUrl } from '@/lib/fileLoader';

interface MediaFileProps {
  document: DocumentInfo;
  isOutgoing: boolean;
}

export function MediaFile({ document: doc, isOutgoing }: MediaFileProps) {
  const { url, loading } = useFileUrl(doc.file_unique_id, 0);
  const icon = getMimeIcon(doc.mime_type);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${
          isOutgoing ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-900/30'
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.file_name ?? 'File'}</p>
        <p
          className={`text-xs ${isOutgoing ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}
        >
          {doc.mime_type?.split('/')[1]?.toUpperCase() ?? 'File'}
          {doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ''}
        </p>
      </div>

      {url && (
        <a
          href={url}
          download={doc.file_name}
          className={`shrink-0 rounded-full p-1.5 transition-colors ${
            isOutgoing ? 'hover:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Download size={16} />
        </a>
      )}

      {loading && (
        <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" />
      )}
    </div>
  );
}
