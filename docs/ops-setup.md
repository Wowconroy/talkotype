# Talkotype ops setup (Auth, R2, Paddle)

## 1. Supabase Auth

Project: `talkotype` (`lmygcgwaknzdrikoizwo`)

1. Authentication → URL configuration  
   - Site URL: `https://talkotype.app` (and `http://localhost:3000` for local)  
   - Redirect URLs:  
     - `http://localhost:3000/auth/callback`  
     - `https://talkotype.app/auth/callback`
2. Providers → Email: enable  
   - For local testing you can disable “Confirm email”
3. Providers → Google: enable  
   - Create OAuth client in Google Cloud  
   - Authorized redirect: `https://lmygcgwaknzdrikoizwo.supabase.co/auth/v1/callback`

## 2. Cloudflare R2

1. Create bucket `talkotype-media` (private)
2. Create API token with Object Read & Write
3. Put values in `.env.local` / Vercel:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

Original uploads get a 7-day `expires_at` in `media_assets` on Free (Unlimited = `null`). TXT export uses `transcripts.transcript_text` and still works after media expiry.

**Automated purge:** Vercel Cron hits `GET /api/cron/purge-expired-media` daily (`15 3 * * *` UTC in `vercel.json`). It deletes expired objects from R2 and marks `media_assets` as `status=expired` + `deleted_at`. Set `CRON_SECRET` in the Vercel project; Vercel sends `Authorization: Bearer <CRON_SECRET>`.

R2 CORS (required for browser PUT to signed URLs): allow origins `https://talkotype.app`, `http://localhost:3000`; methods `GET,PUT,HEAD`; headers `*`.

## 3. Paddle Billing (sandbox first)

Use a **sandbox** vendor account so test cards never charge real money.

### Dashboard setup

1. Sign up / log in at [sandbox-vendors.paddle.com](https://sandbox-vendors.paddle.com)
2. **Catalog → Products** → create product `Talkotype Unlimited`
3. Add two **prices** (recurring):
   - Monthly · `$20 USD` / month
   - Yearly · `$168 USD` / year (or `$14/mo` billed yearly)
4. **Developer tools → Authentication**
   - Create a **client-side token** → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
   - Create an **API key** → `PADDLE_API_KEY`
5. **Developer tools → Notifications**
   - Destination URL: `https://talkotype.app/api/billing/paddle-webhook`
   - Events (minimum):
     - `subscription.created`
     - `subscription.activated`
     - `subscription.updated`
     - `subscription.canceled`
     - `transaction.completed`
     - `transaction.paid`
   - Copy the destination **secret key** → `PADDLE_WEBHOOK_SECRET`

### Env vars (`.env.local` + Vercel Production / Preview)

```bash
NEXT_PUBLIC_PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_...
NEXT_PUBLIC_PADDLE_PRICE_MONTHLY=pri_...
NEXT_PUBLIC_PADDLE_PRICE_YEARLY=pri_...
PADDLE_API_KEY=test_...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
```

Checkout opens from `/pricing` and Account → **Go Unlimited**. Overlay passes `customData.user_id` (Supabase user id) so the webhook can flip `profiles.plan` to `unlimited`.

### Test cards

Use Paddle sandbox cards from their docs (e.g. successful Visa). No real charge in sandbox.

### Local webhook testing

Sandbox notifications need a public URL. Prefer production webhook on `talkotype.app`, or tunnel `localhost:3000` (Cloudflare Tunnel / ngrok) and point the sandbox destination there.

DB fields: `profiles.paddle_customer_id`, `profiles.paddle_subscription_id`, `invoices.paddle_transaction_id`.

## 4. Transcription (Whisper first)

1. Set `GROQ_API_KEY` (default engine: Whisper via Groq).
2. Defaults: `TRANSCRIPTION_PROVIDER=whisper`, `TRANSCRIPTION_MODEL=whisper-large-v3-turbo`.
3. Optional: `ASSEMBLYAI_API_KEY` only if you set `TRANSCRIPTION_PROVIDER=assemblyai`.
4. Speaker labels: request `speakers: true` on upload API — allowed only when `profiles.plan = unlimited`.
5. Until Groq is set, process marks `transcription_provider_not_configured`.
