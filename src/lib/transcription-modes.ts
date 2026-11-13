/**
 * Server-side Swift / Steady / Deep configuration.
 * Modes are intentionally different engines + quality passes.
 */

export type TranscriptionModeId = "fast" | "balanced" | "accurate";

export type QualityTier = "standard" | "enhanced" | "deep";

export type ModeConfig = {
  id: TranscriptionModeId;
  productName: "Swift" | "Steady" | "Deep";
  model: string;
  provider: "whisper";
  tagline: string;
  quality: QualityTier;
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
    quality: "standard",
    accuracyClaim: "operational",
  },
  balanced: {
    id: "balanced",
    productName: "Steady",
    model: "whisper-large-v3",
    provider: "whisper",
    tagline: "Clearer everyday text",
    // Full Whisper + second vocab pass (stronger than Swift).
    quality: "enhanced",
    accuracyClaim: "operational",
  },
  accurate: {
    id: "accurate",
    productName: "Deep",
    model: "whisper-large-v3",
    provider: "whisper",
    tagline: "Most careful pass",
    // Full Whisper + second pass + aggressive FFmpeg gap fill.
    quality: "deep",
    accuracyClaim: "operational",
  },
};

export const ALLOWED_WHISPER_MODELS = new Set(
  Object.values(TRANSCRIPTION_MODE_CONFIG).map((m) => m.model),
);

export function resolveMode(input?: string | null): ModeConfig {
  if (input && input in TRANSCRIPTION_MODE_CONFIG) {
    return TRANSCRIPTION_MODE_CONFIG[input as TranscriptionModeId];
  }
  return TRANSCRIPTION_MODE_CONFIG.fast;
}

export function resolveModelForMode(
  modeId?: string | null,
  explicitModel?: string | null,
): { mode: ModeConfig; model: string } {
  const mode = resolveMode(modeId);
  if (explicitModel && ALLOWED_WHISPER_MODELS.has(explicitModel)) {
    return { mode, model: explicitModel };
  }
  return { mode, model: mode.model };
}

export function qualityForMode(modeId?: string | null): QualityTier {
  return resolveMode(modeId).quality;
}

export function productNameForModel(model: string | null | undefined): string {
  if (!model) return "—";
  if (model === "whisper-large-v3") return "Deep";
  if (model === "whisper-large-v3-turbo") return "Swift";
  return model.replace(/^whisper-/, "");
}
