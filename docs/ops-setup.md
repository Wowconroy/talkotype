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

## 3. Paddle Billing

Sandbox and **live** are separate Paddle accounts. Credentials, products, prices, and webhooks are **not** shared — recreate everything in live when you go to real charges.

Official checklist: [Go-live checklist](https://developer.paddle.com/build/go-live-checklist/).

### 3a. Sandbox (test cards, no real money)

1. Sign up / log in at [sandbox-vendors.paddle.com](https://sandbox-vendors.paddle.com)
2. **Catalog → Products** → create product `Talkotype Unlimited`
3. Add two **prices** (recurring):
   - Monthly · `$20 USD` / month
   - Yearly · `$168 USD` / year (or `$14/mo` billed yearly)
4. **Developer tools → Authentication**
   - Create a **client-side token** → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (starts with `test_`)
   - Create an **API key** → `PADDLE_API_KEY` (contains `_sdbx`)
5. **Developer tools → Notifications** (or **Events → Notifications**)
   - Destination URL: `https://talkotype.app/api/billing/paddle-webhook`
   - Events (minimum):
     - `subscription.created`
     - `subscription.activated`
     - `subscription.updated`
     - `subscription.canceled`
     - `transaction.completed`
     - `transaction.paid`
   - Copy the destination **secret key** → `PADDLE_WEBHOOK_SECRET`

```bash
NEXT_PUBLIC_PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_...
NEXT_PUBLIC_PADDLE_PRICE_MONTHLY=pri_...
NEXT_PUBLIC_PADDLE_PRICE_YEARLY=pri_...
PADDLE_API_KEY=..._sdbx_...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
```

Checkout opens from `/pricing` and Account → **Go Unlimited**. Overlay passes `customData.user_id` (Supabase user id) so the webhook can flip `profiles.plan` to `unlimited`.

Test card (sandbox): `4242 4242 4242 4242`, any future expiry, CVV `100`.

### 3b. Go live (real purchases)

Do this in the **live** dashboard: [vendors.paddle.com](https://vendors.paddle.com) — not sandbox.

1. **Create / open a live Paddle account** (separate from sandbox).
2. **Complete account verification** (business details, payout bank, tax). Live checkout stays blocked until Paddle approves you.
3. **Website / domain approval**
   - Default payment link / approved domain: `https://talkotype.app`
   - Public legal pages Paddle expects:
     - Terms: `https://talkotype.app/terms`
     - Privacy: `https://talkotype.app/privacy`
     - Pricing: `https://talkotype.app/pricing`
4. **Recreate catalog** (new live product + prices — do **not** reuse sandbox `pri_` ids):
   - Product: `Talkotype Unlimited`
   - Monthly `$20` · Yearly `$168` (same as sandbox)
5. **Live credentials** (Developer tools → Authentication)
   - Client-side token → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (**no** `test_` prefix)
   - API key → `PADDLE_API_KEY` (live key, **no** `_sdbx`)
6. **Live webhook** (Developer tools → Notifications)
   - Same URL: `https://talkotype.app/api/billing/paddle-webhook`
   - Same event list as sandbox
   - New destination secret → `PADDLE_WEBHOOK_SECRET` (replace the sandbox secret)
7. **Vercel → Project → Settings → Environment Variables** (Production; also Preview if you want):

```bash
NEXT_PUBLIC_PADDLE_ENV=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_...
NEXT_PUBLIC_PADDLE_PRICE_MONTHLY=pri_...   # LIVE monthly price id
NEXT_PUBLIC_PADDLE_PRICE_YEARLY=pri_...    # LIVE yearly price id
PADDLE_API_KEY=...                         # LIVE api key
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...       # LIVE notification secret
```

8. **Redeploy** after changing any `NEXT_PUBLIC_*` var (Vercel → Deployments → Redeploy, or `vercel --prod`). Public vars are baked into the client bundle at build time.
9. **Smoke test before opening traffic**
   - Create a **100% discount** coupon in live Paddle (or a tiny real charge you refund).
   - Buy Unlimited once while logged in → land on `/account?upgraded=1`
   - Confirm webhook delivery (Paddle → Events → Notifications → 2xx)
   - Confirm `profiles.plan = unlimited` in Supabase
10. Remove any “Sandbox checkout” note on `/pricing` (it hides automatically when `NEXT_PUBLIC_PADDLE_ENV=production`).

**Do not mix:** sandbox token + `ENV=production` (or live token + `ENV=sandbox`) → `forbidden` from Paddle.

DB fields: `profiles.paddle_customer_id`, `profiles.paddle_subscription_id`, `invoices.paddle_transaction_id`.

## 4. Transcription (Whisper first)

1. Set `GROQ_API_KEY` (default engine: Whisper via Groq).
2. Defaults: `TRANSCRIPTION_PROVIDER=whisper`, `TRANSCRIPTION_MODEL=whisper-large-v3-turbo`.
3. Optional: `ASSEMBLYAI_API_KEY` only if you set `TRANSCRIPTION_PROVIDER=assemblyai`.
4. Speaker labels: request `speakers: true` on upload API — allowed only when `profiles.plan = unlimited`.
5. Until Groq is set, process marks `transcription_provider_not_configured`.
