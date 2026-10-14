import type { Expense } from '~/types'

export function useAddSheet() {
  const open = useState('add-sheet-open', () => false)
  const editing = useState<Expense | null>('add-sheet-editing', () => null)
  return {
    open,
    editing,
    show(expense: Expense | null = null) {
      editing.value = expense
      open.value = true
    },
    close() {
      open.value = false
    },
  }
}
