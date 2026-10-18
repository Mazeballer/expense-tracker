// Runs the migrations in an in-memory Postgres (PGlite) and checks the security rules.
// This is a fast stand-in, not real Supabase: run the same checks again on your real project (docs/SUPABASE_SETUP.md).
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
const db = new PGlite()
const run = (sql) => db.exec(sql)
const dir = new URL('../migrations/', import.meta.url).pathname

await run(`
create role anon nologin; create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
grant usage on schema storage to authenticated;
grant all on storage.objects to authenticated;
`)
for (const f of ['0001_schema.sql', '0002_rls.sql', '0003_auth.sql', '0004_functions.sql', '0005_storage.sql', '0006_allowlist_trim.sql', '0007_apple_pay.sql']) {
  try { await run(readFileSync(dir + f, 'utf8')); console.log('ran', f) } catch (e) { console.log('FAILED', f, e.message); process.exit(1) }
}

const check = async (name, fn) => { try { const r = await fn(); console.log('PASS', name, r ?? '') } catch (e) { console.log('FAIL', name, '->', e.message) } }
const expectError = async (name, sql) => { try { await run(sql); console.log('FAIL', name, '-> no error') } catch (e) { console.log('PASS', name, '(blocked:', e.message.slice(0, 70) + ')') } }
const as = async (uid, sql) => { await run(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}', false);`); try { return await db.query(sql) } finally { await run('reset role') } }

await expectError('3rd account cannot sign up', `insert into auth.users (email) values ('stranger@example.com')`)
await run(`insert into public.allowed_emails values ('a@example.com'), ('B@example.com')`)
await run(`insert into auth.users (email) values ('a@example.com'), ('b@example.com')`)
const users = (await db.query(`select id, email from auth.users order by email`)).rows
const [A, B] = [users[0].id, users[1].id]
console.log('users created:', users.length)

await check('seed: categories per user', async () => (await db.query(`select user_id, count(*)::int n from public.categories group by 1`)).rows.map((r) => r.n).join(','))
await check('seed: methods/accounts/epf/settings', async () => JSON.stringify((await db.query(`select (select count(*)::int from public.payment_methods where user_id='${A}') pm, (select count(*)::int from public.accounts where user_id='${A}') ac, (select count(*)::int from public.epf_rates where user_id='${A}') epf, (select count(*)::int from public.user_settings where user_id='${A}') st`)).rows[0]))

const catA = (await as(A, `select id from public.categories where name='Food & Drinks'`)).rows[0].id
const catB = (await as(B, `select id from public.categories where name='Food & Drinks'`)).rows[0].id

await check('A inserts own expense (user_id default)', async () => { await as(A, `insert into public.expenses (spent_at, description, category_id, amount) values (now(), 'Lunch', '${catA}', 12.50)`); return '' })
await check('B cannot see A expense', async () => (await as(B, `select count(*)::int n from public.expenses`)).rows[0].n)
await check('A sees own expense', async () => (await as(A, `select count(*)::int n from public.expenses`)).rows[0].n)
await expectError('A cannot insert row for B', `set role authenticated; select set_config('request.jwt.claim.sub','${A}', false); insert into public.expenses (user_id, spent_at, description, category_id, amount) values ('${B}', now(), 'x', '${catB}', 1)`); await run('reset role')
await expectError('A cannot use B category', `set role authenticated; select set_config('request.jwt.claim.sub','${A}', false); insert into public.expenses (spent_at, description, category_id, amount) values (now(), 'x', '${catB}', 1)`); await run('reset role')
await expectError('amount must be positive', `set role authenticated; select set_config('request.jwt.claim.sub','${A}', false); insert into public.expenses (spent_at, description, category_id, amount) values (now(), 'x', '${catA}', 0)`); await run('reset role')
await check('B cannot update A expense', async () => { const r = await as(B, `update public.expenses set amount = 999 returning id`); return 'rows affected: ' + r.rows.length })
await check('allowed_emails shows no rows to users (expect 0)', async () => { await run(`set role authenticated; select set_config('request.jwt.claim.sub','${A}', false);`); try { return (await db.query(`select count(*)::int n from public.allowed_emails`)).rows[0].n } finally { await run('reset role') } })
await check('monthly view only shows caller rows (A)', async () => JSON.stringify((await as(A, `select month::text, total::float, count from public.expense_monthly`)).rows))
await check('monthly view for B is empty', async () => (await as(B, `select count(*)::int n from public.expense_monthly`)).rows[0].n)

await as(A, `insert into public.plan_items (kind, label, amount, effective_from) values ('income','Base Salary',3900,'2026-01-01')`)
const group = (await as(A, `select group_key from public.plan_items`)).rows[0].group_key
await check('plan_item_change from next month keeps old month', async () => { await as(A, `select public.plan_item_change('${group}', 4500, '2026-11-01')`); return JSON.stringify((await as(A, `select amount::float, effective_from::text, effective_to::text from public.plan_items order by effective_from`)).rows) })
await check('plan_item_end', async () => { await as(A, `select public.plan_item_end('${group}', '2027-01-01')`); return JSON.stringify((await as(A, `select amount::float, effective_to::text from public.plan_items order by effective_from`)).rows) })
await check('change_epf_rate from next month', async () => { await as(A, `select public.change_epf_rate(0.13, '2026-11-01')`); return JSON.stringify((await as(A, `select rate::float, effective_from::text from public.epf_rates order by effective_from`)).rows) })
await check('B cannot change A plan line', async () => { try { await as(B, `select public.plan_item_change('${group}', 1, '2026-12-01')`); return 'no error' } catch (e) { return 'blocked: ' + e.message } })
await check('budget: overall + category, duplicate overall blocked', async () => {
  await as(A, `insert into public.budgets (category_id, amount) values (null, 1500), ('${catA}', 500)`)
  try { await as(A, `insert into public.budgets (category_id, amount) values (null, 1)`); return 'duplicate allowed (BAD)' } catch { return 'duplicate overall blocked' }
})
await as(A, `insert into public.api_tokens (token_hash) values (encode(sha256(convert_to('secret-token','UTF8')),'hex'))`)
const anon = async (sql) => { await run('set role anon'); try { return await db.query(sql) } finally { await run('reset role') } }
await check('B cannot see A api tokens (expect 0)', async () => (await as(B, `select count(*)::int n from public.api_tokens`)).rows[0].n)
await check('anon cannot read api_tokens', async () => { try { await anon(`select * from public.api_tokens`); return 'allowed (BAD)' } catch { return 'blocked' } })
await check('apple pay: good token returns A categories and cards', async () => { const r = (await anon(`select public.apple_pay_context('secret-token') c`)).rows[0].c; return `${r.categories.length > 0 && r.methods.length > 0}` })
await check('apple pay: wrong token returns null', async () => (await anon(`select public.apple_pay_context('nope') c`)).rows[0].c === null)
await check('apple pay: logs an expense for the token owner', async () => { await anon(`select public.apple_pay_log('secret-token', 8.40, 'Starbucks', '${catA}', null)`); return JSON.stringify((await as(A, `select amount::float, source from public.expenses where description='Starbucks'`)).rows) })
await check('apple pay: same payment twice is saved once', async () => { await anon(`select public.apple_pay_log('secret-token', 8.40, 'Starbucks', '${catA}', null)`); return (await as(A, `select count(*)::int n from public.expenses where description='Starbucks'`)).rows[0].n })
await check('apple pay: B never sees it', async () => (await as(B, `select count(*)::int n from public.expenses where description='Starbucks'`)).rows[0].n)
await check('apple pay: wrong token cannot log', async () => { try { await anon(`select public.apple_pay_log('nope', 5, 'x', '${catA}', null)`); return 'allowed (BAD)' } catch { return 'blocked' } })
await check("apple pay: cannot use another person's category", async () => { try { await anon(`select public.apple_pay_log('secret-token', 5, 'x', '${catB}', null)`); return 'allowed (BAD)' } catch { return 'blocked' } })
console.log('done. Every line above should say PASS.')
