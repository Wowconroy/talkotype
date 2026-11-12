import type { BlogPost } from "@/content/blog/types";

export const legacyPosts: BlogPost[] = [
  {
    slug: "stop-typing-start-talking",
    title: "Stop typing. Start talking. (Your wrists will throw a party.)",
    description:
      "A tiny guide to turning voice notes into docs you’ll actually reread.",
    date: "2026-11-04",
    primaryQuery: "voice notes to text workflow",
    intent: "informational",
    country: "US",
    coverTheme: "lemon",
    coverIcon: "audio",
    readingMinutes: 3,
    related: ["how-to-convert-mp3-to-text", "how-to-transcribe-a-podcast"],
    sources: [],
    blocks: [
      {
        type: "p",
        text: "Most of us think faster than we type. That’s not a character flaw. It’s a keyboard problem.",
      },
      {
        type: "p",
        text: "Talkotype is built for the messy middle: rambling voice notes, half-formed ideas, and meetings that refuse to stay on agenda. Capture first. Clean later.",
      },
      {
        type: "p",
        text: "Try this today: record a two-minute voice memo about your next task, drop it into Talkotype, and paste the transcript into your doc.",
      },
      {
        type: "cta",
        text: "Ready to quit the blank page?",
        href: "/signup",
        label: "Try Talkotype free",
      },
    ],
  },
  {
    slug: "meeting-notes-without-the-dread",
    title: "Meeting notes without the dread",
    description:
      "How to capture every decision without becoming the designated stenographer.",
    date: "2026-10-22",
    primaryQuery: "AI meeting notes",
    intent: "informational",
    country: "US",
    coverTheme: "mint",
    coverIcon: "users",
    readingMinutes: 3,
    related: ["meeting-recording-to-action-items", "how-to-label-speakers-in-transcript"],
    sources: [],
    blocks: [
      {
        type: "p",
        text: "Someone always gets volunteered to take notes. That someone can be software.",
      },
      {
        type: "p",
        text: "Record the call with consent, transcribe with speaker labels on Unlimited, then highlight decisions and next steps.",
      },
      {
        type: "cta",
        text: "Turn the next meeting into action items.",
        href: "/blog/meeting-recording-to-action-items",
        label: "Read the action-item guide",
      },
    ],
  },
  {
    slug: "podcast-to-newsletter",
    title: "From podcast episode to newsletter in one afternoon",
    description:
      "Transcribe once, remix forever — with a workflow that stays fun.",
    date: "2026-10-09",
    primaryQuery: "podcast transcript to newsletter",
    intent: "informational",
    country: "US",
    coverTheme: "coral",
    coverIcon: "audio",
    readingMinutes: 3,
    related: ["how-to-transcribe-a-podcast", "webinar-recording-to-blog-post"],
    sources: [],
    blocks: [
      {
        type: "p",
        text: "Your episode already has the content. Transcription is the bridge to clips, quotes, show notes, and a newsletter that doesn’t take all weekend.",
      },
      {
        type: "p",
        text: "Workflow: upload → transcript → pull three quotable moments → draft the email.",
      },
      {
        type: "cta",
        text: "Want the fuller podcast workflow?",
        href: "/blog/how-to-transcribe-a-podcast",
        label: "Read the podcast guide",
      },
    ],
  },
];
