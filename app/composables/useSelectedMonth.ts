import { currentMonth } from '~/lib/date'

export const useSelectedMonth = () => useState('selected-month', () => currentMonth())
