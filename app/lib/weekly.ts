// Weeks run Monday to Sunday, using Malaysia dates.
import type { Expense } from '../types'
import { klDate, monthOf } from './date'
import { round2 } from './format'

export type Week = { from: string; to: string; total: number; count: number }

const DAY = 24 * 60 * 60 * 1000
const utc = (date: string) => Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export const addDays = (date: string, days: number) => iso(utc(date) + days * DAY)

export function weekStart(date: string): string {
  const dow = new Date(utc(date)).getUTCDay() // 0 = Sunday
  return addDays(date, -((dow + 6) % 7))
}

// The last `count` weeks ending with the week that holds `today`, oldest first.
export function lastWeeks(expenses: Expense[], today: string, count: number): Week[] {
  const first = addDays(weekStart(today), -7 * (count - 1))
  const weeks: Week[] = Array.from({ length: count }, (_, i) => {
    const from = addDays(first, i * 7)
    return { from, to: addDays(from, 6), total: 0, count: 0 }
  })
  for (const e of expenses) {
    const day = klDate(e.spentAt)
    const i = Math.floor((utc(day) - utc(first)) / (7 * DAY))
    if (i < 0 || i >= count) continue
    weeks[i]!.total += e.amount
    weeks[i]!.count += 1
  }
  return weeks.map((w) => ({ ...w, total: round2(w.total) }))
}

// The months that hold the weeks above, so only those need loading.
export function monthsCovering(weeks: Week[]): string[] {
  const out: string[] = []
  for (let d = weeks[0]!.from; d <= weeks[weeks.length - 1]!.to; d = addDays(d, 7)) {
    for (const m of [monthOf(d), monthOf(addDays(d, 6))]) if (!out.includes(m)) out.push(m)
  }
  return out
}
