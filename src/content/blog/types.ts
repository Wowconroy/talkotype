export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; title?: string; text: string }
  | {
      type: "sample";
      label: string;
      note?: string;
      lines: { time?: string; speaker?: string; text: string; mark?: "bad" | "good" | "note" }[];
    }
  | { type: "checklist"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "demo"; variant: "upload" | "waveform" | "fix" }
  | { type: "cta"; text: string; href: string; label: string };

export type BlogSource = {
  label: string;
  url: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  primaryQuery: string;
  intent: "informational" | "transactional" | "commercial";
  country: string;
  coverTheme: "coral" | "mint" | "lemon" | "ink" | "blush";
  coverIcon: "video" | "audio" | "doc" | "users" | "shield" | "wave" | "fix" | "clock";
  readingMinutes: number;
  related: string[];
  sources: BlogSource[];
  blocks: BlogBlock[];
  seoNotes?: string;
};
