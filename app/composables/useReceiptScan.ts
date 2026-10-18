import { todayKL } from '~/lib/date'
import { receiptDataUrl } from '~/lib/image'
import type { ReceiptScan } from '~/types'

export class ReceiptScanUnavailable extends Error {}

export function useReceiptScan() {
  const { categories } = useLookups()
  const ai = useAi()
  const demo = useRuntimeConfig().public.useMock

  return {
    demo,
    async scan(photo: File): Promise<ReceiptScan> {
      if (!demo) {
        try {
          return await ai.post<ReceiptScan>('/api/receipt-scan', {
            image: await receiptDataUrl(photo),
            today: todayKL(),
            categories: categories.value.filter((c) => !c.archived).map((c) => ({ id: c.id, name: c.name })),
          }, 45000)
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode
          if (status === 503) throw new ReceiptScanUnavailable('Receipt reading is not set up')
          throw e
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1600))
      const food = categories.value.find((c) => c.name === 'Food & Drinks') ?? categories.value[0]!
      return {
        merchant: 'Starbucks',
        date: todayKL(),
        categoryId: food.id,
        items: [
          { id: 'i1', name: 'Iced Latte', amount: 14.5 },
          { id: 'i2', name: 'Americano', amount: 11 },
          { id: 'i3', name: 'Blueberry Muffin', amount: 9.5 },
          { id: 'i4', name: 'Chicken Sandwich', amount: 15 },
        ],
        extras: 3,
        total: 53,
      }
    },
  }
}
