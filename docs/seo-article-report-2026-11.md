# Talkotype SEO report — 20 new articles + technical fixes (2026-11-13)

## Product facts verified against the app
- Formats: MP3, M4A, WAV, AAC, OGG, FLAC, MP4, MOV, WEBM, MKV
- Free: 3/day, first 30 minutes, TXT, 7-day media
- Unlimited: no daily cap, **3 hours / 5 GB** per file, 20/batch, speaker labels, PDF/DOCX/SRT/VTT, forever storage
- Click sentence/timestamp to play; Delete hard-wipes file + media
- Older blog copy that said “five hours” was corrected to three hours

## Search Console
Not available in this agent environment (no GSC credentials/MCP). Sitemap URL to submit after deploy: `https://talkotype.app/sitemap.xml`.

## Technical fixes verified
| Fix | Verification |
|---|---|
| `robots.txt` disallows `/app`, `/account`, `/api/`, `/reset-password`, `/auth/` | Present in `src/app/robots.ts`; build emits `/robots.txt` |
| Sitemap excludes account/desk; includes marketing + all blog URLs | `src/app/sitemap.ts`; build emits `/sitemap.xml` |
| `metadataBase` + OG siteName | `src/app/layout.tsx` |
| Account + share `noindex` | Metadata on those routes |
| BlogPosting + BreadcrumbList JSON-LD | `blog-article.tsx` |
| Production `npm run build` | Succeeded; 20 new slugs prerender under `/blog/[slug]` |
| Related-slug graph | 0 broken internal `related` links |

## Open / follow-up
- Submit sitemap in Google Search Console and inspect 5 hero URLs
- Field Core Web Vitals (CrUX) not measured here — recommend PageSpeed on `/`, `/blog`, `/pricing`, and one article after deploy
- Pricing UI still lists SRT (not VTT) in one bullet; code + FAQ/articles support VTT — optional copy sync
- Share pages intentionally `noindex` (user content)

## 20 new article URLs → target queries

| URL | Primary query |
|---|---|
| /blog/how-to-transcribe-zoom-recording | how to transcribe zoom recording |
| /blog/how-to-transcribe-teams-recording | how to transcribe microsoft teams recording |
| /blog/how-to-transcribe-google-meet-recording | how to transcribe google meet recording |
| /blog/how-to-transcribe-iphone-voice-memo | how to transcribe iphone voice memo |
| /blog/how-to-transcribe-whatsapp-voice-note | how to transcribe whatsapp voice note |
| /blog/how-to-convert-m4a-to-text | convert m4a to text |
| /blog/how-to-convert-wav-to-text | convert wav to text |
| /blog/how-to-transcribe-mov-video | how to transcribe mov video |
| /blog/how-to-transcribe-bilingual-interview | bilingual interview transcription |
| /blog/click-transcript-timestamp-to-play-audio | click transcript timestamp to play audio |
| /blog/how-to-export-srt-for-capcut | export srt for capcut |
| /blog/fix-missing-words-in-ai-transcript | fix missing words in ai transcript |
| /blog/how-to-transcribe-screen-recording | how to transcribe screen recording |
| /blog/how-to-share-a-transcript | how to share a transcript |
| /blog/how-to-organize-transcripts | how to organize transcripts |
| /blog/how-to-transcribe-customer-call | how to transcribe customer call |
| /blog/how-to-transcribe-journalism-interview | how to transcribe journalism interview |
| /blog/free-transcription-daily-limit-tips | free transcription daily limit |
| /blog/how-to-export-transcript-to-pdf | export transcript to pdf |
| /blog/voice-dictation-to-document | voice dictation to document |

Full keyword map (intent, examples, notes): `docs/seo-keyword-map-2026-11.md`.

## Strongest five + measurement plan
1. `/blog/how-to-transcribe-zoom-recording`
2. `/blog/how-to-transcribe-iphone-voice-memo`
3. `/blog/how-to-convert-m4a-to-text`
4. `/blog/how-to-export-srt-for-capcut`
5. `/blog/fix-missing-words-in-ai-transcript`

After launch (GSC + analytics):
- Impressions, clicks, CTR, average position for each URL and its primary query
- Landing-page sessions to `/signup` and `/app` attributed to these articles
- Re-check indexing coverage weekly for 4 weeks; expand internal links from older posts once positions appear

Volume/difficulty: **unknown** without a keyword tool or GSC history.
