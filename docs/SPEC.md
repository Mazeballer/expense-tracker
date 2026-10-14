# Wallet Wyse: Build Spec (Supabase)

A personal finance PWA for two people (me and my girlfriend), each with their own private data. It tracks **expenses**, **savings** and **investments**, and answers: how much do we take home, how much is left to spend this month, how much have we saved, and what are our investments worth.

Mobile first, and a more detailed layout on laptop. Everything runs on free tiers.

Read first:
- `skills/frontend-design/skills.md` for design rules. Section 3 applies them to this product.
- `docs/SHEET_DATA.md` describes the **old Google Sheet**. It is used only by the migration script (section 8). The app never talks to Google Sheets.

Items marked **(verify)** are facts I could not test. Check them in the first build step.

---

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | Nuxt 4 (TypeScript, `app/` client, `server/` for the few server routes). Vercel Hobby. |
| UI | `shadcn-nuxt` (new-york), Tailwind CSS 4, Phosphor icons (`@phosphor-icons/vue`). |
| Database and auth | **Supabase** (free): Postgres, Google sign-in, row level security (RLS). Module: `@nuxtjs/supabase`. |
| Forms | `vee-validate` with zod (if the adapter does not support the installed zod 4, use Standard Schema support or pin zod 3). |
| Charts | shadcn-vue Chart (Unovis): `@unovis/vue`, `@unovis/ts`. |
| PWA | `@vite-pwa/nuxt`. Dark mode: `@nuxtjs/color-mode`. |
| Fonts | Self-hosted Hanken Grotesk through `@nuxt/fonts` (no request to Google at runtime). |
| AI quick add | Groq free tier through one server route (provider swappable, see section 7). |

**Remove** `nuxt-auth-utils` and `googleapis` from the scaffold. They are replaced by Supabase.

shadcn-vue components to use: Card, Button, Input, Label, Select, Calendar, Popover, Drawer, Dialog, AlertDialog, Table, Tabs, Badge, Skeleton, Sonner, DropdownMenu, Chart, Form.

### Free-tier facts **(verify on supabase.com/pricing and groq.com before relying on them)**
- Database 500 MB. This app needs about 1 MB a year, so size is never the limit.
- Projects pause after about 7 days without activity. Daily use prevents this.
- No downloadable point-in-time backups on free. The app has its own CSV export (section 5, Settings) and the team should run it monthly.

---

## 2. Architecture

```
Phone / laptop (PWA)
   |   Supabase JS client, user's own login token
   |   every query is filtered by RLS: user_id = auth.uid()
   v
Supabase                        (Postgres + Auth + RLS)
   tables: expenses, categories, plan_items, user_settings,
           accounts, account_transactions, account_valuations
   views:  monthly totals (RLS applies)

Phone ---> Nuxt server route /api/quick-add ---> Groq (free LLM)
           (verifies the user, holds the API key, returns a DRAFT only)
```

**Decisions and trade-offs**

1. **The browser talks to Supabase directly, protected by RLS.** Far less code than writing a server route for every action. The cost is that security depends entirely on the RLS policies being correct, so they are tested (section 4).
2. **Server routes only where a secret is needed.** `/api/quick-add` holds the Groq key. Nothing else needs a server.
3. **The data seam is composables.** Pages never call Supabase directly. They use `useExpenses()`, `usePlan()`, `useAccounts()` and so on in `app/composables/`. Swapping the backend later changes only those files.
4. **Aggregation happens in SQL views,** not in the browser, so the trend chart and category totals stay fast as the years grow.
5. **No server cache.** Supabase is fast enough at this size. Lists update optimistically on the client.
6. **The user ID is never sent by the client.** It is set by the database default `auth.uid()`, and RLS enforces it.

---

## 3. Design

Subject: a household finance tool for two people in Malaysia, used mostly on a phone to answer "can I afford this?", and on a laptop to review. It must feel calm, fast and trustworthy, not like a bank and not like a template.

### Tokens

**Color** (CSS variables in `app/assets/css/tailwind.css`; light and dark; map shadcn tokens `--background`, `--card`, `--primary` and so on to these)

Palette: **Apple Modern** (`#F5F5F7`, `#1D1D1F`, `#AAAAAA`, `#007AFF`), plus derived neutrals and accessible variants.

| Token | Light | Dark | Use |
|---|---|---|---|
| `ground` | `#F5F5F7` | `#1D1D1F` | Page background |
| `surface` | `#FFFFFF` | `#2A2A2D` | The hero, sheets, inputs, bottom nav |
| `ink` | `#1D1D1F` | `#F5F5F7` | Text |
| `muted` | `#6E6E73` | `#AAAAAA` | Secondary text and placeholders (`#AAAAAA` is too light for text on light backgrounds) |
| `line` | `#E5E5EA` | `#3A3A3C` | Dividers, borders, empty progress track |
| `accent` | `#007AFF` | `#0A84FF` | Graphics only: progress fill, chart bars, the add button |
| `accent-fill` | `#0066D6` | `#0A74E0` | Filled buttons and selected chips (white label, 4.5:1 or better) |
| `accent-text` | `#0066D6` | `#409CFF` | Links, active nav item, text-size accent |
| `soft` | `#E8F2FF` | `#16324F` | Badge and tag background |
| `good` | `#1F7A3A` | `#5FD97A` | Investment gains, savings progress |
| `alert` | `#D70015` | `#FF6961` | Overspent and errors only |

Why three blues: `#007AFF` with a white label is 4.0:1, under the 4.5:1 minimum for normal text. Use it only for shapes, and use `accent-fill` and `accent-text` wherever text is involved.

Category chart colors by category order, `--chart-1` to `--chart-6`, then repeat with lower opacity for more: light `#007AFF`, `#30B0C7`, `#5856D6`, `#FF9500`, `#FF2D55`, `#8E8E93`; dark `#0A84FF`, `#40CBE0`, `#7D7AFF`, `#FF9F0A`, `#FF375F`, `#98989D`. Map the shadcn tokens (`--background`, `--card`, `--primary` and so on) to these. Provide the full set in light and dark.

**Type**: one family, Hanken Grotesk (replace `nunito-sans` in `components.json`), weights 400, 500, 600. All numbers use `font-variant-numeric: tabular-nums`.

| Role | Size / line height | Weight |
|---|---|---|
| Hero amount | 44 / 48, tracking -0.02em (56 / 60 on desktop) | 600 |
| Title | 28 / 32 | 600 |
| Heading | 20 / 28 | 600 |
| Body | 16 / 24 | 400 |
| Secondary | 14 / 20 | 400 |
| Caption | 12 / 16 | 500 |

Currency: `Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' })`, e.g. "RM 1,763.17".

**Spacing**: one scale only, **4, 8, 12, 16, 24, 32, 48**. Page gutter 16 on mobile, 32 on desktop. Between page sections 32. Heading to content 12. List rows use dividers, no gaps. Rows are at least 56 high on mobile. Every tap target is at least 44 by 44.

**Radius** (a hierarchy, with pills as the signature shape): fully round (pill) for buttons, chips, segmented controls, progress tracks, badges and the add button; 24 for the hero and sheets; 12 for text inputs. No shadows. Separation comes from `line` borders and whitespace.

### Responsive layout (mobile first)

| Width | Navigation | Layout |
|---|---|---|
| under 1024 | Bottom nav (Home, Expenses, Budget, Savings, Settings), 64 high plus safe-area inset. Add button floats above it. | One column, max width 560 centered on tablets. Add opens a Drawer. |
| 1024 and up | Left sidebar, 240 wide: the four pages, the Add button at the top, theme toggle and account at the bottom. No bottom nav. | 12-column grid, content max width 1120. Add opens a Dialog. |

Desktop shows **more detail**, not just more space:

- **Home:** hero and vs-last-month on the left (5 columns); trend chart on the right (7). Below: the category donut next to a category table (name, amount, share of month, change vs last month), then recent expenses (10 instead of 5), and a savings and investments summary.
- **Expenses:** a full Table (Date, Description, Category, Amount, row actions) with the filter bar above and a month summary (total, count, top category) beside the table. Row selection is not needed.
- **Savings:** accounts as a table (name, kind, contributed, current value, gain), the log beside it.
- **Keyboard:** `n` opens Add, `/` focuses search. Visible focus rings everywhere.
- **Export:** "Export CSV" on the Expenses page, desktop only (hidden on mobile). The month label is centered between its arrows on mobile.

```
Mobile Home                          Desktop Home
+------------------------+           +------+-----------------------------------------+
| <  October 2026  >     |           | Home | October 2026                            |
| Left to spend          |           | ...  | Left to spend         ( trend chart )   |
| RM 1,763.17            |           |      | RM 1,763.17                              |
| [=====-----------]     |           | [Add]| [=====------]                            |
| RM 791.73 of RM 2,554  |           |      | donut | category table                   |
| [Trend | Categories]   |           |      | Recent expenses (10)                     |
| ( chart )              |           |      | Savings and investments summary          |
| Recent expenses        |           +------+-----------------------------------------+
+------------------------+
| Home Expenses Savings Plan |
+------------------------+
```

### Principles

1. **One memorable element**: the hero "Left to spend" amount with a thin progress line (spent against available). It is the only filled surface. Everything else sits on the page, separated by whitespace and dividers.
2. **No grid of identical cards.** Lists are rows with dividers. Card is used only for the hero and groups where a boundary carries meaning.
3. **Color means something.** `accent` blue marks actions and progress. `good` marks gains. `alert` appears only when overspent or on errors.
4. **Motion answers actions** (drawer opens, row removed, toast). No entrance animations. Respect `prefers-reduced-motion`.
5. **Quality floor:** works down to 360 px wide, AA contrast in light and dark, keyboard accessible, `color-mode` follows the system.

### Personality

The look is calm and Apple-clean. The personality comes from shape, voice and a few useful details, not decoration.

1. **Pill shapes** everywhere controls appear (see Radius). The progress track under the hero is a thick pill.
2. **One motion moment:** on the first load of a session, the hero amount counts up from RM 0.00 and the progress pill fills (about 900 ms, ease-out). Nothing else animates on load. Skip it with `prefers-reduced-motion`.
3. **Voice:** short, warm, plain. Say what happened and what to do next. No jokes, no exclamation marks, no emoji.
4. **Small moments that acknowledge progress** (toast, shown once each): "You passed 50% of your savings goal." and "First expense of November."
5. **Greeting** by time of day (morning until 12:00, afternoon until 18:00, evening after), in Malaysia time.

### Do not

- No gradients, glass blur, glow or drop shadows, with two exceptions: the "Left to spend" hero (blue gradient with faint concentric rings; red when overspent) and the floating bottom nav (translucent with blur). The trend chart is a clean smooth blue line with a ring marker on the selected month and no y-axis labels or gridlines, drawn as a small custom SVG component (not bars). Dragging a finger across it moves the marker and updates the amount shown above it.
- No all-caps labels, eyebrow labels above headings, or numbered markers.
- No emoji in the UI, except the user-chosen category and account icons. No middle-dot strings, spaced em dashes, or "→" in buttons.
- No icon-in-colored-circle decoration. Icons are 20 px, regular weight, same color as the text.
- No stock illustration or mascot for empty states. Text and one action.
- No cream-and-terracotta, black-and-neon, or newspaper-column looks.

### Copy

Sentence case, plain verbs, one name per action across the whole flow. Errors never apologize and say what to do next.

| Moment | Copy |
|---|---|
| Buttons | "Add expense", "Save changes", "Delete expense", "Add deposit" |
| Success toast | "Expense added", "Changes saved", "Expense deleted" |
| Delete confirm | Title "Delete this expense?" Body "Boost Juice, RM 16.50 on 3 Oct will be removed." Buttons "Delete expense", "Cancel" |
| Empty list | "No expenses this month. Add one to start." with "Add expense" |
| No search match | "No expenses match "milk". Try a different word." |
| Load error | "Could not load your expenses. Check your connection and try again." with "Try again" |
| Save error | "Could not save. Your changes are still here. Try again." |
| Offline | "You're offline. Reconnect to see and save expenses." |
| Overspent | "RM 120.00 over for October" |
| Goal milestone toast | "You passed 50% of your savings goal." |
| Wrong account | "This Google account does not have access. Sign in with a different account." |
| Quick add placeholder | "Type an expense, e.g. 12.50 lunch" |
| Quick add check | "Check the details, then save." |
| Quick add failure | "Could not read that. Fill in the form instead." |

### UX behavior

- Amount fields use `inputmode="decimal"`, focused when the form opens.
- Category on the Add form is a row of tappable chips (one tap).
- Lists update **optimistically**. On failure, roll back and show the error toast.
- Skeletons match the real layout. No spinners for page loads.
- Deleting always asks for confirmation. Adding and editing never do.
- Save buttons disable while saving, and each submit sends one request.

---

## 4. Database

All SQL lives in `supabase/migrations/` as numbered files (e.g. `0001_schema.sql`), run in order in the Supabase SQL editor (no CLI required). Every table has a `user_id` and the same RLS policy.

### Conventions

- `id uuid primary key default gen_random_uuid()`.
- `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`. The client never sends it.
- Money is `numeric(12,2)`. Timestamps are `timestamptz`. Business dates are `date`.
- All "which month is this" logic uses `Asia/Kuala_Lumpur`.

### Tables

```sql
-- Who may sign up
create table public.allowed_emails (email text primary key);
alter table public.allowed_emails enable row level security;   -- no policies: nobody can read it

create table public.user_settings (
  user_id      uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  savings_goal numeric(12,2) check (savings_goal >= 0),     -- total target
  timezone     text not null default 'Asia/Kuala_Lumpur'
);

-- EPF rate history: the rate for a month is the latest row with effective_from <= that month
create table public.epf_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  effective_from date not null,
  rate numeric(5,4) not null check (rate between 0 and 1),
  unique (user_id, effective_from)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  icon text not null default '🧾',
  sort int not null default 0,
  archived boolean not null default false,
  unique (user_id, name)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  kind text not null check (kind in ('cash','debit','credit_card','ewallet')),
  sort int not null default 0,
  archived boolean not null default false,
  unique (user_id, name),
  unique (id, user_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  spent_at timestamptz not null,
  description text not null check (length(description) between 1 and 200),
  category_id uuid not null references public.categories(id),
  payment_method_id uuid references public.payment_methods(id),   -- null for imported history
  amount numeric(12,2) not null check (amount > 0),
  note text,
  source text not null default 'app' check (source in ('app','quick_add','receipt','telegram','import')),
  import_key text,                                          -- for idempotent migration
  created_at timestamptz not null default now(),
  unique (user_id, import_key)
);
create index expenses_user_spent_idx on public.expenses (user_id, spent_at desc);

-- Income, deductions and fixed monthly costs, versioned so history stays correct
create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  group_key uuid not null default gen_random_uuid(),        -- same value across versions of one line
  kind text not null check (kind in ('income','deduction','fixed')),
  label text not null check (length(label) between 1 and 60),
  amount numeric(12,2) not null check (amount >= 0),
  effective_from date not null,                             -- first day of the month it starts
  effective_to date,                                        -- last day it applies; null = current
  sort int not null default 0
);

-- Spending limits. category_id null = the overall monthly budget. One row per category per user.
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid,
  amount numeric(12,2) not null check (amount > 0),
  unique nulls not distinct (user_id, category_id),
  foreign key (category_id, user_id) references public.categories (id, user_id)
);

-- Savings and investment accounts
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  icon text not null default '🏦',
  kind text not null check (kind in ('savings','investment')),
  sort int not null default 0,
  archived boolean not null default false,
  unique (user_id, name)
);

create table public.account_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  occurred_on date not null,
  type text not null check (type in ('deposit','withdrawal')),
  amount numeric(12,2) not null check (amount > 0),
  note text
);
create index acct_tx_idx on public.account_transactions (user_id, account_id, occurred_on desc);

-- Manual "what is it worth now" snapshots, for investments
create table public.account_valuations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  as_of date not null,
  value numeric(14,2) not null check (value >= 0),
  unique (account_id, as_of)
);
```

### Security (RLS)

Applied to **every** table except `allowed_emails`:

```sql
alter table public.<t> enable row level security;
create policy "own rows" on public.<t> for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
```

Rows that reference another table (`expenses.category_id`, `expenses.payment_method_id`, `account_transactions.account_id`, `account_valuations.account_id`) must only point at the same user's rows. Enforce with a composite foreign key `(category_id, user_id)` referencing `categories (id, user_id)` (add `unique (id, user_id)` on the parent), or with a check trigger.

### Allowlist and first-login seeding

- A `before insert` trigger on `auth.users` raises an exception unless the email (lowercased) is in `allowed_emails`. Insert the two emails by hand. **(verify: creating triggers on `auth.users` works from the SQL editor; if it does not, use a Supabase "Before User Created" auth hook instead.)**
- An `after insert` trigger on `auth.users` (security definer, empty `search_path`) seeds, for the new user:
  - `user_settings` row.
  - Categories: Food & Drinks, Groceries, Transport, Shopping, Entertainment, Health, Others.
  - Payment methods: Cash (cash), Debit card (debit), Credit card (credit_card), E-wallet (ewallet).
  - Accounts: EPF Voluntary (investment), ASB (investment), Stocks/Unit Trust (investment), Emergency Fund (savings), Others (savings).

### Views (aggregation in SQL)

All with `with (security_invoker = true)` so RLS still applies **(verify, needs Postgres 15 or later; Supabase projects are)**:

```sql
create view public.expense_monthly with (security_invoker = true) as
select user_id,
       date_trunc('month', spent_at at time zone 'Asia/Kuala_Lumpur')::date as month,
       category_id,
       sum(amount) as total,
       count(*)    as count
from public.expenses
group by 1, 2, 3;
```

The app derives month totals, the 12-month trend and the category breakdown from this view. Other numbers come from plain queries.

### Calculations

```
For month M, the active plan items are those where
  effective_from <= end_of(M) and (effective_to is null or effective_to >= start_of(M))

gross      = sum(active income)
epf        = gross * epf_rates.rate (latest row with effective_from <= M)
deductions = epf + sum(active deduction)
net        = gross - deductions
afterFixed = net - sum(active fixed)
leftToSpend(M) = afterFixed - expense_monthly total for M
```

**Changing a plan amount** (e.g. a raise) runs one database function, `plan_item_change(group, new_amount, from_month)`: it sets `effective_to` on the current version to the day before `from_month` and inserts the new version. Past months keep old numbers. The edit form asks "Applies from" with only the current month and next month, defaulting to next month or the user's last choice.

**Savings and investments**
```
contributed(account) = sum(deposits) - sum(withdrawals)
value(account)       = latest valuation, or contributed if no valuation exists
gain(account)        = value - contributed        (investments only; show only when a valuation exists)
total saved          = sum(value over all accounts)
goal progress        = total saved / savings_goal
```

The EPF rate is versioned the same way: changing it asks "Applies from" (default the current month) and earlier months keep their rate.

### Tests (run before building UI)

Create the two real users, then verify in the SQL editor or a script:
1. User A cannot select, update or delete any of user B's rows in any table.
2. Inserting a row with another `user_id` is rejected.
3. Inserting an expense with a category owned by the other user is rejected.
4. A third Google account cannot sign up.
5. Views return only the caller's rows.

---

## 5. Pages and features

| Route | Label | Purpose |
|---|---|---|
| `/` | Home | Left to spend, trend, categories, recent expenses, savings summary. |
| `/expenses` | Expenses | Full list with filters. Edit, delete. Export CSV desktop only. |
| `/budget` | Budget | Overall monthly budget and optional category budgets, with month and week views. |
| `/savings` | Savings | Tabs: *Savings* and *Investments*. Goal, accounts, transactions, valuations. |
| `/settings` | Settings | A short grouped list that opens sub-pages (see Settings below). |
| `/settings/income`, `/settings/goals`, `/settings/categories`, `/settings/payment-methods` | (sub-pages) | One topic each, with a back link "Settings". |
| `/login` | none | Google sign-in. No nav. |

### Home
1. **Profile header** at the top: a round profile photo the user uploads (tap to change; initial letter if none), a small time-of-day greeting ("Good evening,") with the first name below it, and nothing on the right (theme, sign out and Remove photo live in Settings). Each of the two users has their own photo. Photos are cropped to a square and resized to 256 px in the browser. Mock mode keeps the photo in the browser. With Supabase, store it in a private Storage bucket `avatars` (free tier) under the user's id, with a policy that lets a user read and write only their own file.
2. **Left to spend** for the selected month (the hero) with spent-against-available progress. No daily-allowance or pace text.
3. **Month switcher** with previous and next arrows; year always shown.
4. **vs last month** one-liner, e.g. "RM 120.50 less than September".
5. **Charts** in Tabs: *Trend* (bar, rolling 12 months, labels like "Oct 26") and *Categories* (donut for the selected month). Desktop shows both side by side.
6. **Recent expenses**: 5 on mobile, 10 on desktop, with "See all".
7. **Savings summary**: total saved, percent of goal.

### Expenses
- Filters: month and year (default current), category, search over the description. Newest first, grouped under day headings ("Today", "Yesterday", "3 Oct").
- Tap a row (mobile) or click a row (desktop) to edit. Delete from the row's DropdownMenu, confirmed with an AlertDialog.
- Add and edit form: amount, category, **payment method** (chips, remembers the last one used, defaults to the first), description, date (Calendar in a Popover, defaults to today), optional note. Validated with Form (vee-validate and zod).
- Payment method is only Debit card or Credit card. The Expenses page shows "Credit card to pay" (credit spend for the month), a debit vs credit split, and credit spend for the last 6 months, with an All, Debit, Credit filter. Rows show the method as a small Badge when set. Imported history has no method and shows none.
- The only way to add is text (section 7): a text line with a live preview, one-tap save, and receipt scan. The form is for editing only.

### Savings page
- **Savings tab:** accounts of kind `savings` (balance, contributed), deposits and withdrawals log, add/edit/delete.
- **Investments tab:** accounts of kind `investment` (contributed, current value, gain and percent). "Update value" adds a valuation. A small line chart of value over time per account once there are two or more valuations.
- Goal progress (total saved against the goal, remaining) sits above both tabs.
- Accounts can be added, renamed and archived.

### Budget page
- **Purpose:** a spending limit the user sets, separate from "Left to spend" (which comes from income and fixed costs). Budgets are limits per month; amounts are `numeric(12,2)`.
- **Overall monthly budget:** one amount, optional. **Category budgets:** optional, one per category, independent of the overall one. A user can have only an overall budget, only category budgets, or both.
- **Month and Week views** (Tabs): the month switcher stays at the top.
  - **Month:** overall card (amount left or over, progress pill, "RM 292.00 of RM 1,500.00 spent") and a row per category budget (name, left or over, progress pill, "RM 124.00 of RM 500.00"). Rows with no budget are summed in one line: "RM 45.00 spent in categories without a budget."
  - **Week:** a strip of vertical pill bars, one per week (days 1 to 7, 8 to 14, 15 to 21, 22 to 28, 29 to month end). Each bar fills from the bottom with that week's share of its weekly limit, colored blue, orange or red like the other bars; weeks that have not started are empty and dim; the selected week has a soft blue highlight; a dot marks the current week, which is selected by default. Tapping a bar selects the week. The date range ("1 Oct to 7 Oct") is written below, with no other explanation. A week's limit is the monthly amount times the days in that week divided by the days in the month. The overall card and category rows show the same figures for that week.
- **Bar colors:** blue (`accent`) below 80% of the limit; orange (`warn`) from 80% up to the limit ("close to budget"); red (`alert`) once the limit is reached or passed. At exactly the limit the text says "Budget reached"; beyond it, "RM 18.55 over". `warn` is `#FF9500` for shapes and `#B45F00` for text in light mode (`#FF9F0A` and `#FFB340` in dark).
- **States:** If category budgets add up to more than the overall budget: "Your category budgets add up to RM 200.00 more than your monthly budget." Empty state: "No budget set. Set a monthly budget to see how much is left." with "Set budget".
- **Editing happens in the Month view only.** Weekly limits are derived from the monthly amounts, so the Week view has no Edit button, no "Add category budget" button, and its rows are not tappable.
- **Editing:** a bottom sheet with an amount field and "Save budget"; when adding, chips choose "Overall" or a category without a budget; when editing, "Remove budget". Toasts: "Budget saved", "Budget removed".
- Budgets have no history in v1: the current limits apply to every month shown.

### Icons
- **Categories and accounts have an emoji icon** (`icon` column). Seeded categories get defaults (Food 🍜, Groceries 🛒, Transport 🚗, Shopping 🛍️, Entertainment 🎬, Health 💊, Others 🧾); the user picks an icon from a grid of 18 when adding or editing a category (Settings) or an account (Savings, Add account).
- Icons show in a round grey circle on Budget category rows, Savings account rows, the Settings category list, the Quick add preview and expense rows. **An expense always shows its category's icon**, so changing a category's icon changes every expense in it.
- **Savings deposits and withdrawals use a fixed icon** (💰 deposit, 💸 withdrawal); they are not user-selectable.

### Settings
Settings is a short iOS-style grouped list that fits one phone screen. Each row opens its own sub-page, so no screen is a long scroll.
- **Profile card** at the top: round photo (tap to add or change), first name, "Add photo" or "Change photo", and "Remove" when a photo exists.
- **Money:** *Income and costs* (value: amount available for spending) opens `/settings/income` with income, deductions and fixed costs plus a summary (the old Plan content). Changing an amount or the EPF rate asks "Applies from", limited to the current month and next month, defaulting to next month (or the user's last choice). *Savings goal* (value: the goal) opens `/settings/goals`. The EPF rate is changed from the EPF row on the income page (menu, Change rate) and has its own history: it asks "Applies from".
- **Organize:** *Categories* (value: count) opens `/settings/categories` (add, rename, change icon, archive). *Payment methods* (value: count) opens `/settings/payment-methods`.
- **App:** *Appearance* is an inline Auto, Light, Dark control. *Export all data* downloads the CSV.
- **Sign out** in its own group, in the `alert` color.
- Sub-pages show a blue back link ("Settings") above a large title. The bottom nav keeps Settings highlighted on every sub-page. The month switcher is not shown; income and costs always apply from the current month.
- Desktop: the list is capped at about 576 px wide; the income sub-page keeps its two-column layout.

---

## 6. Auth and security

- Google sign-in through Supabase Auth (`@nuxtjs/supabase`). Configure the Google provider in the Supabase dashboard with a Google Cloud OAuth client. The redirect URL is the Supabase callback; add the Vercel domain and `http://localhost:3000` to Supabase's allowed redirect URLs.
- Only two emails can ever sign up (section 4). Anyone else sees the wrong-account message.
- A route middleware redirects signed-out users to `/login` and signed-in users away from it (module `redirectOptions`: login `/login`, callback `/confirm`, exclude `/login`).
- **Never use the secret (service role) key in the browser or in app routes.** It is used only by the migration script on the developer's machine.
- Server routes verify the user with `serverSupabaseUser(event)` before doing anything.
- All form input is validated with zod before sending (amounts positive and finite, dates valid, strings with max lengths). The database constraints in section 4 are the second line of defense.
- Never log keys. Never commit `.env`.
- **The login page is a page on its own:** no bottom nav, no add button, no sidebar. The app picks the layout from the address (`/login` has none), not from page settings, so a leftover layout can never show on it. After a successful sign-in the user goes straight to Home. Data (categories and so on) loads only once signed in.
- **App lock (installed app only):** an optional extra lock for the home-screen app. It does nothing in a normal browser tab, where Google sign-in is the only gate.
  - Turned on in Settings, App lock: choose a 4-digit PIN (entered twice), then, if the phone supports it, Face ID is set up with a platform passkey (WebAuthn, `userVerification: required`, `authenticatorAttachment: platform`).
  - Every time the app opens, and every time it returns from the background, a full-screen lock appears. It tries Face ID first (also a button) and always offers the PIN pad.
  - The PIN is stored only as a salted PBKDF2 hash on the device. 5 wrong PINs sign the user out and clear the lock.
  - Opening the camera or photo picker does not trigger a lock (a 60-second grace period).
  - Settings, App lock offers: Face ID on or off, Change PIN, Turn off app lock. Signing out clears the lock on that device.
  - **This is a screen lock, not encryption.** It stops someone who picks up an unlocked phone. The Supabase session on the device is unchanged. **(verify on a real iPhone: WebAuthn in a home-screen app)**
- **Login screen (`/login`, no nav):** the app mark (a rounded blue square with a wallet), the name "Wallet Wyse", one line ("Your wallet, but wise."), and at the bottom a full-width "Continue with Google" button (surface color, Google "G") with "Only approved accounts can sign in." under it. Signing in shows "Signing in" on the button. If Supabase rejects the account, the user returns to `/login?error=not-allowed` and "This Google account does not have access. Sign in with a different account." appears above the button. Sign out is a button in Settings (and the laptop sidebar) that ends the session and returns to `/login`. In mock mode the session is a flag in local storage; with Supabase it is the Supabase session (`useAuth()` is the one file to change).

### Env vars

```
SUPABASE_URL
SUPABASE_KEY              publishable (anon) key, safe in the browser
GROQ_API_KEY              server only (quick add)
SUPABASE_SERVICE_KEY      NOT in Vercel. Local .env only, for the migration script
```

---

## 7. Logging by typing (the only way to add), with receipt scanning

**Goal:** logging is writing one line of text, like `12.50 lunch cc`, `grab 8.40` or `coffee 6 yesterday`. There is no add form. Existing expenses are edited with a form (tap a row).

**The Add sheet (opens from the Add button and the `n` key)**
1. Opens on a large text field, focused, with no example chips and no extra options except **Scan receipt**.
2. As the user types, a preview row shows how the text was understood: emoji, description, category, payment method, day, amount. If no amount is found: "Add an amount, for example 12.50 lunch."
3. Enter or the full-width "Add expense" button saves in one step and closes the sheet. The toast says "Expense added" with an **Undo** action that deletes the expense. The first expense of a month adds "First expense of November."
4. Amounts of RM 1,000 or more show "Check the amount. This is RM 2,130.00." and still save on confirm.
5. Parsing rules: a number is the amount; a trailing word (`cash`, `cc`, `card`, `debit`, `tng`, `ewallet`) sets the payment method (otherwise the last method used); `yesterday` or `today` sets the date; keywords pick the category (otherwise Others); the remaining words are the description.

**Receipt scanning**
1. **Scan receipt** opens the phone camera (`accept="image/*" capture="environment"`; a file picker on desktop).
2. **Reading:** the sheet shows the photo and "Reading your receipt" with a progress bar.
3. **Review screen** (title "Receipt"): a thumbnail, merchant, date and receipt total, then:
   - **Which items are yours?** Every line item is a tappable row with a checkbox (all ticked at first), plus Select all or Clear all.
   - **Tell me what is yours:** a text field with an Apply button. The user can write "only the latte, my friend paid", "all of it" or "split 3". Apply ticks the matching items, sets who paid, and sets the split. If nothing matches: "I could not match that to an item. Tick the items yourself."
   - **Who paid the bill?** Two choices, "I paid" and "Someone else paid". If someone else paid, the expense is saved with no payment method, and the screen says so.
   - **Include my share of tax and service:** a checkbox. The user's share of tax and service is proportional to their share of the item subtotal.
   - **Your share:** the amount that will be recorded, with a short explanation (items count, tax and service included, split).
   - A sticky footer with **Add RM 15.37** and "Take another photo".
4. **Saved record:** the amount is the user's share only. Description is the merchant (all items) or "Merchant, item, item and 2 more". Source is `receipt`. The note keeps the receipt total, who paid, the split and the item names, so the full bill is not lost.
5. **Failure:** "Could not read that receipt. Try a clearer photo." with "Take another photo" and "Type it instead".
6. Receipt photos are never stored in v1.

```
share        = sum(ticked items) + (tax and service * ticked subtotal / all-items subtotal, if included)
recorded     = share / splitBy
```

**What is real today:** the review screen, item selection, sharing maths, who-paid handling and saving all work. The receipt reading itself is a demo that returns a fixed Starbucks receipt and says "Demo receipt. Receipt reading is not connected yet." The "Tell me what is yours" text is read by a local keyword matcher. Both are replaced by AI later.

**AI integration (later)**
- `useQuickAdd().parse(text)` calls a server route `POST /api/quick-add`, which verifies the user, asks a free model for `{ amount, description, category, date, paymentMethod }` using the user's category names and today's date in Malaysia time, validates the output with zod, and **cross-checks that the returned amount equals a number that appears in the user's text** (prevents the "21.30 became RM2130" bug). The local parser still gives the live preview and the AI result replaces it when it arrives; if the AI fails the local parser is used.
- `useReceiptScan().scan(file)` calls `POST /api/receipt-scan`, which sends the photo to a free vision-capable model and returns the `ReceiptScan` shape (merchant, date, category, items, tax and service, total). The server checks that the items plus extras add up to the total (within RM 0.05) and flags the receipt if not.
- `useReceiptScan().readShare(items, text)` calls the same model with the item list and the user's sentence and returns `{ itemIds, splitBy, paidByOther }`.
- Provider swappable behind these functions. Groq free tier is the default candidate **(verify current limits and model names)**. Limit each user's calls per minute.

Out of scope for v1: several expenses in one message, questions about the data ("how much on food this month?"), storing receipt photos.

---

## 8. Migration from Google Sheets

A one-off Node script, `scripts/migrate-from-xlsx.ts`, run locally with the service key. It reads the downloaded `ExpenseTracker.xlsx` (use the `xlsx` or `exceljs` package, dev dependency only).

**Per person** (run once for each file, after that person has signed in once so their user exists):

1. Take the email as an argument and look up their `user_id` in `auth.users`.
2. **Log tab** (header row 4, data from row 5, see `docs/SHEET_DATA.md`) to `expenses`:
   - `spent_at`: the cell date interpreted as Malaysia time (`+08:00`). Cells at exactly 00:00 stay at 00:00.
   - `description` from Description. `amount` from Amount. `category_id` by matching Category name.
   - `note` from Notes. `source` is `telegram` when Notes is "via Telegram bot", else `import`.
   - `import_key = <ISO timestamp>|<description>|<amount>` so re-running never duplicates.
   - Skip and report rows with a missing date, missing amount, amount <= 0 or an unknown category. Print a summary: imported, skipped, with row numbers.
   - Flag suspicious amounts for review (for example any single amount over RM 1,000) in the report. Do not change them.
3. **Overview tab** to `plan_items` (effective from the first day of the earliest expense month) and one `epf_rates` row: income (Base Salary, Allowance), deductions (SOCSO, EIS, Employee SKBBK), fixed costs (the eight lines). Skip computed rows. Label cells have stray whitespace, so trim them.
4. **Savings tab**: set `savings_goal` from the goal cell. The log is empty today. If it has rows, import them as deposits into the matching account.
5. `BotLog` and the other tabs are ignored.

**Verification** (the script prints these; compare with the sheet):
- Row count in `expenses` equals the Log row count minus skipped rows.
- Sum of amounts matches the sheet's `Dashboard` "Total Spent".
- Per-month totals match the sheet's `Monthly` tab for 2026.

**Cutover**
1. Back up `ExpenseTracker.xlsx` (copy the file and keep the Google Sheet).
2. Import and verify while the bot is still running.
3. Use the app for a few days. Re-run the import before cutover to pick up rows the bot added (idempotent).
4. Stop the Telegram bot. Run the final import. From then on, log in the app only.
5. Keep the old sheet read-only as an archive.

---

## 9. PWA

- `@vite-pwa/nuxt` manifest: name "Wallet Wyse", short name "Wallet Wyse", `display: standalone`, `theme_color` and `background_color` from `ground`, 192, 512 and maskable icons, Apple touch icon and meta tags. Installable via Add to Home Screen on iOS and Android.
- Precache the app shell only. **Requests to Supabase and `/api` are network only. Never cache or replay writes.**
- Offline: the shell loads, data areas show the offline copy, and write actions are disabled. No offline queue in v1.
- Safe-area insets, bottom padding so nothing hides behind the nav, dark mode through `@nuxtjs/color-mode`.

---

## 10. Later (planned, not in v1)

**Credit card balance tracking.** v1 only records which payment method each expense used, so the data is captured from day one. A later version adds:
- `card_payments` table (card, date, amount). Paying a card bill is **not an expense** (the purchases were already counted when made).
- Per credit card: owed now = card expenses + opening balance - payments; credit limit, statement day and due day; available credit; due-date reminder.
- Opening balance entered once, because imported history has no payment method.
- Not planned: interest, annual fees, instalment plans, refunds, cashback.

## 11. Out of scope

Telegram, Google Sheets integration, more than two users, shared household view, budget history and rollover of unspent budget, recurring expenses, storing receipt photos, live market prices, multi-currency, offline write queue, AI questions about the data.

---

## 12. Build order

1. Supabase project, Google provider, migrations (section 4), allowlist, RLS tests. **Stop and confirm tests pass.**
2. Nuxt shell: auth, login, route middleware, responsive layout (bottom nav and sidebar), design tokens.
3. Migration script and import for the first user. Verify totals.
4. Expenses page and Home (data composables, filters, add/edit/delete, charts).
5. PWA.
6. Quick add.
7. Savings and investments.
8. Budget, Settings, export.
9. Import for the second user, README, deploy.

`Expenses` and `Home` (steps 1 to 4) must fully work before anything after them starts.

## 13. Deliverables

- Working app deployed to Vercel with only the env vars in section 6.
- `supabase/migrations/*.sql` and `scripts/migrate-from-xlsx.ts`.
- `README.md`: Supabase project and Google provider setup, Google Cloud OAuth client, running migrations, adding the two allowed emails, running the import and verification, env vars, Vercel deploy, monthly CSV export reminder.
