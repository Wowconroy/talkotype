# Talkotype schema design notes

## Live foundation (applied)

- `profiles`, `notification_settings`, `daily_usage`, `invoices`, `transcripts`
- Signup trigger `handle_new_user` creates profile + notification defaults (`on conflict do nothing`)
- Google sign-in mapped via `auth.users.raw_app_meta_data->>'provider' = 'google'`
- Paddle ids + soft deletes (`deleted_at`) on transcripts / media

## Processing (migrations `…100` + `…200` + `…300`)

- `media_assets` — private R2 object keys, kind, size, expiry, soft-delete status
- `transcription_jobs` — Whisper default provider; `stage` / `progress_pct`; `speakers_requested` (Unlimited only, DB trigger enforced); `audio_seconds` / `cost_cents`
- `transcription_chunks` — long-file split with unique `(job_id, chunk_index)`
- `transcript_speakers` / `transcript_segments` — diarization + timed lines (paid)
- `quota_reservations` — idempotent free-tier daily allowance
- `usage_events` + `monthly_usage` — cost / fair-use ledger (`record_usage_event`)
- `billing_webhook_events` — Paddle event_id idempotency
- `transcripts.search_vector` — FTS (title / filename / body)
- Helpers: `reserve_transcript_quota`, `publish_job_transcript`, `soft_delete_transcript`, `count_active_jobs`, `record_usage_event`

## Product rules

| Rule | Where |
|------|--------|
| Whisper is the default STT engine | `transcription_jobs.provider` default `whisper` |
| Speaker labels = Unlimited only | Trigger `enforce_speakers_requested_plan` + API `speakers` flag |
| Free = 3 transcripts / UTC day | `reserve_transcript_quota` + `daily_usage` |
| Concurrent jobs | API uses `count_active_jobs` (free 2 / unlimited 5) |
| TXT export after media expiry | Always from `transcripts.transcript_text` |

## Deferred

| Table | Why later |
|-------|-----------|
| `transcript_versions` | Full revision history |
| `folders` / `upload_batches` | History organisation |
| `transcript_derivatives` | Saved translations / summaries |
| `plans` / `subscriptions` | Extra billing ledger; Paddle ids live on `profiles` / `invoices` |
| `workspaces` / `transcript_shares` | Team access |
