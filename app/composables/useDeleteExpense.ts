import { toast } from 'vue-sonner'
import type { Expense } from '~/types'

// Deletes one expense and refreshes every screen. Returns true when it worked.
export function useDeleteExpense() {
  const { remove } = useExpenses()
  return async function deleteExpense(expense: Expense): Promise<boolean> {
    try {
      await remove(expense.id)
      bumpData()
      toast.success('Expense deleted')
      return true
    } catch {
      toast.error('Could not delete. Try again.')
      return false
    }
  }
}
