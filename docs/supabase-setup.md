# Talkotype Supabase setup

Yes — durable accounts, notification prefs, invoices, and transcripts need a database.

## Create a **new** project (do not reuse warehouse-app)

1. Open [Supabase Dashboard → New project](https://supabase.com/dashboard/new/talkotype)
2. Name it `talkotype`, pick a region, generate a strong DB password
3. After the project is ready, copy **Project URL** + **anon** + **service_role** keys
4. Put them in `.env.local` (see `.env.example`)
5. Apply the migration:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or paste `supabase/migrations/20261112140000_talkotype_accounts.sql` into the SQL editor.

## What the schema includes

- `profiles` — plan, billing interval, display name
- `notification_settings` — email toggles
- `daily_usage` — free-tier daily transcript count
- `invoices` — downloadable invoice metadata (Stripe later)
- `transcripts` — uploaded jobs + text

RLS policies keep each user on their own rows. A trigger creates profile + notification defaults on signup (`auth.users`).
