/**
 * A minimal promise-based key/value store on IndexedDB.
 *
 * Projects carry uploaded images as base64 data URLs, which routinely run to
 * several megabytes. localStorage caps out around 5MB for the whole origin,
 * so a single photo import filled it and every subsequent write failed —
 * silently, because the failure was swallowed by a `console.error`.
 *
 * IndexedDB has no such practical ceiling and stores values structurally,
 * so there is no JSON round-trip on every save either.
 *
 * Deliberately dependency-free: one object store, four operations.
 */

const DB_NAME = 'logo_studio';
const DB_VERSION = 1;
const STORE = 'keyval';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open the local database'));
    request.onblocked = () => reject(new Error('The local database is blocked by another tab'));
  });

  // A failed open must not be cached, or every later call inherits the failure.
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = operation(transaction.objectStore(STORE));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Local database request failed'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('Local database transaction aborted'));
      })
  );
}

export function idbGet<T>(key: string): Promise<T | undefined> {
  return runTransaction<T | undefined>('readonly', (store) => store.get(key));
}

export function idbSet(key: string, value: unknown): Promise<void> {
  return runTransaction('readwrite', (store) => store.put(value, key)).then(() => undefined);
}

export function idbDelete(key: string): Promise<void> {
  return runTransaction('readwrite', (store) => store.delete(key)).then(() => undefined);
}

/** True when the browser exposes a usable IndexedDB. */
export function isIdbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    // Some privacy modes throw on the property access itself.
    return false;
  }
}
