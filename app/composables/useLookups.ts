import type { Category, PaymentMethod } from '~/types'

export function useLookups() {
  const backend = useBackend()
  const categories = useState<Category[]>('lookups-categories', () => [])
  const paymentMethods = useState<PaymentMethod[]>('lookups-methods', () => [])
  const loaded = useState('lookups-loaded', () => false)

  async function load() {
    const [c, p] = await Promise.all([backend.listCategories(), backend.listPaymentMethods()])
    categories.value = c
    paymentMethods.value = p
    loaded.value = true
  }

  const categoryName = (id: string) => categories.value.find((c) => c.id === id)?.name ?? ''
  const categoryIcon = (id: string) => categories.value.find((c) => c.id === id)?.icon ?? '🧾'
  const categoryIndex = (id: string) => Math.max(0, categories.value.findIndex((c) => c.id === id))
  const methodName = (id: string | null) => paymentMethods.value.find((m) => m.id === id)?.name ?? ''

  return {
    categories, paymentMethods, loaded, load, categoryName, categoryIcon, categoryIndex, methodName,
    async addCategory(name: string, icon?: string) { await backend.addCategory(name, icon); await load() },
    async updateCategory(...args: Parameters<typeof backend.updateCategory>) { await backend.updateCategory(...args); await load() },
    async addPaymentMethod(...args: Parameters<typeof backend.addPaymentMethod>) { await backend.addPaymentMethod(...args); await load() },
    async updatePaymentMethod(...args: Parameters<typeof backend.updatePaymentMethod>) { await backend.updatePaymentMethod(...args); await load() },
  }
}
