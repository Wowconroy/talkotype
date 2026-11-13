# Talkotype Supabase setup

Yes — durable accounts, notification prefs, invoices, and transcripts need a database.

## Live project (do not reuse warehouse-app)

| Field | Value |
|-------|--------|
| Org | Wowconroy's Org |
| Project | `talkotype` |
| Ref | `lmygcgwaknzdrikoizwo` |
| Region | `eu-north-1` |
| URL | `https://lmygcgwaknzdrikoizwo.supabase.co` |

Local keys live in `.env.local` (gitignored). Also add the same three vars in Vercel for production.

## Schema

Applied migrations:

1. `20261112140000_talkotype_accounts.sql` — foundation + signup trigger  
2. `20261113010000_processing_flow.sql` — media/jobs/chunks + quota helpers  
3. `20261113020000_paddle_and_soft_delete.sql` — Paddle fields + soft deletes  
4. `20261113030000_whisper_speakers_ops.sql` — Whisper default, speakers, cost/FTS  
5. `20261113060000_folders_and_source_url.sql` — desk folders + link import fields  
6. `20261113070000_transcript_share.sql` — public share tokens for transcripts  
7. `20261113080000_quota_release.sql` — refund free daily quota on delete / orphaned reserve  

See also `docs/ops-setup.md` for Auth, R2, and Paddle. 

See `docs/schema-design-notes.md` for deferred tables and runtime rules.

To re-link CLI later:

```bash
npx supabase link --project-ref lmygcgwaknzdrikoizwo
npx supabase db push
```

## What the schema includes

- `profiles` — plan, billing interval, display name
- `notification_settings` — email toggles
- `daily_usage` — free-tier daily transcript count (UTC day)
- `quota_reservations` — idempotent `request_key` ledger for quota
- `invoices` — downloadable invoice metadata (Paddle transaction ids)
- `transcripts` — editable text + FTS `search_vector` + dashboard status
- `media_assets` — private R2 object keys + expiry
- `transcription_jobs` / `transcription_chunks` — Whisper jobs, progress, retries
- `transcript_speakers` / `transcript_segments` — Unlimited speaker labels
- `usage_events` / `monthly_usage` — cost + fair-use rollups
- `billing_webhook_events` — Paddle idempotency

RLS: users read their own rows; job/chunk/usage writes are server-side. Signup trigger still creates profile + notification defaults. Speakers require Unlimited (DB trigger).
