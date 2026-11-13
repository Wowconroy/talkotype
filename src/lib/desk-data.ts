import type { User } from "@supabase/supabase-js";
import type {
  DeskFolder,
  DeskTranscript,
  DeskUsage,
} from "@/components/desk/types";
import { ensureProfile } from "@/lib/ensure-profile";
import {
  DESK_PAGE_SIZE,
  escapeIlike,
  paginationFromTotal,
  type DeskPagination,
} from "@/lib/desk-pagination";
import { FREE_DAILY_TRANSCRIPTS } from "@/lib/plan-limits";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeskBootstrap = {
  displayName: string;
  plan: string;
  ownerEmail: string | null;
  usage: DeskUsage;
  folders: DeskFolder[];
  transcripts: DeskTranscript[];
  pagination: DeskPagination;
};

export type DeskListQuery = {
  page?: number;
  /** Folder id, or null/undefined for Recent (all files). */
  folderId?: string | null;
  q?: string;
};

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Free plan: daily_usage is the attempt counter (never lowered by deletes).
 * Only reclaim abandoned create reservations (no job after grace window).
 */
export async function reconcileFreeQuotaForUser(userId: string) {
  const admin = createAdminClient();
  const today = utcToday();

  try {
    await admin.rpc("release_orphaned_quota", { p_user_id: userId });
  } catch {
    // Best-effort; usage row below is still authoritative.
  }

  const { data: usage } = await admin
    .from("daily_usage")
    .select("transcripts_used")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  return {
    transcripts_used: usage?.transcripts_used ?? 0,
    usage_date: today,
    limit: FREE_DAILY_TRANSCRIPTS as number | null,
  };
}

type TranscriptRow = {
  id: string;
  title: string | null;
  status: string;
  duration_seconds: number | null;
  requested_language: string | null;
  source_filename: string | null;
  folder_id: string | null;
  source_url: string | null;
  source_kind: string | null;
  created_at: string;
  updated_at: string;
  content_revision: number | null;
  active_job_id: string | null;
  share_enabled: boolean | null;
  media_assets?: Array<{
    size_bytes?: number | null;
    kind?: string | null;
    expires_at?: string | null;
  }> | null;
  active_job?:
    | {
        model?: string | null;
        requested_mode?: string | null;
        stage?: string | null;
        progress_pct?: number | null;
      }
    | {
        model?: string | null;
        requested_mode?: string | null;
        stage?: string | null;
        progress_pct?: number | null;
      }[]
    | null;
};

function mapTranscriptRow(row: TranscriptRow): DeskTranscript {
  const media = Array.isArray(row.media_assets) ? row.media_assets : [];
  const original =
    media.find((m) => m.kind === "original") ?? media[0] ?? null;
  const job = Array.isArray(row.active_job)
    ? row.active_job[0]
    : row.active_job;
  const {
    media_assets: _omitMedia,
    active_job: _omitJob,
    ...rest
  } = row;
  return {
    ...rest,
    model: job?.model ?? null,
    requested_mode: job?.requested_mode ?? null,
    job_stage: job?.stage ?? null,
    progress_pct:
      typeof job?.progress_pct === "number" ? job.progress_pct : null,
    media_size_bytes: original?.size_bytes ?? null,
    media_expires_at: original?.expires_at ?? null,
  } as DeskTranscript;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTranscriptFilters(query: any, opts: DeskListQuery) {
  let next = query;
  if (opts.folderId) {
    next = next.eq("folder_id", opts.folderId);
  }
  const q = opts.q?.trim();
  if (q) {
    const safe = escapeIlike(q);
    next = next.or(
      `title.ilike.%${safe}%,source_filename.ilike.%${safe}%,source_url.ilike.%${safe}%`,
    );
  }
  return next;
}

async function attachJobMeta(
  admin: ReturnType<typeof createAdminClient>,
  list: TranscriptRow[],
): Promise<DeskTranscript[]> {
  const jobIds = list
    .map((row) => row.active_job_id)
    .filter((id): id is string => Boolean(id));

  let jobById = new Map<
    string,
    {
      model: string | null;
      requested_mode: string | null;
      stage: string | null;
      progress_pct: number | null;
    }
  >();
  if (jobIds.length > 0) {
    const { data: jobs } = await admin
      .from("transcription_jobs")
      .select("id, model, requested_mode, stage, progress_pct")
      .in("id", jobIds);
    jobById = new Map(
      (jobs ?? []).map((job) => [
        job.id as string,
        {
          model: (job.model as string | null) ?? null,
          requested_mode: (job.requested_mode as string | null) ?? null,
          stage: (job.stage as string | null) ?? null,
          progress_pct:
            typeof job.progress_pct === "number" ? job.progress_pct : null,
        },
      ]),
    );
  }

  return list.map((row) => {
    const mapped = mapTranscriptRow(row);
    if (row.active_job_id) {
      const meta = jobById.get(row.active_job_id);
      if (meta) {
        mapped.model = mapped.model ?? meta.model;
        mapped.requested_mode = mapped.requested_mode ?? meta.requested_mode;
        mapped.job_stage = mapped.job_stage ?? meta.stage;
        mapped.progress_pct = mapped.progress_pct ?? meta.progress_pct;
      }
    }
    return mapped;
  });
}

async function loadTranscriptsPage(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  opts: DeskListQuery = {},
): Promise<{ items: DeskTranscript[]; pagination: DeskPagination }> {
  const pageSize = DESK_PAGE_SIZE;
  const requestedPage = Math.max(1, Math.floor(opts.page ?? 1) || 1);
  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const selectWithJob =
    "id, title, status, duration_seconds, requested_language, source_filename, folder_id, source_url, source_kind, created_at, updated_at, content_revision, active_job_id, share_enabled, media_assets(size_bytes, kind, expires_at), active_job:transcription_jobs!active_job_id(model, requested_mode, stage, progress_pct)";
  const selectPlain =
    "id, title, status, duration_seconds, requested_language, source_filename, folder_id, source_url, source_kind, created_at, updated_at, content_revision, active_job_id, share_enabled, media_assets(size_bytes, kind, expires_at)";

  // One round-trip: embed media + active job model via FK.
  let primary = admin
    .from("transcripts")
    .select(selectWithJob, { count: "exact" })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);
  primary = applyTranscriptFilters(primary, opts);

  const { data, error, count } = await primary;

  if (!error && data) {
    const total = count ?? data.length;
    const pagination = paginationFromTotal(total, requestedPage, pageSize);
    // If the requested page is past the end, re-fetch the last page once.
    if (pagination.page !== requestedPage && total > 0) {
      return loadTranscriptsPage(admin, userId, {
        ...opts,
        page: pagination.page,
      });
    }
    return {
      items: (data as TranscriptRow[]).map(mapTranscriptRow),
      pagination,
    };
  }

  // Fallback if the FK embed alias isn't available in this project yet.
  let fallback = admin
    .from("transcripts")
    .select(selectPlain, { count: "exact" })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);
  fallback = applyTranscriptFilters(fallback, opts);

  const {
    data: rows,
    error: fallbackError,
    count: fallbackCount,
  } = await fallback;

  if (fallbackError) {
    throw new Error(fallbackError.message || error?.message);
  }

  const list = (rows ?? []) as TranscriptRow[];
  const total = fallbackCount ?? list.length;
  const pagination = paginationFromTotal(total, requestedPage, pageSize);
  if (pagination.page !== requestedPage && total > 0) {
    return loadTranscriptsPage(admin, userId, {
      ...opts,
      page: pagination.page,
    });
  }

  return {
    items: await attachJobMeta(admin, list),
    pagination,
  };
}

export async function loadDeskBootstrap(
  userId: string,
  user?: User | null,
  listQuery: DeskListQuery = {},
): Promise<DeskBootstrap> {
  const admin = createAdminClient();
  const today = utcToday();

  const [profileResult, foldersResult, usageResult, transcriptPage] =
    await Promise.all([
      admin
        .from("profiles")
        .select("display_name, email, plan")
        .eq("id", userId)
        .maybeSingle(),
      admin
        .from("folders")
        .select("id, name, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      admin
        .from("daily_usage")
        .select("transcripts_used, usage_date")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle(),
      loadTranscriptsPage(admin, userId, listQuery),
    ]);

  if (foldersResult.error) {
    throw new Error(foldersResult.error.message);
  }

  let profile = profileResult.data as {
    display_name?: string | null;
    email?: string | null;
    plan?: string | null;
  } | null;
  if (!profile && user) {
    profile = await ensureProfile(user);
  }
  if (!profile) {
    throw new Error("Profile not found");
  }

  const plan = (profile.plan as string) ?? "free";
  const stored = usageResult.data?.transcripts_used ?? 0;

  const usage: DeskUsage =
    plan === "free"
      ? {
          transcripts_used: stored,
          usage_date: today,
          limit: FREE_DAILY_TRANSCRIPTS,
        }
      : {
          transcripts_used: stored,
          usage_date: today,
          limit: null,
        };

  return {
    displayName:
      (profile.display_name as string) ||
      (profile.email as string)?.split("@")[0] ||
      "Friend",
    plan,
    ownerEmail: (profile.email as string) ?? null,
    usage,
    folders: (foldersResult.data as DeskFolder[]) ?? [],
    transcripts: transcriptPage.items,
    pagination: transcriptPage.pagination,
  };
}
