const money = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' })

export const formatMoney = (n: number) => money.format(n).replace(/\s/g, ' ')

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const formatPercent = (n: number) => `${Math.round(n * 100)}%`
