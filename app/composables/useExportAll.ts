import { toast } from 'vue-sonner'
import { downloadCsv, toCsv } from '~/lib/csv'
import { klDate } from '~/lib/date'

export function useExportAll() {
  const planApi = usePlan()
  const accountsApi = useAccounts()
  const expensesApi = useExpenses()
  const lookups = useLookups()

  return async function exportAll() {
    try {
      const [expenses, txs, vals, items, accounts] = await Promise.all([
        expensesApi.list({}), accountsApi.transactions(), accountsApi.valuations(), planApi.all(), accountsApi.accounts(),
      ])
      const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id
      const sections = [
        ['Expenses', toCsv(['Date', 'Description', 'Category', 'Payment method', 'Amount', 'Note'], expenses.map((e) => [klDate(e.spentAt), e.description, lookups.categoryName(e.categoryId), lookups.methodName(e.paymentMethodId), e.amount.toFixed(2), e.note]))],
        ['Account transactions', toCsv(['Date', 'Account', 'Type', 'Amount', 'Note'], txs.map((t) => [t.occurredOn, accountName(t.accountId), t.type, t.amount.toFixed(2), t.note]))],
        ['Valuations', toCsv(['As of', 'Account', 'Value'], vals.map((v) => [v.asOf, accountName(v.accountId), v.value.toFixed(2)]))],
        ['Plan items', toCsv(['Kind', 'Label', 'Amount', 'From', 'To'], items.map((i) => [i.kind, i.label, i.amount.toFixed(2), i.effectiveFrom, i.effectiveTo]))],
      ]
      downloadCsv('wallet-wyse-export.csv', sections.map(([title, csv]) => `${title}\n${csv}`).join('\n\n'))
    } catch {
      toast.error('Could not export. Try again.')
    }
  }
}
