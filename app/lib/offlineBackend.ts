import type { Backend } from './backend'
import { cacheGet, cacheSet } from './offlineCache'

// Reads go to the network first and are copied to the device. With no network, the last copy is shown instead.
// Writes are untouched: they fail while offline, and the app already tells the person that.
const READS = [
  'listExpenses', 'monthTotals', 'planItems', 'listBudgets', 'getSettings', 'listCategories',
  'listPaymentMethods', 'listAccounts', 'listTransactions', 'listValuations',
] as const

export function withOfflineCopy(backend: Backend, who: () => string | null): Backend {
  const wrapped: Backend = { ...backend }
  for (const name of READS) {
    const read = backend[name] as (...args: unknown[]) => Promise<unknown>
    ;(wrapped as unknown as Record<string, unknown>)[name] = async (...args: unknown[]) => {
      const key = `${who() ?? 'anon'}:${name}:${JSON.stringify(args)}`
      const offline = typeof navigator !== 'undefined' && !navigator.onLine
      if (offline) {
        const saved = await cacheGet(key)
        if (saved !== undefined) return saved
      }
      try {
        const fresh = await read.apply(backend, args)
        void cacheSet(key, fresh)
        return fresh
      } catch (error) {
        const saved = await cacheGet(key)
        if (saved !== undefined) return saved
        throw error
      }
    }
  }
  return wrapped
}
