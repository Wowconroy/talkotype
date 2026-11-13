# Smallest setup for a real two-hour MP4

## What already covers the flow

Reuse these as-is:

- `transcription_jobs` (`status`, `stage`, `progress_pct`, `attempt_count`, `request_key`)
- `transcription_chunks` (per-chunk retry + offsets)
- `publish_job_transcript` (guard against overwriting newer edits)
- Desk polling of `job_stage` / `progress_pct`
- R2 private originals + Groq Whisper via `transcription-provider`

Keep **one Groq mode** for the long-file path initially: **Steady → `whisper-large-v3-turbo`**.

## Smallest add

1. **Worker with FFmpeg** (Cloudflare Container, Fly, or a small Node/Python service) triggered from `complete-upload` instead of (or after) the Vercel `after()` process route.
2. Worker steps with visible stages:
   - `preparing_audio` — probe duration/codecs; reject > 3h; extract mono 16 kHz FLAC/WAV
   - `chunking` — split ~8–10 min with short overlaps; write `transcription_chunks`
   - `transcribing` — Groq each chunk (URL or file); bounded retries on 429/5xx
   - `publishing` — merge by timeline, drop duplicated boundary text; `publish_job_transcript`
3. **Do not require CF Queues yet** if the worker can pull `queued` jobs every few seconds. Add Queues when Vercel timeouts or duplicate dispatches become the bottleneck.
4. Progress: `progress_pct = completed_chunks / total_chunks`.

## Still separate tasks (not in this minimal path)

- Resumable multipart R2 uploads
- AssemblyAI / speaker recognition
- Swift vs Steady accuracy benchmarks

## What blocks long-file support today

| Blocker | Why |
|---|---|
| No FFmpeg runtime | Cannot extract audio from MP4 or normalise WMA/WMV |
| No chunking | Groq upload caps (25–100 MB) and Vercel `maxDuration` |
| Process runs in request/`after()` | Unreliable for multi-hour jobs |
| No duration probe | 3h limit is advertised, not enforced on bytes |
