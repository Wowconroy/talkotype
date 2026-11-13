import type { BlogPost } from "@/content/blog/types";

/** Second SEO wave (2026-11-13): format + workflow long-tails not covered in seo-posts.ts */
export const seoPostsBatch2: BlogPost[] = [
  {
    slug: "how-to-transcribe-zoom-recording",
    title: "How to Transcribe a Zoom Recording",
    description:
      "Get text from a Zoom MP4 or cloud VTT. Compare Zoom’s built-in transcript with uploading the recording to Talkotype for editable text and exports.",
    date: "2026-11-13",
    primaryQuery: "how to transcribe zoom recording",
    intent: "informational",
    country: "US",
    coverTheme: "coral",
    coverIcon: "video",
    readingMinutes: 8,
    related: [
      "how-to-transcribe-teams-recording",
      "how-to-get-transcript-from-mp4",
      "how-to-label-speakers-in-transcript",
    ],
    sources: [
      {
        label: "Zoom Help: audio transcription for cloud recordings",
        url: "https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0064927",
      },
    ],
    seoNotes: "Competes with Zapier/Notta explainers; original angle = local MP4 + Talkotype click-to-play.",
    blocks: [
      {
        type: "p",
        text: "You have two honest paths: use Zoom’s cloud audio transcript when your plan supports it, or download the MP4 and run it through a transcription tool. This guide covers both, then shows a Talkotype workflow for people who need editable text, speaker labels, or exports Zoom does not give you on every plan.",
      },
      {
        type: "h2",
        text: "Option A: Zoom’s built-in cloud transcript",
      },
      {
        type: "p",
        text: "Zoom can generate an audio transcript for meetings recorded to the cloud when audio transcription is enabled. The result is typically a VTT file you can view or download from Recordings & Transcripts. Zoom documents the feature, including editing phrases and searching transcript text, in its [cloud recording transcription help article](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0064927).",
      },
      {
        type: "ul",
        items: [
          "You need cloud recording (and the right Zoom plan or admin settings).",
          "Transcription must be enabled before or for that recording path; local-only recordings do not get Zoom’s cloud VTT.",
          "VTT is timed captions-style text. Great for playback; less friendly as a meeting notes document.",
        ],
      },
      {
        type: "h2",
        text: "Option B: Upload the Zoom MP4 to Talkotype",
      },
      {
        type: "ol",
        items: [
          "In Zoom, download the recording MP4 (cloud or local).",
          "Confirm the file has audible speech — not a silent screen share.",
          "[Sign up for Talkotype](/signup) and open [your desk](/app).",
          "Upload the MP4, pick the spoken language if you know it, and start transcription.",
          "When it is ready, click any sentence or `(m:ss)` stamp to hear that moment, then fix names.",
          "Export TXT on Free, or PDF, DOCX, SRT, or VTT on [Unlimited](/pricing).",
        ],
      },
      { type: "demo", variant: "upload" },
      {
        type: "sample",
        label: "Sample Zoom standup excerpt (synthetic)",
        note: "Fictional meeting labels for illustration. Not a customer recording.",
        lines: [
          {
            time: "00:02:14",
            speaker: "Host",
            text: "Action item: ship the FAQ update before Friday standup.",
          },
          {
            time: "00:02:21",
            speaker: "Dev",
            text: "I will cut a Loom of the click-to-play timestamps after lunch.",
          },
          {
            time: "00:02:29",
            speaker: "Host",
            text: "Great. Pull two quotes for the changelog once the transcript lands.",
          },
        ],
      },
      {
        type: "h2",
        text: "When Talkotype is the better fit",
      },
      {
        type: "ul",
        items: [
          "You only have a local recording and no Zoom cloud transcript.",
          "You want a readable document plus optional [speaker labels](/blog/how-to-label-speakers-in-transcript) on Unlimited.",
          "You need to jump from text back into the audio while you clean names — see [click transcript timestamps to play audio](/blog/click-transcript-timestamp-to-play-audio).",
          "You are past Free’s daily three-transcript limit and need longer files (Unlimited: up to three hours / 5 GB per file).",
        ],
      },
      {
        type: "callout",
        title: "Consent",
        text: "Only process meetings you have the right to record and transcribe. Tell participants when you record.",
      },
      {
        type: "cta",
        text: "Have a Zoom MP4 ready?",
        href: "/signup",
        label: "Transcribe a Zoom recording",
      },
    ],
  },
  {
    slug: "how-to-transcribe-teams-recording",
    title: "How to Transcribe a Microsoft Teams Recording",
    description:
      "Download a Teams meeting recording and turn it into an editable transcript. Checklist for audio tracks, permissions, and Talkotype exports.",
    date: "2026-11-13",
    primaryQuery: "how to transcribe microsoft teams recording",
    intent: "informational",
    country: "US",
    coverTheme: "mint",
    coverIcon: "video",
    readingMinutes: 7,
    related: [
      "how-to-transcribe-zoom-recording",
      "how-to-transcribe-google-meet-recording",
      "meeting-recording-to-action-items",
    ],
    sources: [
      {
        label: "Microsoft Support: play and download Teams meeting recordings",
        url: "https://support.microsoft.com/en-us/office/play-and-download-a-meeting-recording-in-microsoft-teams-6d1ef322-05c6-40c0-9ad7-92bfadfc567e",
      },
    ],
    seoNotes: "Distinct from Zoom; cite Microsoft download help.",
    blocks: [
      {
        type: "p",
        text: "Teams stores meeting recordings where your org configured them (often OneDrive or SharePoint). Once you can play the file with sound, you can download it and transcribe it outside Teams.",
      },
      {
        type: "h2",
        text: "Get the recording file",
      },
      {
        type: "ol",
        items: [
          "Open the meeting chat or the recording link your org uses.",
          "Play a few seconds and confirm you hear speech, not only screen share.",
          "Download the video using the controls Microsoft documents for [playing and downloading Teams meeting recordings](https://support.microsoft.com/en-us/office/play-and-download-a-meeting-recording-in-microsoft-teams-6d1ef322-05c6-40c0-9ad7-92bfadfc567e).",
          "Keep the original filename or rename it to something clear like `q3-planning.mp4`.",
        ],
      },
      {
        type: "h2",
        text: "Transcribe in Talkotype",
      },
      {
        type: "ol",
        items: [
          "[Create a free account](/signup) and open [your desk](/app).",
          "Upload the Teams MP4 (or M4A if you exported audio only).",
          "Choose the meeting language when you know it.",
          "Review the transcript. On Unlimited, turn on speaker recognition when multiple people talk.",
          "Export TXT, or PDF/DOCX/SRT/VTT on Unlimited.",
        ],
      },
      { type: "demo", variant: "waveform" },
      {
        type: "checklist",
        items: [
          "Permission: you are allowed to retain and process this meeting.",
          "Audio present: volume meters move during talk.",
          "Length: Free transcribes the first 30 minutes; Unlimited accepts up to three hours per file.",
          "Follow-up: turn decisions into tasks with [meeting recording to action items](/blog/meeting-recording-to-action-items).",
        ],
      },
      {
        type: "sample",
        label: "Teams planning call sample (synthetic)",
        note: "Illustrative labels only.",
        lines: [
          {
            time: "00:08:02",
            speaker: "PM",
            text: "We freeze scope Friday. Anything not in the board waits until next sprint.",
          },
          {
            time: "00:08:11",
            speaker: "Eng",
            text: "I need the API contract by Wednesday or the mobile build slips.",
          },
        ],
      },
      {
        type: "cta",
        text: "Ready to turn a Teams recording into text?",
        href: "/signup",
        label: "Start free",
      },
    ],
  },
  {
    slug: "how-to-transcribe-google-meet-recording",
    title: "How to Transcribe a Google Meet Recording",
    description:
      "Find your Meet recording in Drive, confirm the audio track, and upload it to Talkotype for a searchable transcript.",
    date: "2026-11-13",
    primaryQuery: "how to transcribe google meet recording",
    intent: "informational",
    country: "US",
    coverTheme: "lemon",
    coverIcon: "video",
    readingMinutes: 7,
    related: [
      "how-to-transcribe-zoom-recording",
      "how-to-transcribe-teams-recording",
      "how-to-get-transcript-from-mp4",
    ],
    sources: [
      {
        label: "Google Meet Help: record a video meeting",
        url: "https://support.google.com/meet/answer/9308681",
      },
    ],
    seoNotes: "Distinct from YouTube transcript guide; Drive/Meet path.",
    blocks: [
      {
        type: "p",
        text: "Google Meet recordings usually land in the meeting organizer’s Google Drive (often a Meet Recordings folder). Transcription is separate from recording: you either use Google’s own tools where available, or download the video and run speech recognition elsewhere.",
      },
      {
        type: "h2",
        text: "Locate and download the file",
      },
      {
        type: "ol",
        items: [
          "Confirm recording was allowed for that Meet. Google documents who can record and where files go in [Meet recording help](https://support.google.com/meet/answer/9308681).",
          "Open Drive and find the MP4 for the meeting.",
          "Play it once. If speech is missing, you captured screen without mic — re-record is the only real fix.",
          "Download the MP4 to your computer.",
        ],
      },
      {
        type: "h2",
        text: "Talkotype path",
      },
      {
        type: "ol",
        items: [
          "[Sign up](/signup) → [desk](/app) → upload the Meet MP4.",
          "Pick the spoken language when you know it.",
          "Transcribe, then click timestamps to verify tricky names.",
          "Export TXT (Free) or richer formats on Unlimited.",
        ],
      },
      { type: "demo", variant: "upload" },
      {
        type: "callout",
        title: "Not the same as YouTube auto-captions",
        text: "A Meet recording in Drive is your meeting file. For public YouTube videos you own, see [how to get a YouTube video transcript](/blog/how-to-get-youtube-video-transcript) instead.",
      },
      {
        type: "cta",
        text: "Have a Meet MP4 in Drive?",
        href: "/signup",
        label: "Transcribe it free",
      },
    ],
  },
  {
    slug: "how-to-transcribe-iphone-voice-memo",
    title: "How to Transcribe an iPhone Voice Memo",
    description:
      "Share a Voice Memos M4A into Talkotype and get editable text. Includes AirDrop, Files, and cleanup tips for phone audio.",
    date: "2026-11-13",
    primaryQuery: "how to transcribe iphone voice memo",
    intent: "informational",
    country: "US",
    coverTheme: "blush",
    coverIcon: "audio",
    readingMinutes: 6,
    related: [
      "how-to-convert-m4a-to-text",
      "how-to-convert-mp3-to-text",
      "voice-dictation-to-document",
    ],
    sources: [
      {
        label: "Apple Support: use Voice Memos on iPhone",
        url: "https://support.apple.com/guide/iphone/make-a-recording-iph4d3e23c41/ios",
      },
    ],
    seoNotes: "Mobile long-tail; M4A native.",
    blocks: [
      {
        type: "p",
        text: "iPhone Voice Memos usually save as M4A. You do not need to convert to MP3 first. Get the file off the phone, upload it, and edit the transcript on a bigger screen.",
      },
      {
        type: "h2",
        text: "Move the memo off your iPhone",
      },
      {
        type: "ul",
        items: [
          "In Voice Memos, open the recording → Share → Save to Files, AirDrop, or Mail.",
          "Apple’s [Voice Memos guide](https://support.apple.com/guide/iphone/make-a-recording-iph4d3e23c41/ios) covers recording and managing clips if you need the stock UI path.",
          "On a Mac, AirDrop into Downloads, then drag into Talkotype in the browser.",
        ],
      },
      {
        type: "h2",
        text: "Transcribe",
      },
      {
        type: "ol",
        items: [
          "Open [Talkotype](/signup) on your phone or computer.",
          "Upload the M4A from [your desk](/app).",
          "Transcribe, skim for names, tap timestamps to re-listen on desktop.",
          "Export TXT, or keep polishing into a draft with [voice dictation to document](/blog/voice-dictation-to-document).",
        ],
      },
      { type: "demo", variant: "waveform" },
      {
        type: "sample",
        label: "Voice memo sample (synthetic)",
        note: "Demo memo text only.",
        lines: [
          {
            time: "00:00:03",
            text: "Idea for Friday: record a thirty-second product teaser while walking, then clean the transcript before the newsletter.",
          },
          {
            time: "00:00:14",
            text: "Also rename the coral button states. The mock looked loud on mobile.",
          },
        ],
      },
      {
        type: "h2",
        text: "Phone audio gotchas",
      },
      {
        type: "ul",
        items: [
          "Wind and pockets: expect more cleanup. See [background noise tips](/blog/transcribe-audio-with-background-noise).",
          "Very long memos: Free covers the first 30 minutes of a file; Unlimited goes up to three hours.",
          "Prefer a quiet room when the memo becomes a customer quote.",
        ],
      },
      {
        type: "cta",
        text: "Got a Voice Memo ready?",
        href: "/signup",
        label: "Transcribe an M4A",
      },
    ],
  },
  {
    slug: "how-to-transcribe-whatsapp-voice-note",
    title: "How to Transcribe a WhatsApp Voice Note",
    description:
      "Export a WhatsApp voice note and turn it into text you can search and paste. Practical steps for iPhone and Android, plus accuracy tips.",
    date: "2026-11-13",
    primaryQuery: "how to transcribe whatsapp voice note",
    intent: "informational",
    country: "US",
    coverTheme: "ink",
    coverIcon: "audio",
    readingMinutes: 6,
    related: [
      "how-to-transcribe-iphone-voice-memo",
      "how-to-convert-m4a-to-text",
      "transcribe-audio-with-background-noise",
    ],
    sources: [],
    seoNotes: "Mobile messaging long-tail; privacy callout.",
    blocks: [
      {
        type: "p",
        text: "WhatsApp voice notes are short audio files sitting inside a chat. Built-in playback does not give you a durable document. Export the note, upload it, and keep the text where your notes live.",
      },
      {
        type: "h2",
        text: "Export the voice note",
      },
      {
        type: "ol",
        items: [
          "Open the chat → long-press the voice note → Share or Forward options your OS shows.",
          "Save to Files / Downloads, or share to yourself by email so you have a real file.",
          "Prefer the original audio over a compressed re-record from speaker to mic.",
        ],
      },
      {
        type: "callout",
        title: "Privacy first",
        text: "Only transcribe voice notes you have permission to keep. Do not upload other people’s private messages without consent.",
      },
      {
        type: "h2",
        text: "Turn it into text with Talkotype",
      },
      {
        type: "ol",
        items: [
          "[Sign up](/signup) and open [your desk](/app).",
          "Upload the exported audio (often OGG, OPUS-in-container, M4A, or MP3 depending on device).",
          "Transcribe, then copy the lines you need into chat replies or a CRM note.",
        ],
      },
      {
        type: "sample",
        label: "WhatsApp note → cleaned line (synthetic)",
        note: "Illustrative before/after.",
        lines: [
          {
            mark: "bad",
            text: "Raw: “meet at for coffee by the old bakery if traffic okay”",
          },
          {
            mark: "good",
            text: "Clean: “Meet at 4 for coffee by the old bakery if traffic is okay.”",
          },
        ],
      },
      {
        type: "p",
        text: "Short notes are perfect for Free’s three transcripts a day. Noisy street audio? Read [transcribing with background noise](/blog/transcribe-audio-with-background-noise).",
      },
      {
        type: "cta",
        text: "Export a voice note and try it",
        href: "/signup",
        label: "Start free",
      },
    ],
  },
{
    slug: "how-to-convert-m4a-to-text",
    title: "How to Convert an M4A Recording to Text",
    description:
      "Turn an M4A voice memo or interview into searchable text without converting to MP3 first. Talkotype walkthrough and sample transcript.",
    date: "2026-11-13",
    primaryQuery: "convert m4a to text",
    intent: "informational",
    country: "US",
    coverTheme: "coral",
    coverIcon: "audio",
    readingMinutes: 6,
    related: [
      "how-to-transcribe-iphone-voice-memo",
      "how-to-convert-mp3-to-text",
      "how-to-convert-wav-to-text",
    ],
    sources: [],
    seoNotes: "Complements MP3 guide; Apple/voice-memo adjacent.",
    blocks: [
      {
        type: "p",
        text: "M4A is the default for many phone memos and interview apps. Converting M4A to text means speech recognition on the file, not a mandatory trip through an MP3 converter.",
      },
      {
        type: "h2",
        text: "Fast path in Talkotype",
      },
      {
        type: "ol",
        items: [
          "Keep the original M4A. Do not re-encode unless the file will not upload.",
          "[Sign up](/signup) and open [your desk](/app).",
          "Upload the M4A, choose the spoken language if you know it, and start transcription.",
          "Click timestamps to verify names, then export TXT (Free) or DOCX/PDF on Unlimited.",
        ],
      },
      { type: "demo", variant: "waveform" },
      {
        type: "sample",
        label: "M4A interview snippet (synthetic)",
        note: "Demo labels only.",
        lines: [
          {
            time: "00:01:02",
            speaker: "Host",
            text: "When did you switch the pricing page to yearly billing?",
          },
          {
            time: "00:01:08",
            speaker: "Guest",
            text: "Mid-October. The $14 monthly equivalent made the math easier to explain.",
          },
        ],
      },
      {
        type: "h2",
        text: "M4A vs MP3 vs WAV",
      },
      {
        type: "table",
        headers: ["Format", "Typical source", "Talkotype tip"],
        rows: [
          ["M4A", "iPhone Voice Memos, many recorders", "Upload as-is"],
          ["MP3", "Podcasts, shared downloads", "See [convert MP3 to text](/blog/how-to-convert-mp3-to-text)"],
          ["WAV", "Studio or lossless exports", "Larger files; still fine under plan limits"],
        ],
      },
      {
        type: "cta",
        text: "Have an M4A on your desk?",
        href: "/signup",
        label: "Convert M4A to text",
      },
    ],
  },
  {
    slug: "how-to-convert-wav-to-text",
    title: "How to Convert a WAV File to Text",
    description:
      "Transcribe WAV interviews and studio takes in Talkotype. Why lossless audio helps accuracy, plus size and export tips.",
    date: "2026-11-13",
    primaryQuery: "convert wav to text",
    intent: "informational",
    country: "US",
    coverTheme: "mint",
    coverIcon: "audio",
    readingMinutes: 6,
    related: [
      "how-to-convert-m4a-to-text",
      "how-to-convert-mp3-to-text",
      "what-affects-ai-transcription-accuracy",
    ],
    sources: [],
    seoNotes: "Lossless audio long-tail.",
    blocks: [
      {
        type: "p",
        text: "WAV keeps a full-fidelity soundtrack. That can help speech recognition when the room was already clean. The tradeoff is file size — still within Talkotype’s upload caps for most interview lengths.",
      },
      {
        type: "h2",
        text: "Do this",
      },
      {
        type: "ol",
        items: [
          "Export WAV from your DAW or recorder (mono or stereo is fine).",
          "Upload at [your desk](/app) after [signing up](/signup).",
          "Transcribe, then polish proper nouns once while listening.",
          "Export TXT, or Unlimited DOCX/PDF for stakeholders.",
        ],
      },
      {
        type: "callout",
        title: "Limits",
        text: "Free: three transcripts a day, first 30 minutes of a file. Unlimited: up to three hours or 5 GB per file. If a WAV is huge, export a high-quality M4A/MP3 of the same take.",
      },
      { type: "demo", variant: "upload" },
      {
        type: "p",
        text: "Accuracy still depends on mic placement and noise. Pair this guide with [what affects AI transcription accuracy](/blog/what-affects-ai-transcription-accuracy).",
      },
      {
        type: "cta",
        text: "Ready to transcribe a WAV?",
        href: "/signup",
        label: "Start free",
      },
    ],
  },
  {
    slug: "how-to-transcribe-mov-video",
    title: "How to Transcribe an MOV Video",
    description:
      "Upload QuickTime MOV files for transcription without extracting audio first. Troubleshooting silent exports and iPhone camera clips.",
    date: "2026-11-13",
    primaryQuery: "how to transcribe mov video",
    intent: "informational",
    country: "US",
    coverTheme: "lemon",
    coverIcon: "video",
    readingMinutes: 6,
    related: [
      "how-to-get-transcript-from-mp4",
      "how-to-transcribe-video-to-text",
      "how-to-transcribe-screen-recording",
    ],
    sources: [],
    seoNotes: "Complements MP4 guide; Apple camera/Final Cut angle.",
    blocks: [
      {
        type: "p",
        text: "MOV is a common container from iPhone cameras and Final Cut exports. Talkotype reads the audio track inside the MOV the same way it reads an MP4.",
      },
      {
        type: "ol",
        items: [
          "Play the MOV and confirm speech is audible.",
          "[Sign up](/signup) → [desk](/app) → upload the MOV.",
          "Transcribe, click sentences to re-listen, export what you need.",
        ],
      },
      {
        type: "h2",
        text: "MOV-specific snags",
      },
      {
        type: "ul",
        items: [
          "Silent screen recordings: re-export with microphone enabled. See [screen recording transcription](/blog/how-to-transcribe-screen-recording).",
          "Huge camera rolls: trim to the chapter you need, especially on Free’s 30-minute window.",
          "Odd codecs: if upload fails, re-export as H.264 MP4 and retry via [MP4 transcript guide](/blog/how-to-get-transcript-from-mp4).",
        ],
      },
      { type: "demo", variant: "upload" },
      {
        type: "cta",
        text: "Have an MOV with real audio?",
        href: "/signup",
        label: "Transcribe MOV",
      },
    ],
  },
  {
    slug: "how-to-transcribe-bilingual-interview",
    title: "How to Transcribe a Bilingual Interview",
    description:
      "Handle interviews that switch languages mid-sentence. Language picker tips, mixed EN/UA sample, and cleanup checklist for Talkotype.",
    date: "2026-11-13",
    primaryQuery: "bilingual interview transcription",
    intent: "informational",
    country: "US",
    coverTheme: "blush",
    coverIcon: "users",
    readingMinutes: 8,
    related: [
      "how-to-transcribe-ukrainian-audio-video",
      "how-to-transcribe-research-interview",
      "how-to-label-speakers-in-transcript",
    ],
    sources: [],
    seoNotes: "Distinct from Ukrainian-only guide; code-switching focus.",
    blocks: [
      {
        type: "p",
        text: "Bilingual interviews rarely stay in one language. People borrow words, switch for emphasis, or answer in the language of the question. Your job is to pick a primary language on upload, then clean the switches by ear.",
      },
      {
        type: "h2",
        text: "Before you upload",
      },
      {
        type: "ul",
        items: [
          "Note which language dominates the hour.",
          "List proper nouns in both languages (names, cities, product brands).",
          "Prefer separate mics when possible; crosstalk hurts every language equally.",
        ],
      },
      {
        type: "h2",
        text: "In Talkotype",
      },
      {
        type: "ol",
        items: [
          "Upload the interview from [your desk](/app).",
          "Set the language to the dominant spoken language. For Ukrainian-heavy tapes, also see [transcribe Ukrainian audio and video](/blog/how-to-transcribe-ukrainian-audio-video).",
          "On Unlimited, enable speaker labels so turns stay clear while languages flip.",
          "Click timestamps wherever a switch sounds wrong and fix that span only.",
        ],
      },
      {
        type: "sample",
        label: "Mixed EN/UA sample (synthetic)",
        note: "Illustrative code-switching. Not a customer interview.",
        lines: [
          {
            time: "00:12:04",
            speaker: "Interviewer",
            text: "Can you describe the launch week in Kyiv?",
          },
          {
            time: "00:12:09",
            speaker: "Guest",
            text: "We soft-launched on Monday. У вівторок вже були перші Unlimited підписки.",
          },
          {
            time: "00:12:18",
            speaker: "Interviewer",
            text: "And the FAQ — English only at first?",
          },
          {
            time: "00:12:22",
            speaker: "Guest",
            text: "Yes. Ukrainian answers came after we saw support tickets stacking up.",
          },
        ],
      },
      {
        type: "checklist",
        items: [
          "Do not silently translate quoted speech unless your style guide says so.",
          "Mark unclear switches with `[unclear]` while you listen once.",
          "Export DOCX on Unlimited when editors need tracked changes later.",
        ],
      },
      {
        type: "cta",
        text: "Working with a bilingual interview file?",
        href: "/signup",
        label: "Transcribe it",
      },
    ],
  },
  {
    slug: "click-transcript-timestamp-to-play-audio",
    title: "How to Click a Transcript Timestamp to Play Audio",
    description:
      "Use Talkotype’s inline timestamps to jump the player to the exact sentence you are editing. Workflow for verifying names, numbers, and unclear speech.",
    date: "2026-11-13",
    primaryQuery: "click transcript timestamp to play audio",
    intent: "informational",
    country: "US",
    coverTheme: "ink",
    coverIcon: "clock",
    readingMinutes: 5,
    related: [
      "how-to-add-timestamps-to-transcript",
      "how-to-fix-ai-transcript",
      "fix-missing-words-in-ai-transcript",
    ],
    sources: [],
    seoNotes: "Product feature page; pairs with timestamp theory article.",
    blocks: [
      {
        type: "p",
        text: "A timestamp is only useful if you can hear the moment it points to. In Talkotype, finished transcripts show compact inline `(m:ss)` stamps. Click a stamp or the sentence beside it to open the sticky player and seek there.",
      },
      {
        type: "h2",
        text: "How to use it",
      },
      {
        type: "ol",
        items: [
          "Open a completed transcript from [your desk](/app).",
          "Keep Show timestamps enabled in the side panel.",
          "Click any sentence — or its grey timestamp — to play from that point.",
          "Fix the line while it is fresh, then jump to the next uncertain span.",
        ],
      },
      { type: "demo", variant: "fix" },
      {
        type: "callout",
        title: "Why the layout is dense",
        text: "Timestamps sit between sentences in paragraph form so you can scan quickly. That is different from one sentence per row. For patterns and export formats, see [how to add timestamps to a transcript](/blog/how-to-add-timestamps-to-transcript).",
      },
      {
        type: "checklist",
        items: [
          "Verify every proper noun at least once.",
          "Re-listen spans with numbers, emails, and URLs.",
          "If audio will not seek, re-download or re-run transcription after media expires on Free (7-day storage).",
        ],
      },
      {
        type: "cta",
        text: "Want to try click-to-play on your own file?",
        href: "/signup",
        label: "Upload a recording",
      },
    ],
  },
{
    slug: "how-to-export-srt-for-capcut",
    title: "How to Export an SRT File for CapCut",
    description:
      "Clean a Talkotype transcript, export SRT on Unlimited, and import timed captions into CapCut. Includes a sample SRT block.",
    date: "2026-11-13",
    primaryQuery: "export srt for capcut",
    intent: "informational",
    country: "US",
    coverTheme: "coral",
    coverIcon: "doc",
    readingMinutes: 7,
    related: [
      "transcripts-vs-captions-vs-subtitles",
      "txt-vs-docx-vs-srt-vs-vtt",
      "how-to-fix-ai-transcript",
    ],
    sources: [
      {
        label: "W3C: captions / subtitles overview",
        url: "https://www.w3.org/WAI/media/av/captions/",
      },
    ],
    seoNotes: "Editor-specific export intent; Unlimited SRT.",
    blocks: [
      {
        type: "p",
        text: "CapCut expects timed caption files. SRT is the common interchange format: numbered cues with start/end times and one or two lines of text. Talkotype Unlimited can export SRT after you clean the transcript.",
      },
      {
        type: "h2",
        text: "Prepare the transcript first",
      },
      {
        type: "ol",
        items: [
          "Transcribe your video in [Talkotype](/app).",
          "Fix names and numbers while clicking timestamps to listen.",
          "Keep lines short enough to read on mobile — captions are not a paragraph dump. W3C’s [captions overview](https://www.w3.org/WAI/media/av/captions/) is a good reminder of why timing and readability matter.",
        ],
      },
      {
        type: "h2",
        text: "Export SRT from Talkotype",
      },
      {
        type: "ol",
        items: [
          "Open the ready transcript on Unlimited.",
          "Export **SRT** (VTT is also available if your editor prefers it).",
          "In CapCut, import captions / subtitles from the SRT file and nudge cues if the cut length changed.",
        ],
      },
      {
        type: "sample",
        label: "Sample SRT cues (synthetic)",
        note: "Illustrative file fragment.",
        lines: [
          { mark: "note", text: "1" },
          { mark: "note", text: "00:00:04,000 --> 00:00:07,200" },
          { text: "We ship the hero today." },
          { mark: "note", text: "2" },
          { mark: "note", text: "00:00:07,200 --> 00:00:11,000" },
          { text: "Record a Loom walkthrough after lunch." },
        ],
      },
      {
        type: "callout",
        title: "Plan note",
        text: "SRT and VTT exports are Unlimited features on [pricing](/pricing). Free exports TXT for notes. Format differences: [TXT vs DOCX vs SRT vs VTT](/blog/txt-vs-docx-vs-srt-vs-vtt).",
      },
      {
        type: "cta",
        text: "Need captions for a short cut?",
        href: "/pricing",
        label: "See Unlimited exports",
      },
    ],
  },
  {
    slug: "fix-missing-words-in-ai-transcript",
    title: "How to Fix Missing Words in an AI Transcript",
    description:
      "Recover quiet speech, dropouts, and skipped phrases after automatic transcription. Checklist, before-and-after sample, and when to re-run the file.",
    date: "2026-11-13",
    primaryQuery: "fix missing words in ai transcript",
    intent: "informational",
    country: "US",
    coverTheme: "mint",
    coverIcon: "fix",
    readingMinutes: 7,
    related: [
      "how-to-fix-ai-transcript",
      "transcribe-audio-with-background-noise",
      "what-affects-ai-transcription-accuracy",
      "click-transcript-timestamp-to-play-audio",
    ],
    sources: [],
    seoNotes: "Distinct from general fix guide; focuses on omissions.",
    blocks: [
      {
        type: "p",
        text: "Missing words are different from wrong words. The transcript looks fluent, but a clause never appeared. Usually the mic was quiet, someone turned away, or a burst of noise covered the phrase.",
      },
      {
        type: "h2",
        text: "Find the gaps",
      },
      {
        type: "ul",
        items: [
          "Skim while listening with [click-to-play timestamps](/blog/click-transcript-timestamp-to-play-audio).",
          "Watch for sudden topic jumps — a missing sentence often sits between two confident lines.",
          "Search for known proper nouns that never show up.",
        ],
      },
      {
        type: "sample",
        label: "Quiet aside recovered (synthetic)",
        note: "Labeled demo.",
        lines: [
          {
            mark: "bad",
            time: "00:04:12",
            text: "We will ship Friday and announce next week.",
          },
          {
            mark: "good",
            time: "00:04:12",
            text: "We will ship Friday — unless legal blocks the claim — and announce next week.",
          },
        ],
      },
      {
        type: "h2",
        text: "Fix or re-transcribe?",
      },
      {
        type: "checklist",
        items: [
          "One missing aside: type it in while the player is parked on that stamp.",
          "Many gaps across the whole file: improve audio (gain, denoise) and run again — see [background noise](/blog/transcribe-audio-with-background-noise).",
          "Systematic soft speech: closer mic next time; accuracy factors in [what affects AI transcription accuracy](/blog/what-affects-ai-transcription-accuracy).",
        ],
      },
      {
        type: "p",
        text: "For punctuation and wrong words rather than omissions, use the broader [how to fix an AI transcript](/blog/how-to-fix-ai-transcript) checklist.",
      },
      {
        type: "cta",
        text: "Upload a clearer take or clean the current one",
        href: "/signup",
        label: "Open Talkotype",
      },
    ],
  },
  {
    slug: "how-to-transcribe-screen-recording",
    title: "How to Transcribe a Screen Recording",
    description:
      "Avoid silent Loom and OS captures. Confirm the microphone channel, then transcribe the file in Talkotype for searchable walkthrough notes.",
    date: "2026-11-13",
    primaryQuery: "how to transcribe screen recording",
    intent: "informational",
    country: "US",
    coverTheme: "lemon",
    coverIcon: "video",
    readingMinutes: 6,
    related: [
      "how-to-transcribe-mov-video",
      "how-to-get-transcript-from-mp4",
      "webinar-recording-to-blog-post",
    ],
    sources: [],
    seoNotes: "Silent-mic trap is the unique angle.",
    blocks: [
      {
        type: "p",
        text: "Screen recordings fail transcription for one boring reason: no microphone track. The picture looks fine; the waveform is flat. Fix the capture settings, then upload.",
      },
      {
        type: "h2",
        text: "Before you hit record",
      },
      {
        type: "ul",
        items: [
          "Enable microphone input in Loom, QuickTime, OBS, or your OS picker.",
          "Do a five-second test and watch the input meter.",
          "Mute system notification sounds that drown soft speech.",
        ],
      },
      {
        type: "h2",
        text: "Transcribe the walkthrough",
      },
      {
        type: "ol",
        items: [
          "Export MP4 or MOV with audio.",
          "Upload at [your desk](/app).",
          "Turn the transcript into a help article or changelog using [webinar to blog post](/blog/webinar-recording-to-blog-post) as a structure reference.",
        ],
      },
      {
        type: "sample",
        label: "Silent vs mic-enabled capture (synthetic log)",
        lines: [
          {
            mark: "bad",
            text: "demo-v1.mov — waveform flat 0:00–3:40. No transcriptable speech.",
          },
          {
            mark: "good",
            text: "demo-v2.mov — mic enabled. Transcript length matches a 3:40 narration.",
          },
        ],
      },
      {
        type: "cta",
        text: "Got a narrated screen capture?",
        href: "/signup",
        label: "Transcribe it",
      },
    ],
  },
  {
    slug: "how-to-share-a-transcript",
    title: "How to Share a Talkotype Transcript",
    description:
      "Share a read-only transcript link, or export a file when people need DOCX or PDF. Privacy checklist before you send anything.",
    date: "2026-11-13",
    primaryQuery: "how to share a transcript",
    intent: "informational",
    country: "US",
    coverTheme: "blush",
    coverIcon: "doc",
    readingMinutes: 5,
    related: [
      "how-to-transcribe-confidential-recordings",
      "how-to-export-transcript-to-pdf",
      "txt-vs-docx-vs-srt-vs-vtt",
    ],
    sources: [],
    seoNotes: "Product share feature + privacy.",
    blocks: [
      {
        type: "p",
        text: "Sometimes teammates need the text without an account. Talkotype can share a read-only link from a ready transcript. For formal reviews, export a file instead.",
      },
      {
        type: "h2",
        text: "Share link",
      },
      {
        type: "ol",
        items: [
          "Open the transcript on [your desk](/app).",
          "Use Share transcript and copy the link.",
          "Send it only to people who should see that conversation.",
        ],
      },
      {
        type: "h2",
        text: "Export instead",
      },
      {
        type: "ul",
        items: [
          "TXT on Free for quick paste.",
          "PDF or DOCX on Unlimited for comments and archives — see [export transcript to PDF](/blog/how-to-export-transcript-to-pdf).",
          "SRT/VTT when the share is really about captions.",
        ],
      },
      {
        type: "callout",
        title: "Privacy",
        text: "Anyone with the link can read the text. For sensitive material, prefer exports you control and read [transcribe confidential recordings](/blog/how-to-transcribe-confidential-recordings). Delete the file when the share should end.",
      },
      {
        type: "cta",
        text: "Transcribe first, then share cleanly",
        href: "/signup",
        label: "Start free",
      },
    ],
  },
  {
    slug: "how-to-organize-transcripts",
    title: "How to Organize Transcripts in Talkotype",
    description:
      "Use folders, clear titles, and a simple naming scheme so meeting and interview transcripts stay findable on your desk.",
    date: "2026-11-13",
    primaryQuery: "how to organize transcripts",
    intent: "informational",
    country: "US",
    coverTheme: "ink",
    coverIcon: "doc",
    readingMinutes: 5,
    related: [
      "meeting-recording-to-action-items",
      "how-to-share-a-transcript",
      "free-transcription-daily-limit-tips",
    ],
    sources: [],
    seoNotes: "Desk folders feature.",
    blocks: [
      {
        type: "p",
        text: "A pile of Untitled transcripts wastes the whole point of searchable text. Spend thirty seconds on titles and folders when each job finishes.",
      },
      {
        type: "h2",
        text: "A simple scheme",
      },
      {
        type: "ul",
        items: [
          "`YYYY-MM-DD · topic · people` — example: `2026-11-13 · pricing FAQ · Alex+Melania`.",
          "Folders by project or client on [your desk](/app).",
          "Move finished work out of Recent when the sprint ends.",
        ],
      },
      {
        type: "checklist",
        items: [
          "Rename before you share or export.",
          "Delete test uploads so lifetime clutter does not confuse the desk (stats may still count all-time totals).",
          "Keep action-item notes linked from [meeting recordings to action items](/blog/meeting-recording-to-action-items).",
        ],
      },
      {
        type: "cta",
        text: "Bring order to the next upload",
        href: "/app",
        label: "Open your desk",
      },
    ],
  },
];
