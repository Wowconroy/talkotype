import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shared transcript",
    robots: { index: false, follow: false },
  };
}

export default function SharePage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
          Loading shared transcript…
        </div>
      }
    >
      <SharePageInner params={params} />
    </Suspense>
  );
}

async function SharePageInner({ params }: Props) {
  const { token } = await params;
  if (!token) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("transcripts")
    .select(
      "title, transcript_text, duration_seconds, created_at, user_id, share_enabled",
    )
    .eq("share_token", token)
    .eq("share_enabled", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  const { data: profile } = await admin
    .from("profiles")
    .select("email, display_name")
    .eq("id", data.user_id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-[2rem] border border-border/80 bg-white/95 p-7 shadow-[0_24px_50px_rgba(18,61,58,0.06)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sea">
          Shared transcript
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {data.title || "Untitled"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Shared by {profile?.display_name || "a Talkotype user"}
          {profile?.email ? ` (${profile.email})` : ""}. Anyone with this link
          can view the text.
        </p>

        <div className="mt-8 whitespace-pre-wrap rounded-2xl border border-border/70 bg-mist/50 px-5 py-5 text-sm leading-relaxed text-ink sm:text-base">
          {data.transcript_text?.trim()
            ? data.transcript_text
            : "This transcript does not have text yet."}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try Talkotype
          </Link>
          <Link
            href="/app"
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink"
          >
            Open my desk
          </Link>
        </div>
      </div>
    </div>
  );
}
