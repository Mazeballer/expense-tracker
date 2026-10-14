import { PhChartDonut, PhGearSix, PhHouse, PhReceipt, PhVault } from '@phosphor-icons/vue'

export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: PhHouse },
  { to: '/expenses', label: 'Expenses', icon: PhReceipt },
  { to: '/budget', label: 'Budget', icon: PhChartDonut },
  { to: '/savings', label: 'Savings', icon: PhVault },
  { to: '/settings', label: 'Settings', icon: PhGearSix },
] as const
