import { apiClient } from './api';

interface FileQueueItem {
  fileUniqueId: string;
  priority: number;
  callbacks: Array<(url: string | null) => void>;
}

class FileLoader {
  private queue: FileQueueItem[] = [];
  private inFlight = new Set<string>();
  private urlCache = new Map<string, string | null>();
  private maxConcurrent = 2;
  private requestDelay = 1000;

  async loadFile(fileUniqueId: string, priority = 0): Promise<string | null> {
    if (this.urlCache.has(fileUniqueId)) {
      return this.urlCache.get(fileUniqueId)!;
    }

    return new Promise<string | null>((resolve) => {
      const existing = this.queue.find(q => q.fileUniqueId === fileUniqueId);
      if (existing) {
        existing.callbacks.push(resolve);
        if (priority > existing.priority) {
          existing.priority = priority;
          this.sortQueue();
        }
        return;
      }

      if (this.inFlight.has(fileUniqueId)) {
        // Add a dummy queue item to collect the callback
        this.queue.push({ fileUniqueId, priority, callbacks: [resolve] });
        return;
      }

      this.queue.push({ fileUniqueId, priority, callbacks: [resolve] });
      this.sortQueue();
      this.scheduleProcess();
    });
  }

  private sortQueue() {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  private scheduleProcess() {
    if (this.inFlight.size >= this.maxConcurrent) return;
    setTimeout(() => this.processQueue(), 0);
  }

  private processQueue() {
    while (this.inFlight.size < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift()!;
      if (this.inFlight.has(item.fileUniqueId)) continue;
      this.inFlight.add(item.fileUniqueId);
      this.fetchFile(item);
    }
  }

  private async fetchFile(item: FileQueueItem) {
    try {
      const blob = await apiClient.getFile(item.fileUniqueId);
      const url = blob ? URL.createObjectURL(blob) : null;
      this.urlCache.set(item.fileUniqueId, url);
      item.callbacks.forEach(cb => cb(url));

      // Also resolve any other queued callbacks for same file
      const dupes = this.queue.filter(q => q.fileUniqueId === item.fileUniqueId);
      dupes.forEach(dupe => {
        dupe.callbacks.forEach(cb => cb(url));
        const idx = this.queue.indexOf(dupe);
        if (idx !== -1) this.queue.splice(idx, 1);
      });
    } catch {
      this.urlCache.set(item.fileUniqueId, null);
      item.callbacks.forEach(cb => cb(null));
    } finally {
      this.inFlight.delete(item.fileUniqueId);
      setTimeout(() => this.processQueue(), this.requestDelay);
    }
  }
}

export const fileLoader = new FileLoader();

// React hook for loading files
import { useState, useEffect, useRef } from 'react';

export function useFileUrl(fileUniqueId: string | undefined, priority = 0): { url: string | null; loading: boolean } {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!fileUniqueId);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!fileUniqueId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    cancelledRef.current = false;
    setLoading(true);

    // Check cache first synchronously
    const cached = fileLoader['urlCache'].get(fileUniqueId);
    if (cached !== undefined) {
      setUrl(cached);
      setLoading(false);
      return;
    }

    fileLoader.loadFile(fileUniqueId, priority).then(result => {
      if (!cancelledRef.current) {
        setUrl(result);
        setLoading(false);
      }
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [fileUniqueId, priority]);

  return { url, loading };
}
