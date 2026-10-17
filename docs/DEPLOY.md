# Deploy to Vercel

1. Push the repo to GitHub (the `.env` file is ignored and must never be committed).
2. vercel.com, Add New, Project, import the repo. Framework: Nuxt (detected). Leave build settings as they are.
3. Environment Variables (add for Production **and** Preview):
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (publishable key only)
   - `GROQ_API_KEY` (the AI key from console.groq.com; server only, never put it in a variable that starts with NUXT_PUBLIC)
4. Deploy. Note the address, for example `https://wallet-wyse.vercel.app`.
5. Supabase, Authentication, URL Configuration: set Site URL to that address and add `https://<address>/**` to Redirect URLs (keep `http://localhost:3000/**` for local work).
6. Google Cloud Console is unchanged: the only redirect URI is the Supabase one (`https://<project-ref>.supabase.co/auth/v1/callback`).
7. Redeploy once after changing environment variables (they are baked in at build time).

A production build with no Supabase keys fails on purpose instead of showing fake data.

## After the first deploy

- Sign in with an allowed account, add an expense, reload: it must still be there.
- Sign in with a Google account that is not allowed: it must return to the login page with the "no access" message.
- On an iPhone, open the address in Safari, Share, Add to Home Screen, then open it from the home screen and set up Face ID in Settings.
- Free Supabase projects have no backups. Use Settings, Export all data every month.

## AI

- Typing: the server route `/api/quick-add` asks `openai/gpt-oss-120b` (Groq) to read the message, then checks the answer: every amount must be a number the person typed, categories must be the person's own. If the AI fails, the app says so and saves nothing.
- Receipts: `/api/receipt-scan` sends a shrunk photo to `qwen/qwen3.8-27b` (Groq). Tax and service are worked out as the total minus the items.
- Only signed-in people can call these routes, limited to 30 requests a minute each.
- Change models with `GROQ_TEXT_MODEL` and `GROQ_VISION_MODEL` if Groq retires one.
