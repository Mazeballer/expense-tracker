import { describe, expect, it } from 'vitest'
import type { Expense } from '../app/types'
import { addDays, lastWeeks, monthsCovering, weekStart } from '../app/lib/weekly'

const spent = (date: string, amount: number, time = '12:00:00'): Expense =>
  ({ id: date + amount, spentAt: `${date}T${time}+08:00`, description: 'x', categoryId: 'c', paymentMethodId: null, amount, note: null, source: 'app' })

describe('weekly spending', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart('2026-11-11')).toBe('2026-11-09') // Wednesday
    expect(weekStart('2026-11-09')).toBe('2026-11-09') // Monday
    expect(weekStart('2026-11-15')).toBe('2026-11-09') // Sunday
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
  })
  it('adds each expense to its week by Malaysia date, oldest week first', () => {
    const weeks = lastWeeks([
      spent('2026-11-09', 10.5, '00:30:00'), // just after midnight in Malaysia
      spent('2026-11-15', 4.5, '23:30:00'),
      spent('2026-11-08', 20), // last week's Sunday
      spent('2026-09-01', 99), // too old, left out
    ], '2026-11-11', 4)
    expect(weeks.map((w) => w.from)).toEqual(['2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09'])
    expect(weeks.map((w) => w.total)).toEqual([0, 0, 20, 15])
    expect(weeks[3]!.count).toBe(2)
  })
  it('lists the months that hold the weeks', () => {
    const weeks = lastWeeks([], '2026-11-11', 4)
    expect(monthsCovering(weeks)).toEqual(['2026-10-01', '2026-11-01'])
  })
})
