import type { IDBPDatabase } from "idb";

/**
 * Generic keyed storage adapter. Backed by IndexedDB today; can be swapped
 * (e.g. Supabase) later without touching call sites.
 */
export interface StorageAdapter {
  get<T>(store: string, id: string): Promise<T | undefined>;
  set<T>(store: string, id: string, value: T): Promise<void>;
  getAll<T>(store: string): Promise<T[]>;
  delete(store: string, id: string): Promise<void>;
  clear(store: string): Promise<void>;
}

export const STORES = {
  useCases: "useCases",
  settings: "settings",
} as const;

const DB_NAME = "ai-cost-canvas";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

async function getDB(): Promise<IDBPDatabase> {
  if (!isBrowser()) {
    throw new Error("IndexedDB is not available in this environment (SSR).");
  }
  if (!dbPromise) {
    const { openDB } = await import("idb");
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.useCases)) {
          db.createObjectStore(STORES.useCases, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings);
        }
      },
    });
  }
  return dbPromise;
}

class IndexedDBAdapter implements StorageAdapter {
  async get<T>(store: string, id: string): Promise<T | undefined> {
    const db = await getDB();
    return (await db.get(store, id)) as T | undefined;
  }
  async set<T>(store: string, id: string, value: T): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(store, "readwrite");
    const s = tx.objectStore(store);
    if (s.keyPath) {
      await s.put(value as never);
    } else {
      await s.put(value as never, id);
    }
    await tx.done;
  }
  async getAll<T>(store: string): Promise<T[]> {
    const db = await getDB();
    return (await db.getAll(store)) as T[];
  }
  async delete(store: string, id: string): Promise<void> {
    const db = await getDB();
    await db.delete(store, id);
  }
  async clear(store: string): Promise<void> {
    const db = await getDB();
    await db.clear(store);
  }
}

export const storage: StorageAdapter = new IndexedDBAdapter();
