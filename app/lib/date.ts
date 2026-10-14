const KL_OFFSET_MS = 8 * 60 * 60 * 1000
const pad = (n: number) => String(n).padStart(2, '0')

const shifted = (d: Date | string | number) => new Date(new Date(d).getTime() + KL_OFFSET_MS)

export function klDate(d: Date | string | number = new Date()): string {
  const s = shifted(d)
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`
}

export function klTime(d: Date | string | number = new Date()): string {
  const s = shifted(d)
  return `${pad(s.getUTCHours())}:${pad(s.getUTCMinutes())}:${pad(s.getUTCSeconds())}`
}

export function greetingKL(now: Date = new Date()): string {
  const hour = Number(klTime(now).slice(0, 2))
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export const todayKL = (now: Date = new Date()) => klDate(now)

export const monthOf = (date: string) => `${date.slice(0, 7)}-01`

export const currentMonth = (now: Date = new Date()) => monthOf(klDate(now))

export function addMonths(month: string, n: number): string {
  const y = Number(month.slice(0, 4))
  const m = Number(month.slice(5, 7)) - 1 + n
  const d = new Date(Date.UTC(y, m, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`
}

export function monthEnd(month: string): string {
  const y = Number(month.slice(0, 4))
  const m = Number(month.slice(5, 7))
  return `${month.slice(0, 8)}${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}`
}

export const toKLIso = (date: string, time = '00:00:00') => `${date}T${time}+08:00`

export const nowKLIso = (now: Date = new Date()) => toKLIso(klDate(now), klTime(now))

export function monthRange(endMonth: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addMonths(endMonth, i - (count - 1)))
}

const monthLong = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const utcDate = (date: string) => new Date(`${date}T00:00:00Z`)

export const formatMonth = (month: string) => monthLong.format(utcDate(month))
export const monthName = (month: string) => new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(utcDate(month))
export const formatMonthShort = (month: string) =>
  `${MONTHS_SHORT[Number(month.slice(5, 7)) - 1]} ${month.slice(2, 4)}`

export function formatDay(date: string, today: string = todayKL()): string {
  if (date === today) return 'Today'
  const yesterday = klDate(utcDate(today).getTime() - 24 * 60 * 60 * 1000 - KL_OFFSET_MS)
  if (date === yesterday) return 'Yesterday'
  return date.slice(0, 4) === today.slice(0, 4) ? formatShortDate(date) : `${formatShortDate(date)} ${date.slice(0, 4)}`
}

export const formatShortDate = (date: string) =>
  `${Number(date.slice(8, 10))} ${MONTHS_SHORT[Number(date.slice(5, 7)) - 1]}`
