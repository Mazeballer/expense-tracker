import { activeItems } from '~/lib/finance'

export function usePlan() {
  const backend = useBackend()
  return {
    all: backend.planItems,
    async itemsForMonth(month: string) {
      return activeItems(await backend.planItems(), month)
    },
    change: backend.changePlanItem,
    rename: backend.renamePlanItem,
    add: backend.addPlanItem,
    end: backend.endPlanItem,
  }
}
