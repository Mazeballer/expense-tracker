import { describe, expect, it } from 'vitest'
import type { Expense } from '../app/types'
import { dayRange, monthWeeks } from '../app/lib/weekly'

const spent = (date: string, amount: number, time = '12:00:00'): Expense =>
  ({ id: date + amount, spentAt: `${date}T${time}+08:00`, description: 'x', categoryId: 'c', paymentMethodId: null, amount, note: null, source: 'app' })

describe('weekly spending for a month', () => {
  it('splits the month into weeks of seven days, the last one shorter', () => {
    const weeks = monthWeeks([], '2026-11-01')
    expect(weeks.map(dayRange)).toEqual(['1-7', '8-14', '15-21', '22-28', '29-30'])
    expect(weeks.map((w) => w.days)).toEqual([7, 7, 7, 7, 2])
  })
  it('adds each expense to its week by Malaysia date', () => {
    const weeks = monthWeeks([
      spent('2026-11-07', 10.5, '23:30:00'),
      spent('2026-11-08', 4.5, '00:30:00'), // just after midnight in Malaysia, so week 2
      spent('2026-11-30', 20),
      spent('2026-10-31', 99), // another month, left out
    ], '2026-11-01')
    expect(weeks.map((w) => w.total)).toEqual([10.5, 4.5, 0, 0, 20])
    expect(weeks[0]!.count).toBe(1)
  })
})
