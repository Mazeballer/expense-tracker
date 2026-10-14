import { addMonths, currentMonth } from '~/lib/date'

export function useAppliesFrom() {
  const choice = useLocalStorage<'current' | 'next'>('applies-from-choice', 'next')
  return {
    initial: () => (choice.value === 'current' ? currentMonth() : addMonths(currentMonth(), 1)),
    remember: (month: string) => { choice.value = month === currentMonth() ? 'current' : 'next' },
  }
}
