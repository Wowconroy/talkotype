"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type DeskPagination,
  visiblePageNumbers,
} from "@/lib/desk-pagination";

type Props = {
  pagination: DeskPagination;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function DeskPaginationBar({
  pagination,
  onPageChange,
  disabled = false,
}: Props) {
  if (pagination.total <= pagination.pageSize) return null;

  const pages = visiblePageNumbers(pagination.page, pagination.totalPages);
  const from =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {from}–{to} of {pagination.total}
      </p>
      <nav
        className="flex flex-wrap items-center gap-1"
        aria-label="Transcript pages"
      >
        <button
          type="button"
          disabled={disabled || pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-white text-ink transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((entry, index) =>
          entry === "ellipsis" ? (
            <span
              key={`e-${index}`}
              className="px-1.5 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(entry)}
              aria-current={entry === pagination.page ? "page" : undefined}
              className={`inline-flex size-9 items-center justify-center rounded-xl text-sm font-semibold transition disabled:opacity-60 ${
                entry === pagination.page
                  ? "bg-ink text-white"
                  : "border border-border bg-white text-ink hover:bg-mist"
              }`}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={disabled || pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-white text-ink transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}
