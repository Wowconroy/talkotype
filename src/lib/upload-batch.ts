import { isAcceptedMediaFile } from "@/lib/accepted-media";
import {
  formatBytes,
  maxConcurrentJobs,
  maxUploadBytes,
  type PlanTier,
  UNLIMITED_UPLOAD_POOL,
} from "@/lib/plan-limits";

export type UploadCandidate = {
  name: string;
  size: number;
  type?: string | null;
};

export type BatchDecision =
  | {
      ok: true;
      files: UploadCandidate[];
      truncated: boolean;
      needsChoice: false;
      uploadPool: number;
      maxBatch: number;
    }
  | {
      ok: false;
      needsChoice: true;
      files: UploadCandidate[];
      error: string;
      maxBatch: number;
      uploadPool: number;
    }
  | {
      ok: false;
      needsChoice: false;
      files: [];
      error: string;
      maxBatch: number;
      uploadPool: number;
    };

/** Client + server: how many files may enter a single drop/browse batch. */
export function maxBatchSize(plan: PlanTier) {
  return maxConcurrentJobs(plan);
}

export function uploadPoolSize(plan: PlanTier) {
  return plan === "unlimited" ? UNLIMITED_UPLOAD_POOL : 1;
}

/**
 * Shared free/paid batch rules for drag-drop and browse.
 * Free: one file; multiple → needsChoice so the UI can ask which one.
 * Paid: take first 20; flag truncated if more were dropped.
 */
export function selectUploadBatch(
  plan: PlanTier,
  files: UploadCandidate[],
): BatchDecision {
  const maxBatch = maxBatchSize(plan);
  const pool = uploadPoolSize(plan);

  if (files.length === 0) {
    return {
      ok: false,
      needsChoice: false,
      files: [],
      error: "No files selected.",
      maxBatch,
      uploadPool: pool,
    };
  }

  if (plan === "free") {
    if (files.length > 1) {
      return {
        ok: false,
        needsChoice: true,
        files: files.slice(0, 12),
        error:
          "Free plan allows one active upload at a time. Choose which file to upload.",
        maxBatch,
        uploadPool: pool,
      };
    }
    return {
      ok: true,
      files: files.slice(0, 1),
      truncated: false,
      needsChoice: false,
      uploadPool: pool,
      maxBatch,
    };
  }

  const truncated = files.length > maxBatch;
  return {
    ok: true,
    files: files.slice(0, maxBatch),
    truncated,
    needsChoice: false,
    uploadPool: pool,
    maxBatch,
  };
}

/** Validate a single file against format + plan size before create/upload. */
export function validateUploadCandidate(
  plan: PlanTier,
  file: UploadCandidate,
): { ok: true } | { ok: false; error: string } {
  const accepted = isAcceptedMediaFile({
    filename: file.name,
    contentType: file.type,
  });
  if (!accepted.ok) return accepted;

  const cap = maxUploadBytes(plan);
  if (file.size > cap) {
    return {
      ok: false,
      error: `“${file.name}” is too large for your plan (max ${formatBytes(cap)}).`,
    };
  }
  if (file.size <= 0) {
    return { ok: false, error: `“${file.name}” is empty.` };
  }
  return { ok: true };
}

/**
 * Server-side concurrent slot check helper (pure).
 * RPC count_active_jobs supplies activeCount.
 */
export function canStartNewJob(params: {
  plan: PlanTier;
  activeCount: number;
  requestingCount?: number;
}): { ok: true } | { ok: false; error: string; maxConcurrent: number } {
  const maxConcurrent = maxConcurrentJobs(params.plan);
  const requesting = params.requestingCount ?? 1;
  if (params.activeCount + requesting - 1 >= maxConcurrent) {
    return {
      ok: false,
      maxConcurrent,
      error:
        params.plan === "unlimited"
          ? `Too many files processing (max ${maxConcurrent} at once). Wait for some to finish.`
          : "Free plan processes one file at a time. Wait for it to finish, or go Unlimited.",
    };
  }
  return { ok: true };
}
