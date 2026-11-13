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
];
