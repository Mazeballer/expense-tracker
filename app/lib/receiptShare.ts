import type { ReceiptItem } from '../types'

export type ShareReading = { itemIds: string[]; splitBy: number; paidByOther: boolean }

const STOP = new Set(['and', 'the', 'only', 'just', 'my', 'mine', 'was', 'were', 'paid', 'pay', 'for', 'had', 'have', 'this', 'that', 'with', 'one', 'item', 'items', 'friend', 'she', 'he', 'they', 'split', 'half', 'all', 'everything'])

const tokens = (s: string) => (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).map((w) => (w.length > 3 ? w.replace(/s$/, '') : w))

export function readShare(items: ReceiptItem[], text: string): ShareReading {
  const t = text.toLowerCase()
  const paidByOther = !/\bi paid\b/.test(t) && (/\b(friend|he|she|they|someone|colleague|boss)\b[^.]*\b(paid|pays|treat|treated|shouted)\b/.test(t) || /\b(treated me|my treat|his treat|her treat)\b/.test(t))

  const splitMatch = t.match(/split\s*(?:in\s*|between\s*)?(\d+)|(\d+)\s*(?:ways|people)/)
  const splitBy = splitMatch ? Math.max(2, Number(splitMatch[1] ?? splitMatch[2])) : /\bhalf\b/.test(t) ? 2 : 1

  if (/\b(all|everything|whole)\b/.test(t)) return { itemIds: items.map((i) => i.id), splitBy, paidByOther }

  const wanted = new Set(tokens(t).filter((w) => w.length >= 3 && !STOP.has(w)))
  const itemIds = items.filter((i) => tokens(i.name).some((w) => w.length >= 3 && wanted.has(w))).map((i) => i.id)
  return { itemIds, splitBy, paidByOther }
}
