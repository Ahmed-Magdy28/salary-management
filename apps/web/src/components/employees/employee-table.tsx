"use client";

import type { EmployeeDto } from "@salary/shared";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import type { SortField } from "@/lib/employee-query-state";
import { countryName, formatMoney, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

const GRID = "grid grid-cols-[2.4fr_1.6fr_1.2fr_1fr_1.3fr_.9fr_1.6fr] gap-3 px-5";
const AVATARS = ["bg-blue-100 text-blue-800", "bg-pink-100 text-pink-800", "bg-sky-100 text-sky-800", "bg-amber-100 text-amber-800", "bg-violet-100 text-violet-800", "bg-emerald-100 text-emerald-800"];

function avatarClass(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return AVATARS[hash % AVATARS.length];
}

interface Props {
  rows: EmployeeDto[];
  sortBy: SortField;
  sortOrder: "asc" | "desc";
  onSort: (field: SortField) => void;
  onToggleStatus: (employee: EmployeeDto) => void;
}

function SortHeader({ field, label, props, align }: { field: SortField; label: string; props: Props; align?: "right" }) {
  const active = props.sortBy === field;
  const Icon = props.sortOrder === "asc" ? ArrowUp : ArrowDown;
  return (
    <div role="columnheader" aria-sort={active ? (props.sortOrder === "asc" ? "ascending" : "descending") : "none"} className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => props.onSort(field)}
        className={cn("inline-flex min-h-9 items-center gap-1 rounded uppercase tracking-wide hover:text-ink", active && "text-ink")}
      >
        {label}
        {active && <Icon size={14} aria-hidden="true" />}
      </button>
    </div>
  );
}

export function EmployeeTable(props: Props) {
  const { rows, onToggleStatus } = props;
  return (
    <div className="overflow-x-auto" role="table" aria-label="Employees">
      <div className="min-w-[1040px]">
        <div role="row" className={cn(GRID, "items-center border-b border-line bg-slate-50 py-1 text-[13px] font-semibold uppercase tracking-wide text-muted")}>
          <SortHeader field="fullName" label="Employee" props={props} />
          <div role="columnheader">Job title</div>
          <div role="columnheader">Department</div>
          <div role="columnheader">Country</div>
          <SortHeader field="salary" label="Salary" props={props} align="right" />
          <div role="columnheader">Status</div>
          <div role="columnheader" className="text-right">
            Actions
          </div>
        </div>
        {rows.map((e) => (
          <div key={e.id} role="row" className={cn(GRID, "items-center border-b border-slate-100 py-3 text-[15px]")}>
            <div role="cell" className="flex min-w-0 items-center gap-3">
              <div aria-hidden="true" className={cn("flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-sm font-bold", avatarClass(e.fullName))}>
                {initials(e.fullName)}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold">{e.fullName}</div>
                <div className="truncate text-[13px] text-muted">{e.email}</div>
              </div>
            </div>
            <div role="cell">{e.jobTitle}</div>
            <div role="cell">{e.department}</div>
            <div role="cell">{countryName(e.country)}</div>
            <div role="cell" className="tabular text-right font-semibold">
              {formatMoney(e.salary, e.currency)}
            </div>
            <div role="cell">
              <StatusBadge status={e.status} />
            </div>
            <div role="cell" className="flex justify-end gap-2">
              <Link href={`/employees/${e.id}/edit`} aria-label={`Edit ${e.fullName}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                Edit
              </Link>
              <Button
                size="sm"
                variant={e.status === "ACTIVE" ? "danger" : "secondary"}
                aria-label={`${e.status === "ACTIVE" ? "Deactivate" : "Reactivate"} ${e.fullName}`}
                onClick={() => onToggleStatus(e)}
              >
                {e.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmployeeTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading employees" className="divide-y divide-slate-100">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4">
          <div className="h-[38px] w-[38px] animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
