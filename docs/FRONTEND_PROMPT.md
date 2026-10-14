You are building the FRONTEND of a personal finance PWA (expenses, savings, investments) in the existing Nuxt 4 project in this repo. It is mobile first, with a more detailed layout on laptop.

READ FIRST, in this order:
1. docs/SPEC.md. Sections 3 (Design), 5 (Pages and features), 7 (Quick add UI), 9 (PWA) are your scope. Section 4 (Database) only for the data shapes.
2. skills/frontend-design/skills.md. Follow it. If it conflicts with a default you would normally choose, it wins.
Do not read or build docs/SHEET_DATA.md, migrations, or the migration script. Another engineer builds those.

SCOPE
Build: layout shell (bottom nav under 1024px, sidebar at 1024px and up), design tokens, Home, Expenses, Savings (tabs: Savings, Investments), Plan, Login, the Add sheet with Quick add input, PWA manifest and offline state.
Do not build: SQL, Supabase setup, auth wiring, the /api/quick-add server route, or any Google Sheets code.

DATA LAYER (important)
The backend does not exist yet. Pages must never call Supabase or fetch directly. They only use composables in app/composables/ with the signatures below. Implement them now over an in-memory mock store seeded with realistic data (about 150 expenses across 12 months in Malaysian style: "Boost Juice", "grocery", "Dyson gift", amounts like 16.50 and 450.00; plan items from SPEC.md section 4 seed values). Keep the mock behind a runtimeConfig flag (public.useMock = true) so the real Supabase version can replace the file later with no page changes. Make the mock async with a short delay so loading skeletons and optimistic updates are really exercised, and add a way to force errors to test error states.

Types (all money is a number with 2 decimals, ids are strings):
  Category      { id, name, sort, archived }
  PaymentMethod { id, name, kind: 'cash'|'debit'|'credit_card'|'ewallet', archived }
  Expense       { id, spentAt (ISO string, +08:00), description, categoryId, paymentMethodId|null, amount, note|null, source }
  PlanItem      { id, groupKey, kind: 'income'|'deduction'|'fixed', label, amount, effectiveFrom, effectiveTo|null, sort }
  Settings      { epfRate, savingsGoal|null }
  Account       { id, name, kind: 'savings'|'investment', archived }
  AccountTx     { id, accountId, occurredOn, type: 'deposit'|'withdrawal', amount, note|null }
  Valuation     { id, accountId, asOf, value }
  MonthTotal    { month ('YYYY-MM-01'), categoryId, total, count }

Composables:
  useExpenses()    list(filters: {month?, categoryId?, paymentMethodId?, search?}), add(input), update(id, input), remove(id)
  useMonthTotals() totals(fromMonth, toMonth): MonthTotal[]
  usePlan()        itemsForMonth(month), change(groupKey, newAmount, fromMonth), add(input), end(groupKey, fromMonth)
  useSettings()    get(), update(partial)
  useAccounts()    accounts, transactions(accountId), valuations(accountId), add/update/remove for each
  useQuickAdd()    parse(text) returns { amount, description, categoryId, paymentMethodId|null, date, flagged: boolean } or throws
  useLookups()     categories, paymentMethods
All month and day logic uses the Asia/Kuala_Lumpur timezone, never the browser's. Compute "left to spend", net income and savings figures in one tested utility (app/lib/finance.ts) using the formulas in SPEC.md section 4 (Calculations).

DESIGN RULES (summary; the spec and the skill file are the authority)
- Use the colors, type scale, spacing scale (4, 8, 12, 16, 24, 32, 48 only), radius hierarchy, copy table and "Do not" list in SPEC.md section 3 exactly. Hanken Grotesk, tabular numbers, Phosphor icons at 20px, no shadows, no gradients, no emoji, no all-caps labels, no eyebrow labels, no identical card grids.
- One memorable element: the "Left to spend" hero. Everything else is rows with dividers on the page.
- Components: shadcn-vue only (Card, Button, Input, Label, Select, Calendar, Popover, Drawer, Dialog, AlertDialog, Table, Tabs, Badge, Skeleton, Sonner, DropdownMenu, Chart, Form). Forms use vee-validate with zod; if the zod adapter fails with the installed zod 4, use Standard Schema support or pin zod 3 and tell me.
- Desktop shows more detail, not only more space (see the responsive table in SPEC.md section 3). Add opens a Drawer on mobile, a Dialog on desktop. Keyboard shortcuts: n for Add, / for search.
- Optimistic updates with rollback and an error toast. Skeletons that match the real layout. Delete always confirms. Empty, error and offline states use the exact copy table.
- Light and dark mode via @nuxtjs/color-mode, following the system by default.

PROCESS
1. Before writing code, output a short design plan: the tokens as CSS variables, the layout concept for mobile and desktop, and anything in the spec you think is wrong or unclear. Then wait for my reply.
2. Build in this order, and stop after each step so I can review: (a) tokens, shell, navigation, mock data layer; (b) Expenses with the Add sheet and Quick add input; (c) Home with charts; (d) Savings and Investments; (e) Plan and settings; (f) PWA manifest, installability, offline state.
3. After each step: run the type check and `pnpm build`, and review the UI at 360, 768 and 1280 px wide in light and dark. Fix what is broken before you report.

RULES
- Do not invent features, pages or copy that are not in the spec. If something is ambiguous, ask me.
- If you deviate from the spec for any reason, say so in plain words at the top of your report, with the reason.
- Do not add dependencies other than: vee-validate and its zod adapter, @unovis/vue, @unovis/ts, and what shadcn-vue components pull in. Remove nuxt-auth-utils from the frontend code (it is being replaced by Supabase).
- Keep files small and named by what they do. No dead code, no TODO comments left behind, no comments that restate the code.
