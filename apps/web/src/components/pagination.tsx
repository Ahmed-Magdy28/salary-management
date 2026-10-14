"use client";

import { Button } from "./ui/button";
import { Select } from "./ui/field";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZES = [25, 50, 100];

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-3.5 text-sm text-muted">
      <span>
        Showing {first.toLocaleString("en-US")}-{last.toLocaleString("en-US")} of {total.toLocaleString("en-US")}
      </span>
      <div className="flex-1" />
      <label className="flex items-center gap-2">
        Rows per page
        <Select className="w-24" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </label>
      <Button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <span className="tabular" aria-live="polite">
        Page {page} of {pageCount}
      </span>
      <Button disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
