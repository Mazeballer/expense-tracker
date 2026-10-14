import type { Category, PaymentMethod, PaymentMethodKind, QuickAddDraft } from '../types'

const METHOD_WORDS: Record<string, PaymentMethodKind> = {
  cc: 'credit_card', credit: 'credit_card', card: 'credit_card', debit: 'debit', dc: 'debit',
}

const CATEGORY_HINTS: [string, RegExp][] = [
  ['Groceries', /grocer|market|jaya|tesco|lotus|mydin/i],
  ['Transport', /grab|petrol|parking|toll|tng reload|lrt|mrt|bus/i],
  ['Shopping', /shopee|lazada|uniqlo|shirt|shoe|gift/i],
  ['Entertainment', /cinema|movie|game|netflix|concert/i],
  ['Health', /clinic|pharmacy|doctor|medicine|dental/i],
  ['Food & Drinks', /lunch|dinner|breakfast|coffee|cafe|juice|food|nasi|mee|ayam|tea|drink/i],
]

const shiftDay = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const titleCase = (s: string) => s.replace(/\w\S*/g, (w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase())

export function parseQuickAdd(
  text: string,
  categories: Category[],
  methods: PaymentMethod[],
  today: string,
): QuickAddDraft {
  const match = text.match(/\d+(?:,\d{3})*(?:\.\d{1,2})?/)
  if (!match) throw new Error('No amount found')
  const amount = Number(match[0].replace(/,/g, ''))
  if (!(amount > 0)) throw new Error('No amount found')

  let rest = text.replace(match[0], ' ').replace(/\brm\b/gi, ' ').replace(/\s+/g, ' ').trim()

  let date = today
  if (/\byesterday\b/i.test(rest)) {
    date = shiftDay(today, -1)
    rest = rest.replace(/\byesterday\b/gi, ' ').replace(/\s+/g, ' ').trim()
  } else if (/\btoday\b/i.test(rest)) {
    rest = rest.replace(/\btoday\b/gi, ' ').replace(/\s+/g, ' ').trim()
  }

  let paymentMethodId: string | null = null
  const last = rest.split(' ').pop()?.toLowerCase() ?? ''
  const kind = METHOD_WORDS[last]
  if (kind) {
    const method = methods.find((m) => m.kind === kind && !m.archived)
    if (method) {
      paymentMethodId = method.id
      rest = rest.slice(0, rest.length - last.length).trim()
    }
  }

  const hint = CATEGORY_HINTS.find(([, re]) => re.test(rest))
  const fallback = categories.find((c) => c.name === 'Others') ?? categories[0]!
  const category = categories.find((c) => c.name === hint?.[0]) ?? fallback

  return {
    amount,
    description: titleCase(rest) || category.name,
    categoryId: category.id,
    paymentMethodId,
    date,
    flagged: false,
  }
}
