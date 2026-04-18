import { apiClient } from './api';
import { dbCache } from './indexeddb';

interface QueueItem {
  chatId: number;
  priority: number;
  callbacks: Array<(url: string | null) => void>;
}

class AvatarScheduler {
  private queue: QueueItem[] = [];
  private inFlight = new Set<number>();
  private urlCache = new Map<number, string | null>();
  private maxConcurrent = 2;
  private requestDelay = 150; // ms between requests
  private lastRequestTime = 0;

  async getAvatar(chatId: number, priority = 0): Promise<string | null> {
    // In-memory cache hit
    if (this.urlCache.has(chatId)) {
      return this.urlCache.get(chatId)!;
    }

    // IndexedDB cache hit
    try {
      const cached = await dbCache.getAvatar(chatId);
      if (cached !== undefined) {
        this.urlCache.set(chatId, cached);
        return cached;
      }
    } catch {
      // ignore cache errors
    }

    return new Promise<string | null>((resolve) => {
      // Already being fetched — just subscribe
      const existing = this.queue.find(q => q.chatId === chatId);
      if (existing) {
        existing.callbacks.push(resolve);
        if (priority > existing.priority) {
          existing.priority = priority;
          this.sortQueue();
        }
        return;
      }

      this.queue.push({ chatId, priority, callbacks: [resolve] });
      this.sortQueue();
      this.scheduleProcess();
    });
  }

  updatePriority(chatId: number, priority: number) {
    const item = this.queue.find(q => q.chatId === chatId);
    if (item && priority > item.priority) {
      item.priority = priority;
      this.sortQueue();
    }
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
      if (this.inFlight.has(item.chatId)) {
        // Merge callbacks into the in-flight tracking
        continue;
      }
      this.lastRequestTime = Date.now();
      this.inFlight.add(item.chatId);
      this.fetchAvatar(item);
    }
  }

  private async fetchAvatar(item: QueueItem) {
    try {
      const blob = await apiClient.getChatAvatar(item.chatId);
      dbCache.setAvatar(item.chatId, blob);
      const url = blob ? URL.createObjectURL(blob) : null;
      this.urlCache.set(item.chatId, url);
      item.callbacks.forEach(cb => cb(url));
    } catch {
      this.urlCache.set(item.chatId, null);
      item.callbacks.forEach(cb => cb(null));
    } finally {
      this.inFlight.delete(item.chatId);
      setTimeout(() => this.processQueue(), this.requestDelay);
    }
  }
}

export const avatarScheduler = new AvatarScheduler();
