import { z } from 'zod'

const money = (min: number) =>
  z
    .string()
    .trim()
    .min(1, 'Enter an amount')
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), 'Enter an amount with up to 2 decimals')
    .refine((v) => Number(v) >= min, min > 0 ? 'Enter an amount above 0' : 'Enter an amount of 0 or more')
    .refine((v) => Number(v) <= 100_000_000, 'Enter a smaller amount')

export const positiveAmount = money(0.01)
export const nonNegativeAmount = money(0)

export const expenseSchema = z.object({
  amount: positiveAmount,
  categoryId: z.string().min(1, 'Choose a category'),
  paymentMethodId: z.string().nullable(),
  description: z.string().trim().min(1, 'Enter a description').max(200, 'Use 200 characters or fewer'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  note: z.string().max(500, 'Use 500 characters or fewer'),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
