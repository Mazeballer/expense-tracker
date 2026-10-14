import type { Backend } from '../backend'
import { addMonths, monthEnd, monthOf, klDate } from '../date'
import { createSeed, newId, type MockState } from './seed'

const LATENCY_MS = 60

export const mockControls = {
  latency: LATENCY_MS,
  failing: false,
}

if (import.meta.client) {
  ;(window as unknown as { __mock: typeof mockControls }).__mock = mockControls
}

let state: MockState | null = null
const db = () => (state ??= createSeed())

async function run<T>(work: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, mockControls.latency))
  if (mockControls.failing) throw new Error('Mock backend is set to fail')
  return structuredClone(work())
}

function find<T extends { id: string }>(list: T[], id: string): T {
  const row = list.find((r) => r.id === id)
  if (!row) throw new Error('Not found')
  return row
}

export const mockBackend: Backend = {
  listExpenses: (f) => run(() => {
    const q = f.search?.trim().toLowerCase()
    return db().expenses
      .filter((e) => (!f.month || monthOf(klDate(e.spentAt)) === f.month)
        && (!f.categoryId || e.categoryId === f.categoryId)
        && (!f.paymentMethodId || e.paymentMethodId === f.paymentMethodId)
        && (!q || e.description.toLowerCase().includes(q)))
      .sort((a, b) => b.spentAt.localeCompare(a.spentAt))
  }),
  addExpense: (input) => run(() => {
    const row = { ...input, id: newId('exp'), source: input.source ?? 'app' }
    db().expenses.push(row)
    return row
  }),
  updateExpense: (id, input) => run(() => Object.assign(find(db().expenses, id), input)),
  removeExpense: (id) => run(() => {
    find(db().expenses, id)
    db().expenses = db().expenses.filter((e) => e.id !== id)
  }),
  monthTotals: (from, to) => run(() => {
    const buckets = new Map<string, { month: string; categoryId: string; total: number; count: number }>()
    for (const e of db().expenses) {
      const month = monthOf(klDate(e.spentAt))
      if (month < from || month > to) continue
      const key = `${month}|${e.categoryId}`
      const b = buckets.get(key) ?? { month, categoryId: e.categoryId, total: 0, count: 0 }
      b.total = Math.round((b.total + e.amount) * 100) / 100
      b.count += 1
      buckets.set(key, b)
    }
    return [...buckets.values()]
  }),

  planItems: () => run(() => [...db().planItems].sort((a, b) => a.sort - b.sort)),
  changePlanItem: (groupKey, newAmount, fromMonth) => run(() => {
    const current = db().planItems.find((i) => i.groupKey === groupKey && i.effectiveTo === null)
    if (!current) throw new Error('Not found')
    if (current.effectiveFrom >= fromMonth) {
      current.amount = newAmount
      return
    }
    current.effectiveTo = monthEnd(addMonths(fromMonth, -1))
    db().planItems.push({ ...current, id: newId('plan'), amount: newAmount, effectiveFrom: fromMonth, effectiveTo: null })
  }),
  renamePlanItem: (groupKey, label) => run(() => {
    db().planItems.filter((i) => i.groupKey === groupKey).forEach((i) => { i.label = label })
  }),
  addPlanItem: (input) => run(() => {
    const row = {
      ...input, id: newId('plan'), groupKey: newId('group'), effectiveTo: null,
      sort: Math.max(0, ...db().planItems.map((i) => i.sort)) + 1,
    }
    db().planItems.push(row)
    return row
  }),
  endPlanItem: (groupKey, fromMonth) => run(() => {
    const current = db().planItems.find((i) => i.groupKey === groupKey && i.effectiveTo === null)
    if (!current) throw new Error('Not found')
    current.effectiveTo = monthEnd(addMonths(fromMonth, -1))
  }),

  listBudgets: () => run(() => db().budgets),
  setBudget: (input) => run(() => {
    const existing = db().budgets.find((b) => b.categoryId === input.categoryId)
    if (existing) return Object.assign(existing, { amount: input.amount })
    const row = { id: newId('bud'), ...input }
    db().budgets.push(row)
    return row
  }),
  removeBudget: (id) => run(() => {
    find(db().budgets, id)
    db().budgets = db().budgets.filter((b) => b.id !== id)
  }),

  getSettings: () => run(() => db().settings),
  updateSettings: (patch) => run(() => Object.assign(db().settings, patch)),
  changeEpfRate: (rate, fromMonth) => run(() => {
    const rates = db().settings.epfRates
    const same = rates.find((r) => r.from === fromMonth)
    if (same) same.rate = rate
    else rates.push({ from: fromMonth, rate })
    rates.sort((a, b) => a.from.localeCompare(b.from))
  }),

  listCategories: () => run(() => [...db().categories].sort((a, b) => a.sort - b.sort)),
  addCategory: (name, icon) => run(() => {
    const row = { id: newId('cat'), name, icon: icon ?? '🧾', sort: db().categories.length, archived: false }
    db().categories.push(row)
    return row
  }),
  updateCategory: (id, patch) => run(() => Object.assign(find(db().categories, id), patch)),
  listPaymentMethods: () => run(() => db().paymentMethods),
  addPaymentMethod: (name, kind) => run(() => {
    const row = { id: newId('pm'), name, kind, archived: false }
    db().paymentMethods.push(row)
    return row
  }),
  updatePaymentMethod: (id, patch) => run(() => Object.assign(find(db().paymentMethods, id), patch)),

  listAccounts: () => run(() => db().accounts),
  addAccount: (input) => run(() => {
    const row = { ...input, id: newId('acc'), archived: false }
    db().accounts.push(row)
    return row
  }),
  updateAccount: (id, patch) => run(() => Object.assign(find(db().accounts, id), patch)),
  removeAccount: (id) => run(() => {
    find(db().accounts, id)
    db().accounts = db().accounts.filter((a) => a.id !== id)
    db().transactions = db().transactions.filter((t) => t.accountId !== id)
    db().valuations = db().valuations.filter((v) => v.accountId !== id)
  }),
  listTransactions: (accountId) => run(() =>
    db().transactions
      .filter((t) => !accountId || t.accountId === accountId)
      .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))),
  addTransaction: (input) => run(() => {
    const row = { ...input, id: newId('tx') }
    db().transactions.push(row)
    return row
  }),
  updateTransaction: (id, input) => run(() => Object.assign(find(db().transactions, id), input)),
  removeTransaction: (id) => run(() => {
    find(db().transactions, id)
    db().transactions = db().transactions.filter((t) => t.id !== id)
  }),
  listValuations: (accountId) => run(() =>
    db().valuations
      .filter((v) => !accountId || v.accountId === accountId)
      .sort((a, b) => a.asOf.localeCompare(b.asOf))),
  addValuation: (input) => run(() => {
    const row = { ...input, id: newId('val') }
    db().valuations.push(row)
    return row
  }),
  updateValuation: (id, input) => run(() => Object.assign(find(db().valuations, id), input)),
  removeValuation: (id) => run(() => {
    find(db().valuations, id)
    db().valuations = db().valuations.filter((v) => v.id !== id)
  }),
}
