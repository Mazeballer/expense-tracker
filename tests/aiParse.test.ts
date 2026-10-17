import { describe, expect, it } from 'vitest'
import { numbersIn, pickDate, resolveExpenses, resolveReceipt, resolveShare } from '../app/lib/aiParse'

const categories = [
  { id: 'c-food', name: 'Food & Drinks' },
  { id: 'c-transport', name: 'Transport' },
  { id: 'c-others', name: 'Others' },
]
const methods = [{ id: 'm-debit', kind: 'debit' as const }, { id: 'm-credit', kind: 'credit_card' as const }]
const today = '2026-10-14'

describe('resolveExpenses', () => {
  const ctx = (text: string) => ({ text, categories, methods, today })

  it('maps the category name to the person\'s own category id and the method kind to its id', () => {
    const out = resolveExpenses({ expenses: [{ amount: 12.5, description: 'Lunch', category: 'food & drinks', method: 'credit_card', date: today }] }, ctx('12.50 lunch cc'))
    expect(out).toEqual([{ amount: 12.5, description: 'Lunch', categoryId: 'c-food', paymentMethodId: 'm-credit', date: today }])
  })

  it('drops an amount the person never typed (the "21.30 became 2130" bug)', () => {
    expect(resolveExpenses({ expenses: [{ amount: 2130, description: 'Lunch', category: 'Food & Drinks' }] }, ctx('21.30 lunch'))).toEqual([])
  })

  it('accepts thousands separators and keeps several purchases from one message', () => {
    const out = resolveExpenses({ expenses: [
      { amount: 1200, description: 'Rent share', category: 'Others' },
      { amount: 8, description: 'Grab', category: 'Transport' },
    ] }, ctx('1,200 rent share and 8 grab'))
    expect(out.map((e) => e.amount)).toEqual([1200, 8])
  })

  it('falls back to Others for a category it does not know, and to today for a bad date', () => {
    const [e] = resolveExpenses({ expenses: [{ amount: 5, description: 'x', category: 'Pets', date: '2099-01-01' }] }, ctx('5 x'))
    expect(e).toMatchObject({ categoryId: 'c-others', date: today, paymentMethodId: null })
  })

  it('returns nothing for an answer in the wrong shape', () => {
    expect(resolveExpenses({ nope: true }, ctx('5 x'))).toEqual([])
  })
})

describe('resolveReceipt', () => {
  it('computes tax and service as what is left between the items and the total', () => {
    const r = resolveReceipt({ merchant: 'Starbucks', category: 'Food & Drinks', total: 53, items: [{ name: 'Latte', amount: 14.5 }, { name: 'Americano', amount: 11 }, { name: 'Muffin', amount: 9.5 }, { name: 'Sandwich', amount: 15 }] }, { categories, today })
    expect(r?.extras).toBe(3)
    expect(r?.items.map((i) => i.id)).toEqual(['i1', 'i2', 'i3', 'i4'])
    expect(r?.categoryId).toBe('c-food')
  })

  it('rejects something that is not a receipt', () => {
    expect(resolveReceipt({ merchant: '', items: [], total: 0 }, { categories, today })).toBeNull()
  })
})

describe('resolveShare', () => {
  it('keeps only item ids that exist', () => {
    expect(resolveShare({ itemIds: ['i1', 'ghost'], splitBy: 2, paidByOther: false }, ['i1', 'i2'])).toEqual({ itemIds: ['i1'], splitBy: 2, paidByOther: false })
  })
})

describe('helpers', () => {
  it('reads numbers with commas and decimals', () => expect(numbersIn('1,234.50 and 8')).toEqual([1234.5, 8]))
  it('rejects dates far in the future or the past', () => {
    expect(pickDate('2026-10-13', today)).toBe('2026-10-13')
    expect(pickDate('2020-01-01', today)).toBe(today)
  })
})
