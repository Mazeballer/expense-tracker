import type {
  Account, AccountTx, ApiToken, AccountTxInput, Budget, BudgetInput, Category, Expense, ExpenseFilters, ExpenseInput,
  MonthTotal, PaymentMethod, PaymentMethodKind, PlanItem, PlanItemInput, Settings, Valuation, ValuationInput,
} from '../types'

export interface Backend {
  listExpenses(filters: ExpenseFilters): Promise<Expense[]>
  addExpense(input: ExpenseInput): Promise<Expense>
  updateExpense(id: string, input: ExpenseInput): Promise<Expense>
  removeExpense(id: string): Promise<void>
  monthTotals(fromMonth: string, toMonth: string): Promise<MonthTotal[]>

  planItems(): Promise<PlanItem[]>
  changePlanItem(groupKey: string, newAmount: number, fromMonth: string): Promise<void>
  renamePlanItem(groupKey: string, label: string): Promise<void>
  addPlanItem(input: PlanItemInput): Promise<PlanItem>
  endPlanItem(groupKey: string, fromMonth: string): Promise<void>

  listBudgets(): Promise<Budget[]>
  setBudget(input: BudgetInput): Promise<Budget>
  removeBudget(id: string): Promise<void>

  getSettings(): Promise<Settings>
  updateSettings(patch: Partial<Pick<Settings, 'savingsGoal'>>): Promise<Settings>
  changeEpfRate(rate: number, fromMonth: string): Promise<void>

  listCategories(): Promise<Category[]>
  addCategory(name: string, icon?: string): Promise<Category>
  updateCategory(id: string, patch: Partial<Pick<Category, 'name' | 'icon' | 'archived'>>): Promise<Category>
  listPaymentMethods(): Promise<PaymentMethod[]>
  addPaymentMethod(name: string, kind: PaymentMethodKind): Promise<PaymentMethod>
  updatePaymentMethod(id: string, patch: Partial<Pick<PaymentMethod, 'name' | 'kind' | 'archived'>>): Promise<PaymentMethod>

  listAccounts(): Promise<Account[]>
  addAccount(input: Omit<Account, 'id' | 'archived'>): Promise<Account>
  updateAccount(id: string, patch: Partial<Pick<Account, 'name' | 'icon' | 'archived'>>): Promise<Account>
  removeAccount(id: string): Promise<void>
  listTransactions(accountId?: string): Promise<AccountTx[]>
  addTransaction(input: AccountTxInput): Promise<AccountTx>
  updateTransaction(id: string, input: AccountTxInput): Promise<AccountTx>
  removeTransaction(id: string): Promise<void>
  listValuations(accountId?: string): Promise<Valuation[]>
  addValuation(input: ValuationInput): Promise<Valuation>
  updateValuation(id: string, input: ValuationInput): Promise<Valuation>
  removeValuation(id: string): Promise<void>

  listApiTokens(): Promise<ApiToken[]>
  addApiToken(label: string, tokenHash: string): Promise<ApiToken>
  removeApiToken(id: string): Promise<void>

  // The profile photo, as a small image data URL. Null when none is saved.
  getAvatar(): Promise<string | null>
  setAvatar(dataUrl: string): Promise<void>
  removeAvatar(): Promise<void>
}
