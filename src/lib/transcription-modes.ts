/**
 * Server-side Swift / Steady / Deep configuration.
 * Steady currently shares Turbo with Swift until FFmpeg prep/chunking is live;
 * the requested mode is still persisted so we can differentiate later.
 */

export type TranscriptionModeId = "fast" | "balanced" | "accurate";

export type ModeConfig = {
  id: TranscriptionModeId;
  productName: "Swift" | "Steady" | "Deep";
  model: string;
  provider: "whisper";
  tagline: string;
  /** Claim status until benchmarks land. */
  accuracyClaim: "operational" | "to_benchmark";
};

export const TRANSCRIPTION_MODE_CONFIG: Record<
  TranscriptionModeId,
  ModeConfig
> = {
  fast: {
    id: "fast",
    productName: "Swift",
    model: "whisper-large-v3-turbo",
    provider: "whisper",
    tagline: "Fastest turnaround",
    accuracyClaim: "operational",
  },
  balanced: {
    id: "balanced",
    productName: "Steady",
    // Full Whisper + lyric/speech prompt (better coverage than Turbo on songs).
    model: "whisper-large-v3",
    provider: "whisper",
    tagline: "Best everyday pick",
    accuracyClaim: "operational",
  },
  accurate: {
    id: "accurate",
    productName: "Deep",
    model: "whisper-large-v3",
    provider: "whisper",
    tagline: "Highest accuracy",
    accuracyClaim: "operational",
  },
};

export const ALLOWED_WHISPER_MODELS = new Set(
  Object.values(TRANSCRIPTION_MODE_CONFIG).map((m) => m.model),
);

export function resolveMode(
  input?: string | null,
): ModeConfig {
  if (input && input in TRANSCRIPTION_MODE_CONFIG) {
    return TRANSCRIPTION_MODE_CONFIG[input as TranscriptionModeId];
  }
  return TRANSCRIPTION_MODE_CONFIG.balanced;
}

export function resolveModelForMode(
  modeId?: string | null,
  explicitModel?: string | null,
): { mode: ModeConfig; model: string } {
  const mode = resolveMode(modeId);
  if (explicitModel && ALLOWED_WHISPER_MODELS.has(explicitModel)) {
    // Honor explicit model but keep requested mode id for reporting.
    return { mode, model: explicitModel };
  }
  return { mode, model: mode.model };
}

export function qualityForMode(
  modeId?: string | null,
): "standard" | "deep" {
  return modeId === "accurate" || modeId === "balanced" ? "deep" : "standard";
}

export function productNameForModel(model: string | null | undefined): string {
  if (!model) return "—";
  if (model === "whisper-large-v3") return "Deep";
  if (model === "whisper-large-v3-turbo") return "Swift";
  return model.replace(/^whisper-/, "");
}
