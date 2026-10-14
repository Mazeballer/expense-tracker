export function useMonthTotals() {
  return { totals: useBackend().monthTotals }
}
