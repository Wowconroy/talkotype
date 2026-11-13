import { Suspense } from "react";
import { TranscriptViewer } from "./transcript-viewer";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export default function TranscriptPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
          Opening transcript…
        </div>
      }
    >
      <TranscriptPageInner params={params} />
    </Suspense>
  );
}

async function TranscriptPageInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TranscriptViewer id={id} />;
}
