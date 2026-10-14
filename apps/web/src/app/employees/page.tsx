import { Suspense } from "react";
import { EmployeesView } from "./employees-view";

export default function EmployeesPage() {
  return (
    <Suspense>
      <EmployeesView />
    </Suspense>
  );
}
