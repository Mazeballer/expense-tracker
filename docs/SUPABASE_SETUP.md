# Supabase setup

Free tier is enough. This takes about 20 minutes.

## 1. Create the project
1. supabase.com, New project. Pick the Singapore region. Save the database password somewhere safe.
2. Note the Project URL and the publishable key (Project Settings, API). These two go in `.env` and Vercel. The secret key stays out of the app.

## 2. Create the tables
Open SQL Editor and run these files from `supabase/migrations/`, in order, one at a time:
`0001_schema.sql`, `0002_rls.sql`, `0003_auth.sql`, `0004_functions.sql`, `0005_storage.sql`.

## 3. Choose who can sign in (do this before anyone signs in)
In the SQL Editor:

```sql
insert into public.allowed_emails (email) values ('you@gmail.com'), ('partner@gmail.com');
```

- To allow someone else later, add a row (Table Editor, `allowed_emails`). To stop a new person, do nothing.
- The list only blocks **new** accounts. To remove someone who already signed in, delete them under Authentication, Users.
- Emails are compared without caring about capital letters.

## 4. Google sign-in
1. console.cloud.google.com, create a project. APIs and Services, OAuth consent screen: External, app name, your email. Leave the publishing status on **Testing** and add the same two emails as **Test users**. Google then refuses every other account too (a second lock). With only the basic profile scopes, Testing mode does not expire sign-ins **(verify in the console)**.
2. Credentials, Create credentials, OAuth client ID, Web application. Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`. Copy the Client ID and Client secret.
3. Supabase, Authentication, Providers, Google: turn it on and paste the Client ID and secret.
4. Supabase, Authentication, URL Configuration: Site URL is your Vercel address; add Redirect URLs `http://localhost:3000/**` and `https://<your-app>.vercel.app/**`.

## 5. Environment variables
In `.env` and in Vercel:

```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_KEY=<publishable key>
```

Never put the secret (service role) key in Vercel or in the app.

## 6. Check it works
- Sign in with an allowed account: you land on Home with the seven categories, two payment methods (Debit card, Credit card) and five accounts already there.
- Sign in with any other Google account: you return to the login page with "This Google account does not have access."
- Open Authentication, Users: only your two accounts exist.
- Sign in as the second person: they see none of the first person's expenses.

The security rules are also tested automatically: `pnpm test:db` runs all five migrations in a temporary database and checks them (19 checks, all must say PASS). It is a stand-in for real Postgres, so repeat the last two checks above on the real project.

## 7. Good to know
- Free projects pause after about a week without activity. Daily use prevents it.
- Free projects have no downloadable backups. Use Settings, Export all data every month.
