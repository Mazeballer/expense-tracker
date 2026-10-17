import { todayKL } from '~/lib/date'
import { parseQuickAdd } from '~/lib/quickParse'
import type { QuickAddDraft } from '~/types'

export class NoAmountError extends Error {}

type AiExpense = Omit<QuickAddDraft, 'flagged'>

export function useQuickAdd() {
  const { categories, paymentMethods } = useLookups()
  const ai = useAi()
  const mock = useRuntimeConfig().public.useMock
  const read = (text: string): QuickAddDraft => parseQuickAdd(text, categories.value, paymentMethods.value, todayKL())

  return {
    // Instant, on the device. Used for the live preview while typing and as the backup if the AI is down.
    preview(text: string): QuickAddDraft | null {
      try {
        return read(text)
      } catch {
        return null
      }
    },
    // The AI reads the message (one or several purchases). If it cannot, this throws so the screen can say so.
    async parse(text: string): Promise<QuickAddDraft[]> {
      if (mock) return [read(text)]
      const { expenses } = await ai.post<{ expenses: AiExpense[] }>('/api/quick-add', {
        text,
        today: todayKL(),
        categories: categories.value.filter((c) => !c.archived).map((c) => ({ id: c.id, name: c.name })),
        methods: paymentMethods.value.filter((m) => !m.archived).map((m) => ({ id: m.id, kind: m.kind })),
      }, 15000)
      if (!expenses.length) throw new NoAmountError()
      return expenses.map((e) => ({ ...e, flagged: false }))
    },
  }
}
