import { toast } from 'vue-sonner'
import { klDate, monthName, monthOf, nowKLIso, todayKL, toKLIso } from '~/lib/date'
import type { ExpenseInput } from '~/types'

export function useLogExpense() {
  const { add, remove, list } = useExpenses()
  const lastMethod = useLocalStorage<string>('last-payment-method', '')

  return async function logExpense(input: Omit<ExpenseInput, 'spentAt'> & { date: string }): Promise<boolean> {
    const { date, ...rest } = input
    const spentAt = date === todayKL() ? nowKLIso() : toKLIso(date)
    const month = monthOf(klDate(spentAt))
    try {
      const firstOfMonth = (await list({ month })).length === 0
      const saved = await add({ ...rest, spentAt })
      if (rest.paymentMethodId) lastMethod.value = rest.paymentMethodId
      bumpData()
      toast.success('Expense added', {
        description: firstOfMonth ? `First expense of ${monthName(month)}.` : undefined,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await remove(saved.id)
              bumpData()
              toast.success('Expense deleted')
            } catch {
              toast.error('Could not undo. Delete it from the Expenses page.')
            }
          },
        },
      })
      return true
    } catch {
      toast.error('Could not save. Your changes are still here. Try again.')
      return false
    }
  }
}
