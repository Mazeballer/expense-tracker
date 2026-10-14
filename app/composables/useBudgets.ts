export function useBudgets() {
  const backend = useBackend()
  return { list: backend.listBudgets, set: backend.setBudget, remove: backend.removeBudget }
}
