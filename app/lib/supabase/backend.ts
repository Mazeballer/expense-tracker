import type { PostgrestError } from '@supabase/supabase-js'
import type { Backend } from '../backend'
import { addMonths } from '../date'
import { dataUrlToBlob } from '../image'
import type {
  ApiToken,
  Account, AccountTx, Budget, Category, Expense, EpfRate, MonthTotal, PaymentMethod, PlanItem, Valuation,
} from '../../types'
import { supabase } from './client'

type Row = Record<string, any>

function check<T>(res: { data: T | null; error: PostgrestError | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

const userId = async () => {
  const { data } = await supabase().auth.getSession()
  if (!data.session) throw new Error('Not signed in')
  return data.session.user.id
}

const readAsDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(new Error('Could not read the photo'))
  reader.readAsDataURL(blob)
})

// Postgres returns timestamps in UTC. The app reads them as Malaysia time, so keep the instant.
const expense = (r: Row): Expense => ({
  id: r.id, spentAt: r.spent_at, description: r.description, categoryId: r.category_id,
  paymentMethodId: r.payment_method_id, amount: Number(r.amount), note: r.note, source: r.source,
})
const category = (r: Row): Category => ({ id: r.id, name: r.name, icon: r.icon, sort: r.sort, archived: r.archived })
const method = (r: Row): PaymentMethod => ({ id: r.id, name: r.name, kind: r.kind, archived: r.archived })
const planItem = (r: Row): PlanItem => ({
  id: r.id, groupKey: r.group_key, kind: r.kind, label: r.label, amount: Number(r.amount),
  effectiveFrom: r.effective_from, effectiveTo: r.effective_to, sort: r.sort,
})
const budget = (r: Row): Budget => ({ id: r.id, categoryId: r.category_id, amount: Number(r.amount) })
const account = (r: Row): Account => ({ id: r.id, name: r.name, icon: r.icon, kind: r.kind, archived: r.archived })
const tx = (r: Row): AccountTx => ({
  id: r.id, accountId: r.account_id, occurredOn: r.occurred_on, type: r.type, amount: Number(r.amount), note: r.note,
})
const apiToken = (r: Row): ApiToken => ({ id: r.id, label: r.label, createdAt: r.created_at, lastUsedAt: r.last_used_at })
const valuation = (r: Row): Valuation => ({ id: r.id, accountId: r.account_id, asOf: r.as_of, value: Number(r.value) })

const PAGE = 1000
async function fetchAll(build: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: PostgrestError | null }>) {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE) {
    const page = check(await build(from, from + PAGE - 1))
    rows.push(...page)
    if (page.length < PAGE) return rows
  }
}

const expenseColumns = (i: Parameters<Backend['addExpense']>[0]) => ({
  spent_at: i.spentAt, description: i.description, category_id: i.categoryId,
  payment_method_id: i.paymentMethodId, amount: i.amount, note: i.note,
  ...(i.source ? { source: i.source } : {}),
})

const escapeLike = (s: string) => s.replace(/[%_\\]/g, (c) => `\\${c}`)

export const supabaseBackend: Backend = {
  async listExpenses(f) {
    const sb = supabase()
    const rows = await fetchAll((from, to) => {
      let q = sb.from('expenses').select('*').order('spent_at', { ascending: false }).range(from, to)
      if (f.month) q = q.gte('spent_at', `${f.month}T00:00:00+08:00`).lt('spent_at', `${addMonths(f.month, 1)}T00:00:00+08:00`)
      if (f.categoryId) q = q.eq('category_id', f.categoryId)
      if (f.paymentMethodId) q = q.eq('payment_method_id', f.paymentMethodId)
      if (f.search?.trim()) q = q.ilike('description', `%${escapeLike(f.search.trim())}%`)
      return q
    })
    return rows.map(expense)
  },
  async addExpense(input) {
    return expense(check(await supabase().from('expenses').insert(expenseColumns(input)).select().single()))
  },
  async updateExpense(id, input) {
    return expense(check(await supabase().from('expenses').update(expenseColumns(input)).eq('id', id).select().single()))
  },
  async removeExpense(id) {
    check(await supabase().from('expenses').delete().eq('id', id).select('id').single())
  },
  async monthTotals(from, to) {
    const rows = await fetchAll((a, b) => supabase().from('expense_monthly').select('month,category_id,total,count').gte('month', from).lte('month', to).range(a, b))
    return rows.map((r): MonthTotal => ({ month: r.month, categoryId: r.category_id, total: Number(r.total), count: r.count }))
  },

  async planItems() {
    return check(await supabase().from('plan_items').select('*').order('sort')).map(planItem)
  },
  async changePlanItem(groupKey, newAmount, fromMonth) {
    check(await supabase().rpc('plan_item_change', { p_group: groupKey, p_amount: newAmount, p_from: fromMonth }))
  },
  async renamePlanItem(groupKey, label) {
    check(await supabase().from('plan_items').update({ label }).eq('group_key', groupKey).select('id'))
  },
  async addPlanItem(input) {
    const sb = supabase()
    const last = check(await sb.from('plan_items').select('sort').order('sort', { ascending: false }).limit(1))
    const sort = (last[0]?.sort ?? 0) + 1
    return planItem(check(await sb.from('plan_items').insert({
      kind: input.kind, label: input.label, amount: input.amount, effective_from: input.effectiveFrom, sort,
    }).select().single()))
  },
  async endPlanItem(groupKey, fromMonth) {
    check(await supabase().rpc('plan_item_end', { p_group: groupKey, p_from: fromMonth }))
  },

  async listBudgets() {
    return check(await supabase().from('budgets').select('*')).map(budget)
  },
  async setBudget(input) {
    const sb = supabase()
    const q = sb.from('budgets').select('id')
    const found = check(await (input.categoryId ? q.eq('category_id', input.categoryId) : q.is('category_id', null)).limit(1))
    if (found[0]) return budget(check(await sb.from('budgets').update({ amount: input.amount }).eq('id', found[0].id).select().single()))
    return budget(check(await sb.from('budgets').insert({ category_id: input.categoryId, amount: input.amount }).select().single()))
  },
  async removeBudget(id) {
    check(await supabase().from('budgets').delete().eq('id', id).select('id').single())
  },

  async getSettings() {
    const sb = supabase()
    const [settings, rates] = await Promise.all([
      sb.from('user_settings').select('savings_goal').maybeSingle(),
      sb.from('epf_rates').select('effective_from,rate').order('effective_from'),
    ])
    const s = check(settings)
    return {
      savingsGoal: s?.savings_goal === null || s?.savings_goal === undefined ? null : Number(s.savings_goal),
      epfRates: check(rates).map((r): EpfRate => ({ from: r.effective_from, rate: Number(r.rate) })),
    }
  },
  async updateSettings(patch) {
    const id = await userId()
    if ('savingsGoal' in patch) {
      check(await supabase().from('user_settings').update({ savings_goal: patch.savingsGoal }).eq('user_id', id).select('user_id'))
    }
    return supabaseBackend.getSettings()
  },
  async changeEpfRate(rate, fromMonth) {
    check(await supabase().rpc('change_epf_rate', { p_rate: rate, p_from: fromMonth }))
  },

  async listCategories() {
    return check(await supabase().from('categories').select('*').order('sort')).map(category)
  },
  async addCategory(name, icon) {
    const sb = supabase()
    const last = check(await sb.from('categories').select('sort').order('sort', { ascending: false }).limit(1))
    return category(check(await sb.from('categories').insert({ name, icon: icon ?? '🧾', sort: (last[0]?.sort ?? -1) + 1 }).select().single()))
  },
  async updateCategory(id, patch) {
    return category(check(await supabase().from('categories').update(patch).eq('id', id).select().single()))
  },
  async listPaymentMethods() {
    return check(await supabase().from('payment_methods').select('*').order('sort')).map(method)
  },
  async addPaymentMethod(name, kind) {
    return method(check(await supabase().from('payment_methods').insert({ name, kind }).select().single()))
  },
  async updatePaymentMethod(id, patch) {
    return method(check(await supabase().from('payment_methods').update(patch).eq('id', id).select().single()))
  },

  async listAccounts() {
    return check(await supabase().from('accounts').select('*').order('sort')).map(account)
  },
  async addAccount(input) {
    const sb = supabase()
    const last = check(await sb.from('accounts').select('sort').order('sort', { ascending: false }).limit(1))
    return account(check(await sb.from('accounts').insert({ name: input.name, icon: input.icon, kind: input.kind, sort: (last[0]?.sort ?? -1) + 1 }).select().single()))
  },
  async updateAccount(id, patch) {
    return account(check(await supabase().from('accounts').update(patch).eq('id', id).select().single()))
  },
  async removeAccount(id) {
    check(await supabase().from('accounts').delete().eq('id', id).select('id').single())
  },
  async listTransactions(accountId) {
    const rows = await fetchAll((a, b) => {
      let q = supabase().from('account_transactions').select('*').order('occurred_on', { ascending: false }).range(a, b)
      if (accountId) q = q.eq('account_id', accountId)
      return q
    })
    return rows.map(tx)
  },
  async addTransaction(input) {
    return tx(check(await supabase().from('account_transactions').insert({
      account_id: input.accountId, occurred_on: input.occurredOn, type: input.type, amount: input.amount, note: input.note,
    }).select().single()))
  },
  async updateTransaction(id, input) {
    return tx(check(await supabase().from('account_transactions').update({
      account_id: input.accountId, occurred_on: input.occurredOn, type: input.type, amount: input.amount, note: input.note,
    }).eq('id', id).select().single()))
  },
  async removeTransaction(id) {
    check(await supabase().from('account_transactions').delete().eq('id', id).select('id').single())
  },
  async listValuations(accountId) {
    const rows = await fetchAll((a, b) => {
      let q = supabase().from('account_valuations').select('*').order('as_of').range(a, b)
      if (accountId) q = q.eq('account_id', accountId)
      return q
    })
    return rows.map(valuation)
  },
  async addValuation(input) {
    return valuation(check(await supabase().from('account_valuations').insert({ account_id: input.accountId, as_of: input.asOf, value: input.value }).select().single()))
  },
  async updateValuation(id, input) {
    return valuation(check(await supabase().from('account_valuations').update({ account_id: input.accountId, as_of: input.asOf, value: input.value }).eq('id', id).select().single()))
  },
  async removeValuation(id) {
    check(await supabase().from('account_valuations').delete().eq('id', id).select('id').single())
  },

  async listApiTokens() {
    return check(await supabase().from('api_tokens').select('id,label,created_at,last_used_at').order('created_at', { ascending: false })).map(apiToken)
  },
  async addApiToken(label, tokenHash) {
    return apiToken(check(await supabase().from('api_tokens').insert({ label, token_hash: tokenHash }).select('id,label,created_at,last_used_at').single()))
  },
  async removeApiToken(id) {
    check(await supabase().from('api_tokens').delete().eq('id', id).select('id').single())
  },

  // Every upload gets a new file name. The old copy was cached by the browser for an hour, so reusing one name showed the old photo.
  async getAvatar() {
    const id = await userId()
    const bucket = supabase().storage.from('avatars')
    const found = await bucket.list(id, { limit: 20, sortBy: { column: 'created_at', order: 'desc' } })
    if (found.error) throw new Error(found.error.message)
    const latest = found.data.find((f) => f.name.startsWith('avatar'))
    if (!latest) return null
    const file = await bucket.download(`${id}/${latest.name}`)
    if (file.error) throw new Error(file.error.message)
    return readAsDataUrl(file.data)
  },
  async setAvatar(dataUrl) {
    const id = await userId()
    const bucket = supabase().storage.from('avatars')
    const name = `avatar-${Date.now()}.jpg`
    const { error } = await bucket.upload(`${id}/${name}`, dataUrlToBlob(dataUrl), { contentType: 'image/jpeg' })
    if (error) throw new Error(error.message)
    // The new photo is saved, so the old ones can go.
    const found = await bucket.list(id, { limit: 100 })
    const old = (found.data ?? []).filter((f) => f.name !== name).map((f) => `${id}/${f.name}`)
    if (old.length) await bucket.remove(old)
  },
  async removeAvatar() {
    const id = await userId()
    const bucket = supabase().storage.from('avatars')
    const found = await bucket.list(id, { limit: 100 })
    if (found.error) throw new Error(found.error.message)
    const all = found.data.map((f) => `${id}/${f.name}`)
    if (!all.length) return
    const { error } = await bucket.remove(all)
    if (error) throw new Error(error.message)
  },
}

