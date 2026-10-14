"use client";

import type { EmployeeDto } from "@salary/shared";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeeTable, EmployeeTableSkeleton } from "@/components/employees/employee-table";
import { Pagination } from "@/components/pagination";
import { EmptyState, ErrorState } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEmployees, useFilterOptions, useOverview, useSetEmployeeStatus } from "@/lib/hooks";
import {
  applyChange,
  DEFAULT_LIST_STATE,
  parseListState,
  toApiQuery,
  toSearchParams,
  type EmployeeListState,
  type SortField,
} from "@/lib/employee-query-state";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const ConfirmDialog = dynamic(() => import("@/components/ui/confirm-dialog").then((m) => m.ConfirmDialog), { ssr: false });

export function EmployeesView() {
  const searchParams = useSearchParams();
  const state = useMemo(() => parseListState(new URLSearchParams(searchParams.toString())), [searchParams]);

  const employees = useEmployees(toApiQuery(state));
  const options = useFilterOptions();
  const overview = useOverview();
  const setStatus = useSetEmployeeStatus();
  const [target, setTarget] = useState<EmployeeDto | null>(null);

  // The URL only mirrors the filters (so views can be shared). Using the native history API keeps
  // useSearchParams in sync without asking the server for a new page on every filter change.
  const navigate = useCallback((next: EmployeeListState) => {
    const qs = toSearchParams(next).toString();
    window.history.replaceState(null, "", qs ? `/employees?${qs}` : "/employees");
  }, []);
  const update = useCallback((patch: Partial<EmployeeListState>) => navigate(applyChange(state, patch)), [navigate, state]);

  const onSort = (field: SortField) =>
    update(state.sortBy === field ? { sortOrder: state.sortOrder === "asc" ? "desc" : "asc" } : { sortBy: field, sortOrder: "asc" });

  const confirmToggle = () => {
    if (!target) return;
    const next = target.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatus.mutate(
      { id: target.id, status: next },
      {
        onSuccess: () => {
          toast.success(`${target.fullName} is now ${next === "ACTIVE" ? "active" : "inactive"}`);
          setTarget(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const data = employees.data;
  const deactivating = target?.status === "ACTIVE";

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold leading-9">Employees</h1>
          <p className="mt-1 text-[15px] text-muted">
            {overview.data ? `${formatNumber(overview.data.employees)} active employees across ${overview.data.countries} countries` : "Manage salary records"}
          </p>
        </div>
        <div className="flex-1" />
        <Link href="/employees/new" className={cn(buttonVariants({ variant: "primary" }))}>
          + Add employee
        </Link>
      </div>

      <EmployeeFilters
        state={state}
        options={options.data}
        onChange={update}
        onClear={() => navigate({ ...DEFAULT_LIST_STATE, sortBy: state.sortBy, sortOrder: state.sortOrder, pageSize: state.pageSize })}
      />

      <Card className="overflow-hidden">
        {employees.isPending ? (
          <EmployeeTableSkeleton />
        ) : employees.isError ? (
          <div className="p-5">
            <ErrorState message={employees.error.message} onRetry={() => employees.refetch()} />
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No employees match these filters" hint="Try a different search or clear the filters." />
          </div>
        ) : data ? (
          <div className={cn(employees.isPlaceholderData && "opacity-60 transition-opacity")}>
            <EmployeeTable rows={data.items} sortBy={state.sortBy} sortOrder={state.sortOrder} onSort={onSort} onToggleStatus={setTarget} />
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={(page) => update({ page })}
              onPageSizeChange={(pageSize) => update({ pageSize })}
            />
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={deactivating ? "Deactivate employee?" : "Reactivate employee?"}
        description={
          deactivating
            ? `${target?.fullName} will be hidden from the active list and excluded from salary insights. You can reactivate them later.`
            : `${target?.fullName} will be included in the active list and salary insights again.`
        }
        confirmLabel={deactivating ? "Deactivate" : "Reactivate"}
        destructive={deactivating}
        pending={setStatus.isPending}
        onConfirm={confirmToggle}
      />
    </>
  );
}
