import type {
  Account, AccountTx, Budget, Category, Expense, PaymentMethod, PlanItem, Settings, Valuation,
} from '../../types'
import { addMonths, currentMonth, monthEnd, todayKL, toKLIso } from '../date'

export type MockState = {
  categories: Category[]
  paymentMethods: PaymentMethod[]
  expenses: Expense[]
  planItems: PlanItem[]
  settings: Settings
  budgets: Budget[]
  accounts: Account[]
  transactions: AccountTx[]
  valuations: Valuation[]
}

let counter = 0
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const CATEGORY_NAMES = ['Food & Drinks', 'Groceries', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Others']
const CATEGORY_ICONS = ['🍜', '🛒', '🚗', '🛍️', '🎬', '💊', '🧾']

type Template = [description: string, category: string, min: number, max: number]

const TEMPLATES: Template[] = [
  ['Boost Juice', 'Food & Drinks', 12, 18], ['Lunch', 'Food & Drinks', 9, 16], ['Dinner ayam penyet', 'Food & Drinks', 14, 24],
  ['Kopitiam breakfast', 'Food & Drinks', 6, 11], ['Mixed rice', 'Food & Drinks', 8, 13], ['Starbucks', 'Food & Drinks', 14, 22],
  ['Grocery', 'Groceries', 10, 85], ['Jaya Grocer', 'Groceries', 25, 120], ['Wet market', 'Groceries', 15, 45],
  ['Grab to office', 'Transport', 8, 24], ['Touch n Go reload', 'Transport', 20, 50], ['Petrol', 'Transport', 40, 80],
  ['Uniqlo', 'Shopping', 40, 160], ['Shopee order', 'Shopping', 15, 90], ['Dyson gift', 'Shopping', 300, 450],
  ['Cinema', 'Entertainment', 16, 32], ['Steam game', 'Entertainment', 20, 90],
  ['Clinic visit', 'Health', 30, 85], ['Pharmacy', 'Health', 12, 40],
  ['Parking', 'Others', 3, 12], ['Haircut', 'Others', 15, 35],
]

const WEIGHTS: Record<string, number> = {
  'Food & Drinks': 9, Groceries: 3, Transport: 3, Shopping: 1, Entertainment: 1, Health: 0.5, Others: 1,
}

export function createSeed(): MockState {
  const rand = rng(42)
  const today = todayKL()
  const month = currentMonth()
  const firstMonth = addMonths(month, -11)

  const categories: Category[] = CATEGORY_NAMES.map((name, sort) => ({ id: `cat-${sort}`, name, icon: CATEGORY_ICONS[sort]!, sort, archived: false }))
  const catId = (name: string) => categories.find((c) => c.name === name)!.id

  const paymentMethods: PaymentMethod[] = [
    { id: 'pm-debit', name: 'Debit card', kind: 'debit', archived: false },
    { id: 'pm-credit', name: 'Credit card', kind: 'credit_card', archived: false },
  ]

  const weighted = TEMPLATES.flatMap((t) => Array(Math.max(1, Math.round(WEIGHTS[t[1]!]! * 2))).fill(t) as Template[])
  const expenses: Expense[] = []
  for (let m = 0; m < 12; m++) {
    const start = addMonths(firstMonth, m)
    const lastDay = Number(monthEnd(start).slice(8, 10))
    const maxDay = start === month ? Number(today.slice(8, 10)) : lastDay
    const count = start === month ? 12 : 11 + Math.floor(rand() * 4)
    for (let i = 0; i < count; i++) {
      const [description, category, min, max] = weighted[Math.floor(rand() * weighted.length)]!
      if (description === 'Dyson gift' && start !== month) continue
      const day = String(1 + Math.floor(rand() * maxDay)).padStart(2, '0')
      const hour = String(8 + Math.floor(rand() * 14)).padStart(2, '0')
      const minute = String(Math.floor(rand() * 60)).padStart(2, '0')
      const amount = Math.round((min + rand() * (max - min)) * 2) / 2
      const old = m < 4
      expenses.push({
        id: `exp-${m}-${i}`,
        spentAt: toKLIso(`${start.slice(0, 8)}${day}`, old ? '00:00:00' : `${hour}:${minute}:00`),
        description,
        categoryId: catId(category),
        paymentMethodId: old ? null : paymentMethods[Math.floor(rand() * 2)]!.id,
        amount,
        note: null,
        source: old ? 'import' : rand() > 0.6 ? 'quick_add' : 'app',
      })
    }
  }
  expenses.push(
    { id: 'exp-fixed-1', spentAt: toKLIso(today, '12:53:32'), description: 'Boost Juice', categoryId: catId('Food & Drinks'), paymentMethodId: 'pm-credit', amount: 16.5, note: null, source: 'app' },
    { id: 'exp-fixed-2', spentAt: toKLIso(today, '12:53:13'), description: 'Grocery', categoryId: catId('Groceries'), paymentMethodId: 'pm-debit', amount: 13.5, note: null, source: 'app' },
  )
  expenses.sort((a, b) => b.spentAt.localeCompare(a.spentAt))

  const plan = (kind: PlanItem['kind'], label: string, amount: number, sort: number): PlanItem => ({
    id: `plan-${sort}`, groupKey: `group-${sort}`, kind, label, amount, effectiveFrom: firstMonth, effectiveTo: null, sort,
  })
  const planItems: PlanItem[] = [
    plan('income', 'Base Salary', 3900, 0), plan('income', 'Allowance', 300, 1),
    plan('deduction', 'SOCSO', 20.75, 2), plan('deduction', 'EIS', 8.3, 3), plan('deduction', 'Employee SKBBK', 31.15, 4),
    plan('fixed', 'Rent', 600, 5), plan('fixed', 'Anytime Fitness', 140, 6), plan('fixed', 'WiFi + Water Dispenser', 50, 7),
    plan('fixed', 'Rapid KL', 50, 8), plan('fixed', 'YouTube', 12.9, 9), plan('fixed', 'Utilities', 150, 10),
    plan('fixed', 'Claude Subscription', 95, 11), plan('fixed', 'Phone Bill', 25, 12),
  ]

  const accounts: Account[] = [
    { id: 'acc-epf', name: 'EPF Voluntary', icon: '🏛️', kind: 'investment', archived: false },
    { id: 'acc-asb', name: 'ASB', icon: '🏦', kind: 'investment', archived: false },
    { id: 'acc-stocks', name: 'Stocks/Unit Trust', icon: '📈', kind: 'investment', archived: false },
    { id: 'acc-emergency', name: 'Emergency Fund', icon: '🛟', kind: 'savings', archived: false },
    { id: 'acc-others', name: 'Others', icon: '💼', kind: 'savings', archived: false },
  ]

  const transactions: AccountTx[] = []
  const valuations: Valuation[] = []
  const deposits: Record<string, number> = { 'acc-epf': 300, 'acc-asb': 500, 'acc-stocks': 400, 'acc-emergency': 600 }
  for (let m = 0; m < 12; m++) {
    for (const [accountId, amount] of Object.entries(deposits)) {
      if (accountId === 'acc-stocks' && m < 4) continue
      transactions.push({
        id: `tx-${accountId}-${m}`, accountId, occurredOn: `${addMonths(firstMonth, m).slice(0, 8)}05`,
        type: 'deposit', amount, note: null,
      })
    }
  }
  for (const [accountId, base, growth] of [['acc-epf', 300, 0.012], ['acc-asb', 500, 0.006], ['acc-stocks', 400, 0.02]] as const) {
    let contributed = 0
    for (let m = 0; m < 12; m++) {
      if (accountId === 'acc-stocks' && m < 4) continue
      contributed += base
      if (m % 3 === 2 || m === 11) {
        valuations.push({
          id: `val-${accountId}-${m}`, accountId, asOf: `${addMonths(firstMonth, m).slice(0, 8)}28`,
          value: Math.round(contributed * (1 + growth * (m + 1)) * 100) / 100,
        })
      }
    }
  }

  return {
    categories, paymentMethods, expenses, planItems,
    settings: { epfRates: [{ from: '2000-01-01', rate: 0.11 }], savingsGoal: 50000 },
    budgets: [
      { id: 'bud-all', categoryId: null, amount: 1500 },
      { id: 'bud-food', categoryId: catId('Food & Drinks'), amount: 150 },
      { id: 'bud-groceries', categoryId: catId('Groceries'), amount: 12 },
      { id: 'bud-transport', categoryId: catId('Transport'), amount: 250 },
      { id: 'bud-health', categoryId: catId('Health'), amount: 45 },
    ],
    accounts, transactions, valuations,
  }
}
