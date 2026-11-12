# Talkotype legal review checklist (internal — not public)

Unresolved facts and decisions that must be confirmed before treating `/terms` and `/privacy` as final.

## Product verification (as of Nov 12, 2026)

| Area | Verified in repo / deployment | Not verified / not live |
|------|-------------------------------|-------------------------|
| Website hosting | Vercel project `talkotype`, domain `talkotype.app` | — |
| Authentication | Browser `localStorage` sessions; email signup hashes password locally; “Google” sign-in is a client-side stub | Real Google OAuth, Supabase Auth, server sessions |
| File upload | UI placeholder only (“coming online next”) | Upload API, object storage, virus scanning |
| Transcription | Not implemented | AssemblyAI / Whisper / other provider account settings |
| Storage of originals | Not implemented | Cloudflare R2 or other; seven-day auto-delete of originals |
| Transcript storage | Schema drafted for Supabase; **no Talkotype Supabase project created** | Live DB, RLS, backups |
| Payments | Pricing UI only ($20/mo or $14/mo yearly / $168) | Stripe (or other), invoices, tax, refunds automation |
| Email product | Contact addresses in copy | Confirmed mailbox ownership / support tooling |
| Analytics | No first-party analytics SDK in app code | Vercel Analytics / Speed Insights enabled in dashboard |
| Cookies | Session/account data in `localStorage` | Cookie banner / consent tooling |

**Do not publish** claims that Talkotype uses Cloudflare R2, AssemblyAI, or seven-day deletion of originals until those are implemented and configured.

## Legal / business decisions needed

1. **Legal operator** — Exact registered entity name, address, company number, and role (controller vs processor for B2B).
2. **Target markets** — Countries of offer; consumer vs B2B mix; language of contracts.
3. **Governing law & venue** — Country/state and courts or arbitration; consumer carve-outs.
4. **Privacy contact** — Confirm `privacy@talkotype.app` and `hello@talkotype.app` are monitored; add DPO if required.
5. **Lawful bases (GDPR/UK GDPR)** — Contract, legitimate interests assessments, consent for marketing emails.
6. **Subprocessors** — Final list + DPA template for business customers once cloud processing is live.
7. **AI training / human review** — Explicit product decision and matching provider contract terms (zero-retention, no training, etc.).
8. **Retention** — Exact periods for originals, derived audio, transcripts, logs, backups; deletion SLAs.
9. **Billing rules** — Refund policy, chargebacks, VAT/sales tax, proration, what happens to stored files after cancel or lapse.
10. **Team / org accounts** — If multi-seat sharing ships, update ownership and access sections.
11. **Children** — Age gate (currently 16+ draft language); confirm legal minimum.
12. **Regulator** — If EU/UK representative or supervisory authority notice is required.

## Suggested next engineering steps before “live upload” privacy claims

1. Create dedicated Talkotype Supabase (or other) project and apply migrations.
2. Implement upload → storage → transcription → export → delete end-to-end.
3. Document provider names, regions, retention settings, and training/human-review flags in this file.
4. Update `/privacy` retention table and subprocessor section with verified values.
5. Add upload-time notice wired to the real retention/provider text.
