import type { Chat, Message } from '@/types';

const DB_NAME = 'teleeye_cache';
const DB_VERSION = 1;

interface StoredMessage extends Message {
  _key: string;
  _chat_id: number;
}

interface StoredAvatar {
  id: number;
  blob: Blob | null;
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('chats')) {
          db.createObjectStore('chats', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const store = db.createObjectStore('messages', { keyPath: '_key' });
          store.createIndex('_chat_id', '_chat_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('avatars')) {
          db.createObjectStore('avatars', { keyPath: 'id' });
        }
      };
    });
  }

  // ── Chats ────────────────────────────────────────────────────────────────

  setChats(chats: Chat[]): void {
    const db = this.db;
    if (!db) return;
    const tx = db.transaction('chats', 'readwrite');
    const store = tx.objectStore('chats');
    for (const chat of chats) store.put(chat);
  }

  async getChats(): Promise<Chat[]> {
    const db = this.db;
    if (!db) return [];
    return new Promise((resolve) => {
      const request = db.transaction('chats', 'readonly').objectStore('chats').getAll();
      request.onsuccess = () => resolve((request.result as Chat[]) ?? []);
      request.onerror = () => resolve([]);
    });
  }

  // ── Messages ─────────────────────────────────────────────────────────────

  /** Merges new messages into the cache (upsert by message_id). */
  async setMessages(chatId: number, messages: Message[]): Promise<void> {
    const db = this.db;
    if (!db || !messages.length) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');

      for (const msg of messages) {
        const record: StoredMessage = {
          ...msg,
          _key: `${chatId}_${msg.message_id}`,
          _chat_id: chatId,
        };
        store.put(record);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMessages(chatId: number): Promise<Message[]> {
    const db = this.db;
    if (!db) return [];

    return new Promise((resolve) => {
      const store = db.transaction('messages', 'readonly').objectStore('messages');
      const index = store.index('_chat_id');
      const request = index.getAll(chatId);

      request.onsuccess = () => {
        const rows = (request.result as StoredMessage[]) ?? [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const messages: Message[] = rows.map(({ _key: _k, _chat_id: _c, ...rest }) => rest);
        resolve(messages);
      };
      request.onerror = () => resolve([]);
    });
  }

  /** Keep only the latest N messages for a chat to bound memory usage. */
  async trimMessages(chatId: number, keepLast = 10): Promise<void> {
    const db = this.db;
    if (!db) return;

    const messages = await this.getMessages(chatId);
    if (messages.length <= keepLast) return;

    const sorted = [...messages].sort((a, b) => a.message_id - b.message_id);
    const toDelete = sorted.slice(0, sorted.length - keepLast);

    return new Promise((resolve) => {
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');

      for (const msg of toDelete) {
        store.delete(`${chatId}_${msg.message_id}`);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  // ── Avatars ───────────────────────────────────────────────────────────────

  setAvatar(id: number, blob: Blob | null): void {
    const db = this.db;
    if (!db) return;
    const record: StoredAvatar = { id, blob };
    db.transaction('avatars', 'readwrite').objectStore('avatars').put(record);
  }

  async getAvatar(id: number): Promise<string | null | undefined> {
    const db = this.db;
    if (!db) return undefined;

    return new Promise((resolve) => {
      const request = db
        .transaction('avatars', 'readonly')
        .objectStore('avatars')
        .get(id);

      request.onsuccess = () => {
        const record = request.result as StoredAvatar | undefined;
        if (!record) return resolve(undefined);
        if (record.blob === null) return resolve(null);
        resolve(URL.createObjectURL(record.blob));
      };
      request.onerror = () => resolve(undefined);
    });
  }

  // ── Clear ─────────────────────────────────────────────────────────────────

  clear(): void {
    const db = this.db;
    if (!db) return;
    const tx = db.transaction(['chats', 'messages', 'avatars'], 'readwrite');
    for (const name of ['chats', 'messages', 'avatars']) {
      tx.objectStore(name).clear();
    }
  }
}

export const dbCache = new IndexedDBCache();
