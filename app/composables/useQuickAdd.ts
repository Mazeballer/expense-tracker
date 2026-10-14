import { todayKL } from '~/lib/date'
import { parseQuickAdd } from '~/lib/quickParse'
import type { QuickAddDraft } from '~/types'

export function useQuickAdd() {
  const { categories, paymentMethods } = useLookups()
  const read = (text: string): QuickAddDraft => parseQuickAdd(text, categories.value, paymentMethods.value, todayKL())
  return {
    preview(text: string): QuickAddDraft | null {
      try {
        return read(text)
      } catch {
        return null
      }
    },
    async parse(text: string) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      return read(text)
    },
  }
}
