// Pure checks for what the AI sends back. The model's answer is never trusted as it is:
// amounts must appear in the person's own text, categories must be the person's own, dates must make sense.
import { z } from 'zod'

export type Named = { id: string; name: string }
export type MethodRef = { id: string; kind: 'debit' | 'credit_card' }

const isoDate = /^\d{4}-\d{2}-\d{2}$/

export const textAnswer = z.object({
  expenses: z.array(z.object({
    amount: z.coerce.number(),
    description: z.string().default(''),
    category: z.string().default(''),
    method: z.enum(['debit', 'credit_card']).nullable().optional(),
    date: z.string().nullable().optional(),
  })).max(20),
})

export const receiptAnswer = z.object({
  merchant: z.string().default('Receipt'),
  date: z.string().nullable().optional(),
  category: z.string().default(''),
  items: z.array(z.object({ name: z.string(), amount: z.coerce.number() })).max(80),
  total: z.coerce.number(),
})

export const shareAnswer = z.object({
  itemIds: z.array(z.string()).default([]),
  splitBy: z.coerce.number().int().min(1).max(20).default(1),
  paidByOther: z.boolean().default(false),
})

const round2 = (n: number) => Math.round(n * 100) / 100
const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const numbersIn = (text: string) =>
  (text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? []).map((n) => Number(n.replace(/,/g, '')))

export function pickCategory(name: string, categories: Named[]): string {
  const wanted = name.trim().toLowerCase()
  return (
    categories.find((c) => c.name.toLowerCase() === wanted)
    ?? categories.find((c) => c.name.toLowerCase() === 'others')
    ?? categories[0]
  )?.id ?? ''
}

export function pickDate(value: string | null | undefined, today: string): string {
  if (!value || !isoDate.test(value) || Number.isNaN(Date.parse(value))) return today
  return value > addDays(today, 1) || value < addDays(today, -400) ? today : value
}

export type ResolvedExpense = { amount: number; description: string; categoryId: string; paymentMethodId: string | null; date: string }

export function resolveExpenses(
  raw: unknown,
  ctx: { text: string; categories: Named[]; methods: MethodRef[]; today: string },
): ResolvedExpense[] {
  const parsed = textAnswer.safeParse(raw)
  if (!parsed.success) return []
  const typed = numbersIn(ctx.text)
  return parsed.data.expenses
    .filter((e) => e.amount > 0 && e.amount < 1_000_000 && typed.some((n) => Math.abs(n - e.amount) < 0.005))
    .map((e) => ({
      amount: round2(e.amount),
      description: e.description.trim().slice(0, 100) || 'Expense',
      categoryId: pickCategory(e.category, ctx.categories),
      paymentMethodId: ctx.methods.find((m) => m.kind === e.method)?.id ?? null,
      date: pickDate(e.date, ctx.today),
    }))
}

export type ResolvedReceipt = {
  merchant: string
  date: string
  categoryId: string
  items: { id: string; name: string; amount: number }[]
  extras: number
  total: number
}

export function resolveReceipt(raw: unknown, ctx: { categories: Named[]; today: string }): ResolvedReceipt | null {
  const parsed = receiptAnswer.safeParse(raw)
  if (!parsed.success) return null
  const items = parsed.data.items
    .filter((i) => i.name.trim() && i.amount >= 0)
    .map((i, n) => ({ id: `i${n + 1}`, name: i.name.trim().slice(0, 80), amount: round2(i.amount) }))
  if (!items.length || !(parsed.data.total > 0)) return null
  const sum = round2(items.reduce((t, i) => t + i.amount, 0))
  const total = round2(parsed.data.total)
  return {
    merchant: parsed.data.merchant.trim().slice(0, 80) || 'Receipt',
    date: pickDate(parsed.data.date, ctx.today),
    categoryId: pickCategory(parsed.data.category, ctx.categories),
    items,
    // Tax, service charge and rounding are whatever is left between the items and the total, so the maths always adds up.
    extras: round2(total - sum),
    total,
  }
}

export function resolveShare(raw: unknown, itemIds: string[]) {
  const parsed = shareAnswer.safeParse(raw)
  if (!parsed.success) return null
  return { ...parsed.data, itemIds: parsed.data.itemIds.filter((id) => itemIds.includes(id)) }
}
