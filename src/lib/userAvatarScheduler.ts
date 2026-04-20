import { apiClient } from './api';

interface QueueItem {
  userId: number;
  priority: number;
  callbacks: Array<(url: string | null) => void>;
}

class UserAvatarScheduler {
  private queue: QueueItem[] = [];
  private inFlight = new Set<number>();
  private urlCache = new Map<number, string | null>();
  private maxConcurrent = 2;
  private requestDelay = 200;
  private lastRequestTime = 0;

  async getAvatar(userId: number, priority = 0): Promise<string | null> {
    if (this.urlCache.has(userId)) {
      return this.urlCache.get(userId)!;
    }

    return new Promise<string | null>((resolve) => {
      const existing = this.queue.find((q) => q.userId === userId);
      if (existing) {
        existing.callbacks.push(resolve);
        if (priority > existing.priority) {
          existing.priority = priority;
          this.sortQueue();
        }
        return;
      }

      if (this.inFlight.has(userId)) {
        this.queue.push({ userId, priority, callbacks: [resolve] });
        return;
      }

      this.queue.push({ userId, priority, callbacks: [resolve] });
      this.sortQueue();
      this.scheduleProcess();
    });
  }

  // Mark as null without fetching (e.g., for bots or known non-photo users)
  setNull(userId: number) {
    this.urlCache.set(userId, null);
  }

  private sortQueue() {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  private scheduleProcess() {
    if (this.inFlight.size >= this.maxConcurrent) return;
    const now = Date.now();
    const delay = Math.max(0, this.requestDelay - (now - this.lastRequestTime));
    setTimeout(() => this.processQueue(), delay);
  }

  private processQueue() {
    while (this.inFlight.size < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift()!;
      if (this.inFlight.has(item.userId)) continue;
      this.lastRequestTime = Date.now();
      this.inFlight.add(item.userId);
      this.fetchAvatar(item);
    }
  }

  private async fetchAvatar(item: QueueItem) {
    try {
      const blob = await apiClient.getUserAvatar(item.userId);
      const url = blob ? URL.createObjectURL(blob) : null;
      this.urlCache.set(item.userId, url);

      item.callbacks.forEach((cb) => cb(url));

      // Drain any duplicate queue entries
      const dupes = this.queue.filter((q) => q.userId === item.userId);
      dupes.forEach((dupe) => {
        dupe.callbacks.forEach((cb) => cb(url));
        const idx = this.queue.indexOf(dupe);
        if (idx !== -1) this.queue.splice(idx, 1);
      });
    } catch {
      this.urlCache.set(item.userId, null);
      item.callbacks.forEach((cb) => cb(null));
    } finally {
      this.inFlight.delete(item.userId);
      setTimeout(() => this.processQueue(), this.requestDelay);
    }
  }
}

export const userAvatarScheduler = new UserAvatarScheduler();

// React hook
import { useState, useEffect, useRef } from 'react';

export function useUserAvatar(
  userId: number | undefined,
  priority = 0,
): { url: string | null; loading: boolean } {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    cancelledRef.current = false;
    setLoading(true);

    const cached = userAvatarScheduler['urlCache'].get(userId);
    if (cached !== undefined) {
      setUrl(cached);
      setLoading(false);
      return;
    }

    userAvatarScheduler.getAvatar(userId, priority).then((result) => {
      if (!cancelledRef.current) {
        setUrl(result);
        setLoading(false);
      }
    });

    return () => {
      cancelledRef.current = true;
    };
  }, [userId, priority]);

  return { url, loading };
}
