import { BiliVideo, BiliFollowing } from '../types';

export class StorageService {
  private dbName = 'BiliSmartManager';
  private version = 1;
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'bvid' });
        }
        if (!db.objectStoreNames.contains('followings')) {
          db.createObjectStore('followings', { keyPath: 'mid' });
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject(new Error('无法打开数据库'));
      };
    });
  }

  private async transaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveBookmarks(videos: Partial<BiliVideo>[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bookmarks', 'readwrite');
      const store = tx.objectStore('bookmarks');

      for (const video of videos) {
        store.put(video);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getBookmarks(): Promise<BiliVideo[]> {
    return this.transaction('bookmarks', 'readonly', (store) => store.getAll());
  }

  async getBookmarksByCategory(category: string): Promise<BiliVideo[]> {
    const all = await this.getBookmarks();
    return all.filter(v => (v as any).category === category);
  }

  async saveFollowings(followings: Partial<BiliFollowing>[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('followings', 'readwrite');
      const store = tx.objectStore('followings');

      for (const following of followings) {
        store.put(following);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getFollowings(): Promise<BiliFollowing[]> {
    return this.transaction('followings', 'readonly', (store) => store.getAll());
  }

  async saveCategories(categories: Record<string, string[]>): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('categories', 'readwrite');
      const store = tx.objectStore('categories');

      for (const [name, videos] of Object.entries(categories)) {
        store.put({ name, videos });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCategories(): Promise<Record<string, string[]>> {
    const results = await this.transaction<Array<{ name: string; videos: string[] }>>(
      'categories',
      'readonly',
      (store) => store.getAll()
    );

    const categories: Record<string, string[]> = {};
    for (const item of results) {
      categories[item.name] = item.videos;
    }
    return categories;
  }

  async saveSetting(key: string, value: any): Promise<void> {
    await this.transaction('settings', 'readwrite', (store) =>
      store.put({ key, value })
    );
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const result = await this.transaction<{ key: string; value: T } | undefined>(
      'settings',
      'readonly',
      (store) => store.get(key)
    );
    return result?.value ?? defaultValue;
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    const storeNames = ['bookmarks', 'followings', 'categories', 'settings'];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');

      for (const name of storeNames) {
        tx.objectStore(name).clear();
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async exportData(): Promise<string> {
    const bookmarks = await this.getBookmarks();
    const followings = await this.getFollowings();
    const categories = await this.getCategories();

    return JSON.stringify({
      exportDate: new Date().toISOString(),
      bookmarks,
      followings,
      categories,
    }, null, 2);
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);

    if (data.bookmarks) {
      await this.saveBookmarks(data.bookmarks);
    }
    if (data.followings) {
      await this.saveFollowings(data.followings);
    }
    if (data.categories) {
      await this.saveCategories(data.categories);
    }
  }
}
