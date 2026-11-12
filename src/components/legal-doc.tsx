import type { ReactNode } from "react";

export function LegalDoc({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Effective date: {effectiveDate}
      </p>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink/90 [&_a]:font-semibold [&_a]:text-coral [&_a]:underline [&_a]:underline-offset-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-ink [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:mt-3 [&_table]:mt-4 [&_td]:border [&_td]:border-border/80 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border [&_th]:border-border/80 [&_th]:bg-mist [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
