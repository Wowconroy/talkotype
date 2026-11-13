export type TranscriptionMode = "fast" | "balanced" | "accurate";

export type DeskTranscript = {
  id: string;
  title: string;
  status: string;
  duration_seconds: number | null;
  requested_language: string | null;
  source_filename: string | null;
  folder_id: string | null;
  source_url: string | null;
  source_kind: "upload" | "link" | string;
  created_at: string;
  updated_at: string;
  content_revision: number;
  model: string | null;
  requested_mode?: TranscriptionMode | string | null;
  job_stage?: string | null;
  progress_pct?: number | null;
  media_size_bytes?: number | null;
  media_expires_at?: string | null;
  share_enabled?: boolean;
  share_token?: string | null;
};

export type DeskFolder = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type DeskUsage = {
  transcripts_used: number;
  usage_date: string;
  limit: number | null;
};

export type QuotaSnapshot = {
  transcripts_used: number;
  usage_date?: string | null;
  limit?: number | null;
};

export type DeskPlan = "free" | "unlimited" | string;

/** Maps product modes → Whisper models. */
export const MODE_TO_MODEL: Record<TranscriptionMode, string> = {
  fast: "whisper-large-v3-turbo",
  balanced: "whisper-large-v3",
  accurate: "whisper-large-v3",
};

export const MODE_PRODUCT_LABEL: Record<TranscriptionMode, string> = {
  fast: "Swift",
  balanced: "Steady",
  accurate: "Deep",
};

export const MODEL_TO_MODE_LABEL: Record<string, string> = {
  "whisper-large-v3-turbo": "Swift",
  "whisper-large-v3": "Steady",
};

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued",
  uploading: "Uploading",
  preparing_audio: "Preparing audio",
  chunking: "Splitting audio",
  transcribing: "Transcribing",
  publishing: "Finalising",
  awaiting_source: "Waiting for source",
  ready: "Ready",
  failed: "Failed",
};

export const AUDIO_LANGUAGES = [
  { value: "", label: "Auto-detect", flag: "🌐" },
  { value: "en", label: "English (US)", flag: "🇺🇸" },
  { value: "en-GB", label: "English (UK)", flag: "🇬🇧" },
  { value: "uk", label: "Ukrainian", flag: "🇺🇦" },
  { value: "pl", label: "Polish", flag: "🇵🇱" },
  { value: "de", label: "German", flag: "🇩🇪" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "pt", label: "Portuguese", flag: "🇵🇹" },
  { value: "it", label: "Italian", flag: "🇮🇹" },
  { value: "nl", label: "Dutch", flag: "🇳🇱" },
  { value: "ru", label: "Russian", flag: "🇷🇺" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
  { value: "zh", label: "Chinese", flag: "🇨🇳" },
  { value: "ko", label: "Korean", flag: "🇰🇷" },
] as const;

export const TRANSCRIPTION_MODES: {
  id: TranscriptionMode;
  name: string;
  tagline: string;
  accent: string;
}[] = [
  {
    id: "fast",
    name: "Swift",
    tagline: "Fastest turnaround",
    accent: "coral",
  },
  {
    id: "balanced",
    name: "Steady",
    tagline: "Clearer everyday text",
    accent: "sea",
  },
  {
    id: "accurate",
    name: "Deep",
    tagline: "Most careful pass",
    accent: "ink",
  },
];

export type TranscribeOptions = {
  language: string;
  mode: TranscriptionMode;
  speakers: boolean;
  transcribeToEnglish: boolean;
  filterFillers: boolean;
  preferTimestamps: boolean;
};

export const DEFAULT_TRANSCRIBE_OPTIONS: TranscribeOptions = {
  language: "en",
  mode: "fast",
  speakers: false,
  transcribeToEnglish: false,
  filterFillers: false,
  preferTimestamps: false,
};

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatUploaded(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function statusLabel(row: DeskTranscript) {
  if (row.source_kind === "link" && row.status === "queued") {
    return "Link queued";
  }
  if (row.status === "ready") return "Ready";
  if (row.status === "failed") return "Failed";

  const stage = row.job_stage;
  if (stage && STAGE_LABELS[stage]) {
    const pct =
      typeof row.progress_pct === "number" &&
      row.progress_pct > 0 &&
      row.progress_pct < 100
        ? ` · ${row.progress_pct}%`
        : "";
    return `${STAGE_LABELS[stage]}${pct}`;
  }

  switch (row.status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    default:
      return row.status;
  }
}

export function modeLabel(
  model: string | null,
  requestedMode?: string | null,
) {
  if (
    requestedMode === "fast" ||
    requestedMode === "balanced" ||
    requestedMode === "accurate"
  ) {
    return MODE_PRODUCT_LABEL[requestedMode];
  }
  if (!model) return "—";
  return MODEL_TO_MODE_LABEL[model] ?? model.replace("whisper-", "");
}

export function isActiveDeskStatus(row: DeskTranscript) {
  return (
    row.status === "queued" ||
    row.status === "processing" ||
    (row.job_stage != null &&
      !["ready", "failed"].includes(row.job_stage) &&
      row.status !== "ready" &&
      row.status !== "failed")
  );
}
