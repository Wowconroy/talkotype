import { redirect } from "next/navigation";
import { DeskShell } from "@/components/desk/desk-shell";
import { loadDeskBootstrap } from "@/lib/desk-data";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type PageProps = {
  searchParams?: Promise<{
    folder?: string;
    page?: string;
    q?: string;
  }>;
};

export default async function AppPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  // Cookie session only — proxy already verified claims for /app.
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user ?? null;
  if (!user) {
    redirect("/login?next=/app");
  }

  const sp = (await searchParams) ?? {};
  const pageRaw = Number(sp.page || "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  try {
    const desk = await loadDeskBootstrap(user.id, user, {
      page,
      folderId: sp.folder || null,
      q: sp.q?.trim() || "",
    });
    return (
      <DeskShell
        displayName={desk.displayName}
        initial={{
          transcripts: desk.transcripts,
          folders: desk.folders,
          usage: desk.usage,
          plan: desk.plan,
          ownerEmail: desk.ownerEmail,
          pagination: desk.pagination,
        }}
      />
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load your desk.";
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-20 text-center">
        <p className="font-display text-xl font-semibold text-ink">
          Desk hiccup
        </p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <a
          href="/app"
          className="mx-auto mt-2 inline-flex rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </a>
      </div>
    );
  }
}
