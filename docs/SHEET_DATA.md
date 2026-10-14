# Sheet Data Reference (for frontend and API design)

Source: `ExpenseTracker.xlsx` (one Google Sheet per user, same layout). Snapshot taken 2026-10-04.

The app only reads and writes the **`Log`** tab. Every other tab is formulas or reference data. Do not depend on them. The app computes all totals itself.

---

## 1. `Log` tab: the expense table (source of truth)

- Title in row 1, "Telegram bot" in row 2, **header in row 4**, **data starts at row 5**.
- Rows are **newest first**. The Telegram bot **inserts at the top**, so row numbers shift. Never store or trust row indexes. Look rows up by ID.
- 220 rows at snapshot, covering 2026-07-14 to 2026-10-04.

| Col | Header | Type | Notes |
|---|---|---|---|
| A | `#` | number | **Computed by an array formula (`A164:A1163 = ROW()-4`). Do not write to it and do not use it as the ID.** |
| B | `Date` | datetime | Display format `yyyy-mm-dd`. The value carries a time (e.g. `2026-10-04 12:53:32`). 26 rows are midnight (`00:00`, likely manual or backdated). Timezone: Malaysia (UTC+8). |
| C | `Description` | string | Free text. This is the "note" in the UI. |
| D | `Category` | string | One of the 7 categories below. |
| E | `Amount (RM)` | number | Positive, 2 decimals. Currency is RM. |
| F | `Notes` | string | Currently always `via Telegram bot`. The app can write `via app`. |
| **G** | `ID` | string (UUID) | **NEW. Must be added.** The app generates a UUID for rows it creates. Existing rows need a one-off backfill. The bot should write one later. |

### Categories (the full current list)

Counts as of the snapshot:

| Category | Rows |
|---|---|
| Food & Drinks | 147 |
| Groceries | 28 |
| Transport | 18 |
| Shopping | 14 |
| Others | 8 |
| Entertainment | 3 |
| Health | 2 |

The `Breakdown` tab only lists some of these as rows. Treat the 7 above as the allowed list, defined once in a shared constant.

### Example rows

```
Date                     Description           Category        Amount  Notes
2026-10-04 12:53:32      Dyson AirSrait gift   Shopping        450.00  via Telegram bot
2026-10-04 12:53:13      vacuum                Shopping         90.00  via Telegram bot
2026-10-03 17:51:50      grocery               Groceries        13.50  via Telegram bot
2026-10-03 15:15:17      Boost Juice           Food & Drinks    16.50  via Telegram bot
```

### Shape the API should return (`GET /api/expenses`)

```ts
type Expense = {
  id: string          // UUID from column G
  date: string        // ISO 8601 with +08:00 offset, e.g. "2026-10-04T12:53:32+08:00"
  description: string // column C
  category: Category  // column D
  amount: number      // column E, RM
  notes: string       // column F
}
type Category =
  | 'Food & Drinks' | 'Groceries' | 'Transport' | 'Shopping'
  | 'Entertainment' | 'Health' | 'Others'
```

The frontend must not see row numbers or sheet IDs.

### Frontend implications

- **Year matters.** The data spans years going forward. Group by `YYYY-MM`, never by month name alone. The list filter needs month **and year**. The trend chart is a rolling 12 months labelled like "Oct 26".
- Sort by `date` descending client-side. Do not rely on sheet order.
- Search runs over `description` (case-insensitive).
- "This month" and "last month" are computed in Malaysia time (UTC+8), not browser UTC. Late-night expenses must not land on the wrong day.
- The Add form defaults the date to today. The user picks a date only, and the server adds the current time, or `00:00` for backdated entries.
- Amounts are RM with 2 decimals: format with `Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' })`.

---

## 2. `BotLog` tab: not used by the app

Telegram bot audit trail: `Timestamp | Message | Status | Detail`. Status values: `SUCCESS` (207), `GROQ_FAIL` (7), `REJECTED` (1). Ignore it in the app.

Known bot bug: `"21.30 dinner ayam penyet"` was logged as RM2130. A parse issue, unrelated to the app.

---

## 3. `Overview` tab: income, deductions, fixed expenses (IN SCOPE)

Label in column B, value in column C. The layout is loose cells, not a table. **The app reads and writes inputs by label (find the row whose column B matches), never by hard-coded address**, so moving rows doesn't break it. Snapshot (October 2026):

| Cell | Label | Value | Kind |
|---|---|---|---|
| C6 | Base Salary | 3,900 | **input** |
| C7 | Allowance | 300 | **input** |
| C8 | Total Gross Income | 4,200 | computed `C6+C7` |
| C11 | EPF Rate (Employee) | `11%` (text) | **input** |
| C12 | EPF Contribution | 462 | computed `C8 * 0.11` (**11% of gross**, rate is hard-coded in the formula, not read from C11) |
| C13 | SOCSO (Employee) | 20.75 | **input** |
| C14 | EIS | 8.30 | **input** |
| C15 | Employee SKBBK | 31.15 | **input** |
| C16 | Total Deductions | 522.20 | computed `C12+C13+C14+C15` |
| C19 to C26 | Fixed expenses: Rent 600, Anytime Fitness 140, WiFi + Water Dispenser 50, Rapid KL 50, YouTube 12.90, Utilities 150, Claude Subscription 95, Phone Bill 25 | 1,122.90 total | **inputs** |
| C27 | Total Fixed Expenses | 1,122.90 | computed (hard-coded `C19..C26`; adding a row breaks it) |
| C30 | Net Income (after deductions) | 3,677.80 | computed `C8-C16` |
| C31 | After Fixed Expenses | 2,554.90 | computed `C30-C27` |
| C32 | Spent this month | 791.73 | computed from `Log` (current calendar month) |
| C33 | Available for Variable Spending | 1,763.17 | computed `C31-C32` |

`C3` ("Viewing month") is just `TEXT(TODAY(),...)`. It is **not** a dropdown, despite the note in B35.

### What the app should do with it

- **Compute all derived values in the app** (gross, EPF, deductions, net, after fixed, available). Never read the computed cells, so the app can show any month and any year.
- Spent for the selected month comes from `Log`. Available = Net - Fixed - Spent(month).
- The inputs must be **editable from the phone** (salary changes, new subscription). Writes go to column C of the matching label.
- The current layout can't add or remove fixed expenses without breaking `C27`. **Recommended:** replace the fixed-expense block (and optionally income and deductions) with a proper table in a new tab, e.g. `Settings`: `ID | Type | Label | Amount`, with `Type` one of `income | deduction | fixed`. The app then adds, edits and deletes lines like expenses. The EPF rate becomes its own `Setting` row.
- Income is currently one value per month with no history. If the salary changes, past months will be recomputed with the new salary. For v1 this is fine. Note it as a known limitation.

```ts
type Overview = {
  income:     { label: string; amount: number }[]   // Base Salary, Allowance
  epfRate:    number                                // 0.11
  deductions: { label: string; amount: number }[]   // SOCSO, EIS, SKBBK (EPF computed)
  fixed:      { label: string; amount: number }[]   // Rent ... Phone Bill
}
```

---

## 4. `Savings` tab: monthly goal and savings log (IN SCOPE)

| Cell | Meaning | Value |
|---|---|---|
| C3 | Monthly Savings Goal (RM) | 10,000 (**input**) |
| A6 | Saved This Month | computed |
| D6 | Total Saved (All Time) | computed |
| A9 | % of monthly goal | computed |
| D9 | Remaining this month | computed |
| A12 to A16 / D12 to D16 | By destination: EPF Voluntary, ASB, Stocks/Unit Trust, Emergency Fund, Others | computed |

### Savings log table: header in row 36, data from row 37

Today it is **empty**, and the formulas only read rows 37 to 86 (a cap of 50 entries).

| Col | Header | Type | Notes |
|---|---|---|---|
| A | `#` | formula `ROW()-34` | Ignore, do not write. |
| B | `Date` | date | |
| C | `Destination` | string | One of: `EPF Voluntary`, `ASB`, `Stocks/Unit Trust`, `Emergency Fund`, `Others` |
| D | `Amount (RM)` | number | Positive. |
| E | `Notes` | string | |
| **F** | `ID` | UUID | **NEW**, same rule as `Log`. |

```ts
type Saving = {
  id: string; date: string; destination: Destination; amount: number; notes: string
}
```

### What the app should do with it

- Compute saved this month, all time, % of goal, remaining, and the split by destination in the app, from the log rows. Don't read the formula cells.
- Read **all** rows from row 37 down, not just 37 to 86.
- Check the goal. RM 10,000 a month is far above the net income of RM 3,678. This is probably a placeholder, or a long-term figure. Confirm what it should be. Only `C3` needs changing.
- New saving rows insert at the top of the table (row 37), same rule as `Log`.

---

## 5. Other tabs (not read by the app)

`Dashboard`, `Breakdown`, `Weekly`, `Monthly` (formulas that the app replaces; `YEAR(TODAY())` makes them break across years) and `BotLog` (the bot's audit trail).

---

## 6. Decisions and required changes

**Decided:** `Overview` inputs and `Savings` (goal and log) are **editable from the app** (add, edit, delete). Derived figures are computed in the app and never written.

**Write rules for Overview/Savings:**
- Every editable line has a UUID (`Settings` table `ID` column, `Savings` column F) and is located by ID right before writing, same as `Log`.
- Same `requireUserSession` and sheet-ID-from-session rules; validate with zod (amounts >= 0, `Type` and `Destination` from allowed lists, EPF rate between 0 and 1).
- Routes: `/api/settings` (GET, POST, PATCH [id], DELETE [id]) and `/api/savings` (same), plus `PATCH /api/savings/goal`.
- Data layer: `getSettings`, `addSetting`, `updateSetting`, `deleteSetting`, `getSavings`, `addSaving`, `updateSaving`, `deleteSaving`, `getSavingsGoal`, `setSavingsGoal` in `server/utils/sheets.ts`.

**Required sheet changes:**

1. Make a backup copy (File, Make a copy).
2. **`Log`:** add header `ID` in `G4`. Leave column A empty (clear the array formula at `A164`, do not delete the column).
3. **Backfill UUIDs** for the 220 existing `Log` rows (one-off script or protected admin route).
4. **New `Log` rows go at the top.** The app calls `insertDimension` at row 5, then writes the values into row 5, in one `batchUpdate` so the bot can't interleave.
5. **`Savings`:** add header `ID` in `F36`.
6. **`Overview`:** decide between reading the current cells by label (quick) or converting to a `Settings` table (recommended, section 3).
7. Update the bot to write the `Log` ID, and keep the column layout otherwise unchanged.
