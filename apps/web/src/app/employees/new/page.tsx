"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmployeeForm } from "@/components/employees/employee-form";
import { useCreateEmployee } from "@/lib/hooks";

export default function NewEmployeePage() {
  const router = useRouter();
  const create = useCreateEmployee();

  return (
    <>
      <div>
        <p className="text-sm text-muted">
          <Link href="/employees" className="text-accent hover:underline">
            Employees
          </Link>{" "}
          / Add employee
        </p>
        <h1 className="mt-1.5 text-3xl font-bold leading-9">Add employee</h1>
      </div>
      <EmployeeForm
        submitLabel="Save employee"
        onSubmit={async (data) => {
          const created = await create.mutateAsync(data);
          toast.success(`${created.fullName} was added`);
          router.push("/employees");
        }}
      />
    </>
  );
}
