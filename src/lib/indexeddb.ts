import { Chat, Message } from '@/types';

const DB_NAME = 'teleeye_cache';
const DB_VERSION = 1;

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
          const msgStore = db.createObjectStore('messages', { keyPath: 'key' });
          msgStore.createIndex('chat_id', 'chat_id', { unique: false });
        }
        if (!db.objectStoreNames.contains('avatars')) {
          db.createObjectStore('avatars', { keyPath: 'id' });
        }
      };
    });
  }

  setChats(chats: Chat[]): void {
    if (!this.db) return;
    const tx = this.db.transaction('chats', 'readwrite');
    const store = tx.objectStore('chats');

    for (const chat of chats) {
      store.put(chat);
    }
  }

  async getChats(): Promise<Chat[]> {
    if (!this.db) return [];
    const tx = this.db.transaction('chats', 'readonly');
    const store = tx.objectStore('chats');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  setMessages(chatId: number, messages: Message[]): void {
    if (!this.db || !messages) return;

    const tx = this.db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');

    for (const msg of messages) {
      store.put({
        key: `${chatId}_${msg.message_id}`,
        chat_id: chatId,
        ...msg,
      });
    }
  }

  async getMessages(chatId: number): Promise<Message[]> {
    if (!this.db) return [];

    const tx = this.db.transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    const index = store.index('chat_id');

    return new Promise((resolve) => {
      const request = index.getAll(chatId);
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => resolve([]);
    });
  }

  async trimMessages(chatId: number): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    const index = store.index('chat_id');

    const messages: (Message & { key: string })[] = await new Promise((resolve) => {
      const req = index.getAll(chatId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (messages.length <= 10) return;

    messages.sort((a, b) => a.message_id - b.message_id);
    const toDelete = messages.slice(0, messages.length - 10);

    for (const msg of toDelete) {
      store.delete(msg.key);
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  setAvatar(id: number, blob: Blob | null): void {
    if (!this.db) return;

    const tx = this.db.transaction('avatars', 'readwrite');
    const store = tx.objectStore('avatars');

    store.put({ id, blob });
  }

  async getAvatar(id: number): Promise<string | null | undefined> {
    if (!this.db) return undefined;

    const tx = this.db.transaction('avatars', 'readonly');
    const store = tx.objectStore('avatars');

    return new Promise((resolve) => {
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result;

        if (!record) {
          resolve(undefined);
        } else if (record.blob === null) {
          resolve(null);
        } else {
          resolve(URL.createObjectURL(record.blob));
        }
      };

      request.onerror = () => resolve(undefined);
    });
  }

  clear(): void {
    if (!this.db) return;

    const stores = ['chats', 'messages', 'avatars'];
    const tx = this.db.transaction(stores, 'readwrite');

    for (const storeName of stores) {
      tx.objectStore(storeName).clear();
    }
  }
}

export const dbCache = new IndexedDBCache();
