import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { loadDeskBootstrap } from "@/lib/desk-data";

export async function GET(request: Request) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const pageRaw = Number(url.searchParams.get("page") || "1");
    const page = Number.isFinite(pageRaw) ? pageRaw : 1;
    const folder = url.searchParams.get("folder");
    const q = url.searchParams.get("q")?.trim() || "";

    const desk = await loadDeskBootstrap(user.id, user, {
      page,
      folderId: folder || null,
      q,
    });
    return NextResponse.json(desk);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load desk.",
      },
      { status: 500 },
    );
  }
}
