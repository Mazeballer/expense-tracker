// A month split into weeks of seven days (1-7, 8-14, ...) with what was spent in each, using Malaysia dates.
import type { Expense } from '../types'
import { weeksOfMonth } from './budget'
import { klDate } from './date'
import { round2 } from './format'

export type MonthWeek = { number: number; from: string; to: string; days: number; total: number; count: number }

export function monthWeeks(expenses: Expense[], month: string): MonthWeek[] {
  const weeks: MonthWeek[] = weeksOfMonth(month).map((w, i) => ({ number: i + 1, from: w.from, to: w.to, days: w.days, total: 0, count: 0 }))
  for (const e of expenses) {
    const day = klDate(e.spentAt)
    const week = weeks.find((w) => day >= w.from && day <= w.to)
    if (!week) continue
    week.total += e.amount
    week.count += 1
  }
  return weeks.map((w) => ({ ...w, total: round2(w.total) }))
}

export const dayRange = (w: { from: string; to: string }) => `${Number(w.from.slice(8))}-${Number(w.to.slice(8))}`
