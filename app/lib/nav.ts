import { PhChartBar, PhGearSix, PhHouse, PhReceipt } from '@phosphor-icons/vue'

export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: PhHouse },
  { to: '/expenses', label: 'Expenses', icon: PhReceipt },
  { to: '/graph', label: 'Graph', icon: PhChartBar },
  { to: '/settings', label: 'Settings', icon: PhGearSix },
] as const
