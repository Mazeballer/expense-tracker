// A copy of the last data read from Supabase, kept on the device so the app still shows it when offline.
// Everything here fails quietly: if the browser blocks storage, the app just works without the offline copy.
const DB = 'wallet-wyse-offline'
const STORE = 'reads'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = work(tx.objectStore(STORE))
    tx.oncomplete = () => { db.close(); resolve(req.result) }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export const cacheGet = async <T>(key: string): Promise<T | undefined> => {
  try { return await withStore<T | undefined>('readonly', (s) => s.get(key)) } catch { return undefined }
}
export const cacheSet = async (key: string, value: unknown): Promise<void> => {
  try { await withStore('readwrite', (s) => s.put(value, key)) } catch { /* no offline copy */ }
}
export const cacheClear = async (): Promise<void> => {
  try { await withStore('readwrite', (s) => s.clear()) } catch { /* nothing to clear */ }
}
