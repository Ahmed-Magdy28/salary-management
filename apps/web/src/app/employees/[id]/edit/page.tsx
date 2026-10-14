"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmployeeForm } from "@/components/employees/employee-form";
import { ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/card";
import { toFormValues } from "@/lib/employee-form";
import { useEmployee, useUpdateEmployee } from "@/lib/hooks";

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const employee = useEmployee(id);
  const update = useUpdateEmployee(id);

  return (
    <>
      <div>
        <p className="text-sm text-muted">
          <Link href="/employees" className="text-accent hover:underline">
            Employees
          </Link>{" "}
          / Edit employee
        </p>
        <h1 className="mt-1.5 text-3xl font-bold leading-9">{employee.data ? employee.data.fullName : "Edit employee"}</h1>
      </div>
      {employee.isPending ? (
        <Skeleton className="h-96 max-w-[760px]" />
      ) : employee.isError ? (
        <ErrorState
          message={employee.error.message === "Employee not found" ? "This employee does not exist or was removed." : employee.error.message}
          onRetry={() => employee.refetch()}
        />
      ) : (
        <EmployeeForm
          key={employee.data.id}
          initial={toFormValues(employee.data)}
          submitLabel="Save changes"
          onSubmit={async (data) => {
            const saved = await update.mutateAsync(data);
            toast.success(`${saved.fullName} was updated`);
            router.push("/employees");
          }}
        />
      )}
    </>
  );
}
