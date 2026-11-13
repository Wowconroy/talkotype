import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { loadDeskBootstrap } from "@/lib/desk-data";

export async function GET() {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const desk = await loadDeskBootstrap(user.id, user);
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
