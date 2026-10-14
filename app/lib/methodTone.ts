import type { PaymentMethodKind } from '../types'

export const methodTone = (kind: PaymentMethodKind | undefined) =>
  kind === 'credit_card'
    ? { pill: 'bg-primary/10 text-primary', bar: 'bg-primary' }
    : { pill: 'bg-hover text-muted-foreground', bar: 'bg-primary' }
