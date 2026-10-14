import type { Account, AccountTx, PlanItem, Valuation } from '../types'
import { monthEnd } from './date'
import { round2 } from './format'

export type PlanSummary = {
  hasPlan: boolean
  gross: number
  epf: number
  deductions: number
  net: number
  fixed: number
  afterFixed: number
}

export type LeftToSpend = {
  available: number
  spent: number
  left: number
  over: number
  progress: number
}

export type AccountFigures = {
  contributed: number
  value: number
  gain: number
  hasValuation: boolean
}

export function activeItems(items: PlanItem[], month: string): PlanItem[] {
  const end = monthEnd(month)
  return items.filter(
    (i) => i.effectiveFrom <= end && (i.effectiveTo === null || i.effectiveTo >= month),
  )
}

const sum = (items: PlanItem[], kind: PlanItem['kind']) =>
  items.filter((i) => i.kind === kind).reduce((total, i) => total + i.amount, 0)

export function epfRateAt(rates: { from: string; rate: number }[], month: string): number {
  const applicable = rates.filter((r) => r.from <= month)
  return (applicable.length ? applicable[applicable.length - 1]! : rates[0]!).rate
}

export function planSummary(items: PlanItem[], epfRate: number, month: string): PlanSummary {
  const active = activeItems(items, month)
  const gross = round2(sum(active, 'income'))
  const epf = round2(gross * epfRate)
  const deductions = round2(epf + sum(active, 'deduction'))
  const net = round2(gross - deductions)
  const fixed = round2(sum(active, 'fixed'))
  return {
    hasPlan: active.length > 0,
    gross,
    epf,
    deductions,
    net,
    fixed,
    afterFixed: round2(net - fixed),
  }
}

export function leftToSpend(summary: PlanSummary, spent: number): LeftToSpend {
  const available = summary.afterFixed
  const left = round2(available - spent)
  const progress = available > 0 ? Math.min(Math.max(spent / available, 0), 1) : spent > 0 ? 1 : 0
  return { available, spent: round2(spent), left, over: left < 0 ? round2(-left) : 0, progress }
}

export function accountFigures(
  txs: AccountTx[],
  valuations: Valuation[],
): AccountFigures {
  const contributed = round2(
    txs.reduce((total, t) => total + (t.type === 'deposit' ? t.amount : -t.amount), 0),
  )
  const latest = [...valuations].sort((a, b) => b.asOf.localeCompare(a.asOf))[0]
  const value = latest ? latest.value : contributed
  return {
    contributed,
    value: round2(value),
    gain: latest ? round2(latest.value - contributed) : 0,
    hasValuation: Boolean(latest),
  }
}

export function savingsTotals(
  accounts: Account[],
  txs: AccountTx[],
  valuations: Valuation[],
  goal: number | null,
) {
  const total = round2(
    accounts.reduce(
      (t, a) =>
        t +
        accountFigures(
          txs.filter((x) => x.accountId === a.id),
          valuations.filter((v) => v.accountId === a.id),
        ).value,
      0,
    ),
  )
  const progress = goal && goal > 0 ? Math.min(total / goal, 1) : null
  return { total, goal, progress, remaining: goal ? round2(Math.max(goal - total, 0)) : null }
}
