export const DESK_PAGE_SIZE = 20;

export type DeskPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function normalizePage(page: number, totalPages: number) {
  const safeTotal = Math.max(1, totalPages);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), safeTotal);
}

export function paginationFromTotal(
  total: number,
  page: number,
  pageSize = DESK_PAGE_SIZE,
): DeskPagination {
  const safeSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / safeSize));
  const safePage = normalizePage(page, totalPages);
  return {
    page: safePage,
    pageSize: safeSize,
    total: Math.max(0, total),
    totalPages,
  };
}

/** Compact page list: 1 … 4 5 6 … N */
export function visiblePageNumbers(
  page: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  const total = Math.max(1, totalPages);
  const current = normalizePage(page, total);
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

export function escapeIlike(value: string) {
  return value.replace(/[%_,]/g, (ch) => `\\${ch}`);
}
