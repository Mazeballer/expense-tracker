import { describe, expect, it } from 'vitest'
import { accountFigures, activeItems, leftToSpend, planSummary, savingsTotals } from '../app/lib/finance'
import { addMonths, currentMonth, formatDay, klDate, monthEnd } from '../app/lib/date'
import type { PlanItem } from '../app/types'

const item = (kind: PlanItem['kind'], amount: number, from = '2026-01-01', to: string | null = null): PlanItem => ({
  id: `${kind}-${amount}-${from}`, groupKey: `${kind}-${amount}`, kind, label: kind, amount, effectiveFrom: from, effectiveTo: to, sort: 0,
})

const items = [
  item('income', 3900), item('income', 300),
  item('deduction', 20.75), item('deduction', 8.3), item('deduction', 31.15),
  item('fixed', 600), item('fixed', 140), item('fixed', 50), item('fixed', 50),
  item('fixed', 12.9), item('fixed', 150), item('fixed', 95), item('fixed', 25),
]

describe('planSummary', () => {
  it('matches the sheet figures for October 2026', () => {
    const s = planSummary(items, 0.11, '2026-10-01')
    expect(s).toMatchObject({ gross: 4200, epf: 462, deductions: 522.2, net: 3677.8, fixed: 1122.9, afterFixed: 2554.9 })
  })

  it('keeps old amounts for past months after a change', () => {
    const changed = [
      item('income', 3900, '2026-01-01', '2026-09-30'),
      item('income', 4500, '2026-10-01'),
    ]
    expect(planSummary(changed, 0.11, '2026-09-01').gross).toBe(3900)
    expect(planSummary(changed, 0.11, '2026-10-01').gross).toBe(4500)
  })

  it('reports no plan before the earliest start', () => {
    expect(planSummary(items, 0.11, '2025-12-01').hasPlan).toBe(false)
  })
})

describe('leftToSpend', () => {
  it('computes left and progress', () => {
    const r = leftToSpend(planSummary(items, 0.11, '2026-10-01'), 791.73)
    expect(r.left).toBe(1763.17)
    expect(r.over).toBe(0)
    expect(r.progress).toBeCloseTo(0.31, 2)
  })

  it('reports overspend', () => {
    const r = leftToSpend(planSummary(items, 0.11, '2026-10-01'), 2674.9)
    expect(r.over).toBe(120)
    expect(r.progress).toBe(1)
  })
})

describe('accounts', () => {
  const tx = (type: 'deposit' | 'withdrawal', amount: number) => ({ id: '1', accountId: 'a', occurredOn: '2026-01-01', type, amount, note: null })

  it('uses contributed when there is no valuation', () => {
    expect(accountFigures([tx('deposit', 500), tx('withdrawal', 100)], [])).toEqual({ contributed: 400, value: 400, gain: 0, hasValuation: false })
  })

  it('uses the latest valuation for value and gain', () => {
    const f = accountFigures([tx('deposit', 1000)], [
      { id: 'v1', accountId: 'a', asOf: '2026-02-01', value: 1050 },
      { id: 'v2', accountId: 'a', asOf: '2026-03-01', value: 1100 },
    ])
    expect(f).toEqual({ contributed: 1000, value: 1100, gain: 100, hasValuation: true })
  })

  it('sums values against the goal', () => {
    const accounts = [{ id: 'a', name: 'A', kind: 'savings' as const, archived: false }]
    const t = savingsTotals(accounts, [tx('deposit', 2500)], [], 10000)
    expect(t).toMatchObject({ total: 2500, progress: 0.25, remaining: 7500 })
  })
})

describe('Malaysia dates', () => {
  it('puts late-night UTC into the next KL day', () => {
    expect(klDate('2026-09-30T17:30:00Z')).toBe('2026-10-01')
    expect(currentMonth(new Date('2026-09-30T17:30:00Z'))).toBe('2026-10-01')
  })

  it('handles month maths', () => {
    expect(addMonths('2026-01-01', -1)).toBe('2025-12-01')
    expect(monthEnd('2026-02-01')).toBe('2026-02-28')
    expect(activeItems([item('fixed', 1, '2026-10-31')], '2026-10-01')).toHaveLength(1)
  })

  it('labels days', () => {
    expect(formatDay('2026-10-09', '2026-10-09')).toBe('Today')
    expect(formatDay('2026-10-08', '2026-10-09')).toBe('Yesterday')
    expect(formatDay('2026-10-03', '2026-10-09')).toBe('3 Oct')
  })
})

describe('short dates', () => {
  it('uses Sep, not Sept', async () => {
    const { formatShortDate, formatMonthShort } = await import('../app/lib/date')
    expect(formatShortDate('2026-09-05')).toBe('5 Sep')
    expect(formatMonthShort('2026-09-01')).toBe('Sep 26')
  })
})
