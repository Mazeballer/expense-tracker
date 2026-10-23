# Wallet Wyse: Database (Supabase)

Source of truth is `supabase/migrations/0001` to `0005` (run in order in the Supabase SQL editor). `pnpm test:db` checks them with PGlite (all lines must say PASS). Setup steps are in `docs/SUPABASE_SETUP.md`. This file lists every table and how the app uses it.

## Rules for every table

- Every table has `user_id uuid not null default auth.uid()` and **row level security** on, with one policy: `user_id = auth.uid()`. The app never sends `user_id`.
- Money is `numeric(12,2)` in RM. Dates the user thinks in (income month, deposit day) are `date`. Moments (an expense) are `timestamptz`, and "which month" is always computed in `Asia/Kuala_Lumpur`.
- Rows that point at another table use a composite foreign key `(x_id, user_id)`, so a row can never point at another user's row.
- Names in the app are camelCase (`spentAt`, `paymentMethodId`). Columns are snake_case. Map in the Supabase `Backend` implementation.

## Tables

### `allowed_emails`
Who may sign up. Only the owner edits it in the Supabase dashboard. No policies exist, so no app user can read it.

| column | type | notes |
|---|---|---|
| email | text PK | lowercase |

A trigger on `auth.users` rejects any sign-up whose email is not here (login page shows `?error=not-allowed`).

### `user_settings` (one row per user)
| column | type | notes |
|---|---|---|
| user_id | uuid PK | |
| savings_goal | numeric(12,2) | null = no goal |
| timezone | text | default `Asia/Kuala_Lumpur` |
| first_name | text | greeting and profile, max 40 |
| avatar_path | text | file path in the `avatars` bucket, null = no photo |

### `epf_rates`
EPF rate history. The rate for a month is the latest row with `effective_from <= that month`.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| effective_from | date | first day of a month |
| rate | numeric(5,4) | 0.11 = 11% |

Unique `(user_id, effective_from)`. Seed: `2000-01-01`, `0.11`. Change it with RPC `change_epf_rate`.

### `categories`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | 1 to 40, unique per user |
| icon | text | emoji |
| sort | int | |
| archived | boolean | hide, never delete (old expenses keep their category) |

Seed: Food & Drinks 🍜, Groceries 🛒, Transport 🚗, Shopping 🛍️, Entertainment 🎬, Health 💊, Others 🧾.

### `payment_methods`
Only two, so the app can show "credit card to pay".

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | unique per user |
| kind | text | `debit` or `credit_card` |
| sort | int | |
| archived | boolean | |

Seed: Debit card, Credit card. Imported history has no method (`expenses.payment_method_id` is null).

### `expenses`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| spent_at | timestamptz | |
| description | text | 1 to 200 |
| category_id | uuid | FK `(category_id, user_id)` |
| payment_method_id | uuid null | FK `(payment_method_id, user_id)`; null for imports or "someone else paid" |
| amount | numeric(12,2) | > 0 |
| note | text null | max 500 |
| source | text | `app`, `quick_add`, `receipt`, `telegram`, `import`, `apple_pay` |
| import_key | text null | for the xlsx import, unique per user so re-running never duplicates |
| created_at | timestamptz | |

Index `(user_id, spent_at desc)`.
Credit card to pay for a month = sum of `amount` for expenses in that month whose method has `kind = 'credit_card'`.

### `plan_items`
Income, deductions and fixed costs, versioned by month. All versions of one line share `group_key`.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| group_key | uuid | same for every version of one line |
| kind | text | `income`, `deduction`, `fixed` |
| label | text | 1 to 60 |
| amount | numeric(12,2) | >= 0 |
| effective_from | date | first of month |
| effective_to | date null | last day of a month, null = current |
| sort | int | |

Change or end a line with RPC `plan_item_change(group, amount, from)` and `plan_item_end(group, to)`, never by editing amounts in place (earlier months must keep their old amount).

### `accounts`
Savings and investment accounts.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | unique per user |
| icon | text | emoji |
| kind | text | `savings` or `investment` |
| sort | int | |
| archived | boolean | |

Seed: EPF Voluntary, ASB, Stocks/Unit Trust (investment); Emergency Fund, Others (savings).

### `account_transactions`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid | FK, cascade delete |
| occurred_on | date | |
| type | text | `deposit` or `withdrawal` |
| amount | numeric(12,2) | > 0 |
| note | text null | |

### `account_valuations`
Current value of an investment on a date (a savings balance is computed from transactions).

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid | FK, cascade delete |
| as_of | date | unique with account |
| value | numeric(14,2) | >= 0 |

### `budgets`
Spending limits per month. A week limit is the month limit split by days, so it is not stored.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| category_id | uuid null | null = overall monthly budget |
| amount | numeric(12,2) | > 0 |

Unique `(user_id, category_id)` with nulls treated as equal, so there is only one overall budget.

## View

`expense_monthly` (security invoker, so RLS applies): `user_id, month, category_id, total, count` per month and category in Malaysia time. Used by charts and category totals.

## Functions (RPC)

| function | does |
|---|---|
| `plan_item_change(p_group, p_amount, p_from)` | New amount from a month on, old months keep the old one |
| `plan_item_end(p_group, p_to)` | Ends a line after a month |
| `change_epf_rate(p_rate, p_from)` | New EPF rate from a month on |

## Triggers

- `enforce_allowlist` (before insert on `auth.users`): blocks emails not in `allowed_emails`.
- `handle_new_user` (after insert on `auth.users`): seeds `user_settings`, the EPF rate, categories, the two payment methods and the five accounts.

## Apple Pay auto-log (migration 0007)

- `api_tokens`: `id`, `user_id`, `label`, `token_hash` (SHA-256 of the token, unique), `created_at`, `last_used_at`. Locked to its owner by row level security. The token itself is never stored.
- `token_owner(token)`: internal helper that finds the owner of a token. Not callable from the browser.
- `apple_pay_context(token)`: returns the owner's categories and cards, or null for a wrong token. Callable without a login.
- `apple_pay_log(token, amount, description, category_id, payment_method_id)`: saves one expense with source `apple_pay` for the token's owner. The same payment twice within two minutes is saved once. Callable without a login.

## Storage

Private bucket `avatars`. The photo is always `<user_id>/avatar.jpg` (256 px square, replaced on each upload); a user can only read and write their own folder. The app downloads it once per visit and keeps a copy on the device so it shows instantly. The `user_settings.avatar_path` column is not used.

## Not stored (derived in the app)

Left to spend, EPF amount, week budgets, savings balance, gain, credit card to pay, trends. Compute from the tables above.

## Not in v1 (add later)

- **Credit card paid or unpaid:** a `card_payments` table (`payment_method_id`, `paid_on`, `amount`) so "to pay" can subtract what you already paid. Paying a bill is not an expense.
- **Budget history:** budgets have no per-month history today.
- **Receipt photos:** only the parsed result is kept, no image.
