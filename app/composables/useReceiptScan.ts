import { todayKL } from '~/lib/date'
import { readShare, type ShareReading } from '~/lib/receiptShare'
import type { ReceiptItem, ReceiptScan } from '~/types'

export class ReceiptScanUnavailable extends Error {}

export function useReceiptScan() {
  const { categories } = useLookups()
  const demo = useRuntimeConfig().public.useMock

  return {
    demo,
    async scan(_photo: File): Promise<ReceiptScan> {
      if (!demo) throw new ReceiptScanUnavailable('Receipt reading is not connected yet')
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
    async readShare(items: ReceiptItem[], instruction: string): Promise<ShareReading> {
      return readShare(items, instruction)
    },
  }
}
