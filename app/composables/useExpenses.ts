export function useExpenses() {
  const backend = useBackend()
  return {
    list: backend.listExpenses,
    add: backend.addExpense,
    update: backend.updateExpense,
    remove: backend.removeExpense,
  }
}
