import type { PaymentMethodKind } from '../types'

// Both cards get a visible pill so a row always says which card it was.
export const methodTone = (kind: PaymentMethodKind | undefined) =>
  kind === 'credit_card'
    ? { pill: 'bg-primary/10 text-primary', bar: 'bg-primary' }
    : { pill: 'bg-muted text-ink', bar: 'bg-primary' }
