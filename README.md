# Wallet Wyse

Your wallet, but wise. A personal finance app for two people: log expenses, keep budgets, track savings and investments, and see what is left to spend this month. Built for Malaysia (RM, EPF, SOCSO, EIS), mobile first, installable as an app (PWA), with a more detailed layout on laptop.

## What it does

- **Log an expense** by typing a sentence ("12.50 lunch cc") or scanning a receipt. Choose Debit card or Credit card.
- **Home:** left to spend this month, spending trend, category breakdown, recent expenses.
- **Expenses:** every expense by month, with search, category filter and a Debit / Credit filter. A card shows how much your credit card needs paying this month and the last 6 months.
- **Budget:** an overall budget plus one per category, by month or by week. Turns orange near the limit and red when reached.
- **Savings:** savings and investment accounts, deposits, withdrawals, current value and gain.
- **Settings:** income, EPF and other deductions, fixed costs (changes can apply from this month or next, and past months keep their old numbers), savings goal, categories, Face ID and PIN lock, export all data.
- **Sign in with Google**, limited to an allowlist of emails you control.
- **Face ID or PIN lock** every time the installed app opens (home screen app only).

## Tech

Nuxt 4 (single page app), Vue 3, TypeScript, Tailwind CSS 4, shadcn-vue, Phosphor icons, vee-validate and zod, Supabase (Postgres, Google sign-in, row level security), Vercel for hosting. Package manager: pnpm.

## Run it locally

```bash
pnpm install
cp .env.example .env     # then fill in the two values below
pnpm dev                 # http://localhost:3000
```

`.env` needs two values from Supabase (Project Settings, API Keys):

```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_KEY=<publishable key>
GROQ_API_KEY=<free key from console.groq.com>   # for the AI features
```

Use the **publishable** key only. Never put the secret or `service_role` key in this project.

With no `.env`, or with `USE_MOCK=1`, the app runs on fake in-memory data. That is handy for working on the UI without a backend, but nothing is saved. A production build without the keys refuses to start, on purpose.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Run the production build locally |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests for money, date, budget and parsing maths |
| `pnpm test:db` | Runs the SQL migrations in a temporary Postgres and checks the security rules (every line must say PASS) |

## Set up the backend (first time)

1. Create a Supabase project, run the SQL, add allowed emails, turn on Google sign-in: follow [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).
2. Put the two values in `.env`.
3. Deploy: follow [`docs/DEPLOY.md`](docs/DEPLOY.md).

## How the code is organised

```
app/
  pages/          Screens (Home, Expenses, Budget, Savings, Settings, Login)
  components/
    app/          App components (cards, forms, sheets, lock screen)
    ui/           shadcn-vue building blocks
  composables/    One per feature (useExpenses, useBudgets, useAuth, ...). All data goes through useBackend()
  lib/
    backend.ts    The Backend interface (every read and write the app can do)
    supabase/     The real implementation (and the only place that knows column names)
    mock/         The fake implementation for local UI work
    *.ts          Pure functions: money, dates, budget and finance maths, parsing. No Vue, easy to test
  middleware/     Sign-in guard
  types/          Shared types
supabase/
  migrations/     The database, numbered, run in order
  tests/          Security and schema checks (pnpm test:db)
docs/             Spec, database, setup and deploy guides
```

Rules of thumb:

- Pages and components never call Supabase directly. They use composables, which use `useBackend()`.
- To add a feature that touches data: add it to the `Backend` interface, then to both `lib/supabase/backend.ts` and `lib/mock/store.ts`.
- Column names are `snake_case` in the database and `camelCase` in the app. The mapping lives only in `lib/supabase/backend.ts`.
- Change the database with a new numbered file in `supabase/migrations/`, not by clicking in the dashboard. Update `docs/DATABASE.md` too.
- Every table is locked to its owner with row level security. Keep it that way for any new table.

## Security

- Only emails in the `allowed_emails` table can create an account. Everyone else is blocked in the database and sent back to the login page.
- Every table has row level security (`user_id = auth.uid()`), so one person can never read the other's rows.
- The browser only ever holds the publishable key. Sensitive data never leaves Supabase.
- Responses carry a strict content security policy and other security headers (see `nuxt.config.ts`).
- Face ID uses the device's own passkey. The PIN is stored only as a salted hash on the device. Five wrong PINs sign you out.

## AI

Typing a sentence and scanning a receipt are read by AI through server routes in `server/api/` (Groq). Typed sentences use Groq. Receipt photos use Gemini when `GEMINI_API_KEY` is set (it reads small print better), otherwise Groq. Keys stay on the server. Answers are checked in `app/lib/aiParse.ts` before use, so the AI can never invent an amount. See `docs/DEPLOY.md`.

## Docs

| File | What is in it |
|---|---|
| [`docs/SPEC.md`](docs/SPEC.md) | The full product and design spec |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Every table, column and function |
| [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) | Supabase project, Google sign-in, allowlist |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Deploy to Vercel and what to check after |
| [`docs/APPLE_PAY.md`](docs/APPLE_PAY.md) | Log Apple Pay payments automatically |
| [`docs/SHEET_DATA.md`](docs/SHEET_DATA.md) | The old Google Sheet layout, for the data import |

## Known gaps

- Your old spreadsheet data is not imported yet.
- Credit card bills cannot be marked as paid yet, so "to pay" is the month's charges.
- Free Supabase projects have no backups. Use Settings, Export all data every month.
