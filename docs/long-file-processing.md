# Long-file processing (Fly FFmpeg worker)

## Decision

Talkotype keeps Next.js on Vercel for the app, and runs **media work on Fly.io** with native FFmpeg.

Why Fly (not CF Queues/Containers first):

- Native FFmpeg without fighting Worker/WASM limits
- Long CPU time for 2–3 hour files
- Simple HTTP dispatch + DB poll backup
- R2 + Supabase stay as storage/state; worker is replaceable

**One Groq mode for this path:** Steady → `whisper-large-v3-turbo`.

## What reuses existing infra

- `transcription_jobs` stages / progress
- `transcription_chunks` for independent retries
- `publish_job_transcript` edit guard
- Desk polling of stage + progress
- Private R2 originals + extracted audio

## Flow

1. Browser uploads to R2 → `POST /complete-upload`
2. If `TRANSCRIPTION_WORKER_URL` + `TRANSCRIPTION_WORKER_SECRET` are set → `POST {worker}/jobs/:transcriptId`
3. Worker: probe → enforce 3h (Unlimited) / 30m clip (Free) → extract mono 16 kHz FLAC → chunk ~8 min with 2s overlap → Groq each chunk → merge → publish
4. If worker env is missing → existing Vercel `after()` + `/process` (short files only)

## Local worker

```bash
cd worker
cp ../.env.local .env.local   # or use docker-compose env_file
export WORKER_SHARED_SECRET=dev-worker-secret
npm install
# needs ffmpeg/ffprobe on PATH
npm run dev
```

Or: `docker compose -f worker/docker-compose.yml up --build`

App `.env.local`:

```
TRANSCRIPTION_WORKER_URL=http://127.0.0.1:8080
TRANSCRIPTION_WORKER_SECRET=dev-worker-secret
```

## Deploy to Fly

```bash
cd worker
fly launch --copy-config --name talkotype-worker
fly secrets set \
  WORKER_SHARED_SECRET=... \
  GROQ_API_KEY=... \
  NEXT_PUBLIC_SUPABASE_URL=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  R2_ACCOUNT_ID=... \
  R2_ACCESS_KEY_ID=... \
  R2_SECRET_ACCESS_KEY=... \
  R2_BUCKET_NAME=... \
  TRANSCRIPTION_MODEL=whisper-large-v3-turbo
fly deploy
```

Then set the same URL/secret on Vercel.

## Separate later

- Resumable multipart R2 uploads
- Speaker recognition
- Swift vs Steady WER benchmarks
- Cloudflare Queues (only if dispatch reliability needs it)
