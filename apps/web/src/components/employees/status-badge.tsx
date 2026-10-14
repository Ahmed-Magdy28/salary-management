import type { EmployeeStatus } from "@salary/shared";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-[13px] font-semibold",
        active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
