# Apple Pay auto-log

Each Apple Pay payment is saved in Wallet Wyse by itself.

How it works: an iPhone Shortcut (Automation, Transaction) sends the shop, amount and card to `POST /api/apple-pay` with a private token. The server asks the AI for a category (Others if the AI is down, so a payment is never lost), picks the card, and saves the expense through a locked-down database function. No secret database key is involved.

## Turn it on

1. Run `supabase/migrations/0007_apple_pay.sql` in the Supabase SQL editor (or paste the new part of `supabase/setup-all.sql`).
2. Deploy the app.
3. In the app: Settings, Apple Pay auto-log. Make a token, copy it, and follow the steps on that page.

## Rules

- The token is shown once and only its hash is stored. Revoke it from the same page.
- A token can only add expenses. It cannot read anything.
- Refunds (negative amounts) are not logged.
- The same payment sent twice within two minutes is saved once.
- Cards are matched by name to your payment methods; otherwise credit cards go to your first credit card and the rest to your first debit card.
