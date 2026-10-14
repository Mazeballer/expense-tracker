export type Category = { id: string; name: string; icon: string; sort: number; archived: boolean }

export type PaymentMethodKind = 'debit' | 'credit_card'
export type PaymentMethod = { id: string; name: string; kind: PaymentMethodKind; archived: boolean }

export type ExpenseSource = 'app' | 'quick_add' | 'receipt' | 'telegram' | 'import'
export type Expense = {
  id: string
  spentAt: string
  description: string
  categoryId: string
  paymentMethodId: string | null
  amount: number
  note: string | null
  source: ExpenseSource
}
export type ExpenseInput = Omit<Expense, 'id' | 'source'> & { source?: ExpenseSource }
export type ExpenseFilters = {
  month?: string
  categoryId?: string
  paymentMethodId?: string
  search?: string
}

export type PlanKind = 'income' | 'deduction' | 'fixed'
export type PlanItem = {
  id: string
  groupKey: string
  kind: PlanKind
  label: string
  amount: number
  effectiveFrom: string
  effectiveTo: string | null
  sort: number
}
export type PlanItemInput = { kind: PlanKind; label: string; amount: number; effectiveFrom: string }

export type EpfRate = { from: string; rate: number }
export type Settings = { epfRates: EpfRate[]; savingsGoal: number | null }

export type AccountKind = 'savings' | 'investment'
export type Account = { id: string; name: string; icon: string; kind: AccountKind; archived: boolean }
export type AccountTx = {
  id: string
  accountId: string
  occurredOn: string
  type: 'deposit' | 'withdrawal'
  amount: number
  note: string | null
}
export type AccountTxInput = Omit<AccountTx, 'id'>
export type Valuation = { id: string; accountId: string; asOf: string; value: number }
export type ValuationInput = Omit<Valuation, 'id'>

export type MonthTotal = { month: string; categoryId: string; total: number; count: number }

export type ReceiptItem = { id: string; name: string; amount: number }
export type ReceiptScan = {
  merchant: string
  date: string
  categoryId: string
  items: ReceiptItem[]
  extras: number
  total: number
}

export type QuickAddDraft = {
  amount: number
  description: string
  categoryId: string
  paymentMethodId: string | null
  date: string
  flagged: boolean
}

export type Budget = { id: string; categoryId: string | null; amount: number }
export type BudgetInput = { categoryId: string | null; amount: number }
