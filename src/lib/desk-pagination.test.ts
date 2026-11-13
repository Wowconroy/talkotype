import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DESK_PAGE_SIZE,
  paginationFromTotal,
  visiblePageNumbers,
} from "./desk-pagination";

describe("desk pagination", () => {
  it("uses 20 items per page", () => {
    assert.equal(DESK_PAGE_SIZE, 20);
    const p = paginationFromTotal(45, 2);
    assert.equal(p.pageSize, 20);
    assert.equal(p.totalPages, 3);
    assert.equal(p.page, 2);
  });

  it("clamps page into range", () => {
    assert.equal(paginationFromTotal(10, 99).page, 1);
    assert.equal(paginationFromTotal(40, 0).page, 1);
  });

  it("builds compact page numbers", () => {
    assert.deepEqual(visiblePageNumbers(1, 3), [1, 2, 3]);
    assert.deepEqual(visiblePageNumbers(5, 12), [
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      12,
    ]);
  });
});
