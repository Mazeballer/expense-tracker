import type { Expense } from '../types'
import { klDate, monthEnd } from './date'
import { round2 } from './format'

export type Period = { key: string; label: string; from: string; to: string; days: number }

const pad = (n: number) => String(n).padStart(2, '0')
const daysIn = (month: string) => Number(monthEnd(month).slice(8, 10))

export const monthPeriod = (month: string): Period => ({ key: 'month', label: 'Month', from: month, to: monthEnd(month), days: daysIn(month) })

export function weeksOfMonth(month: string): Period[] {
  const last = daysIn(month)
  const prefix = month.slice(0, 8)
  const weeks: Period[] = []
  for (let start = 1; start <= last; start += 7) {
    const end = Math.min(start + 6, last)
    weeks.push({ key: `w${weeks.length + 1}`, label: `Week ${weeks.length + 1}`, from: `${prefix}${pad(start)}`, to: `${prefix}${pad(end)}`, days: end - start + 1 })
  }
  return weeks
}

export const limitFor = (monthly: number, month: string, period: Period) => round2((monthly * period.days) / daysIn(month))

export function spentIn(expenses: Expense[], period: Period, categoryId?: string | null): number {
  return round2(expenses.reduce((total, e) => {
    const day = klDate(e.spentAt)
    if (day < period.from || day > period.to) return total
    if (categoryId && e.categoryId !== categoryId) return total
    return total + e.amount
  }, 0))
}

export type BudgetStatus = 'ok' | 'near' | 'reached'
export type BudgetFigures = { limit: number; spent: number; left: number; over: number; progress: number; status: BudgetStatus }

export const NEAR_LIMIT = 0.8

export function budgetFigures(limit: number, spent: number): BudgetFigures {
  const left = round2(limit - spent)
  const progress = limit > 0 ? Math.min(Math.max(spent / limit, 0), 1) : spent > 0 ? 1 : 0
  const status: BudgetStatus = limit > 0 && spent >= limit ? 'reached' : progress >= NEAR_LIMIT ? 'near' : 'ok'
  return { limit, spent, left, over: left < 0 ? round2(-left) : 0, progress, status }
}
