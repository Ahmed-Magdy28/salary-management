import type { EmployeeDto } from "@salary/shared";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmployeeTable } from "./employee-table";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, prefetch: _prefetch, ...rest }: { children: React.ReactNode; href: string; prefetch?: boolean }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const lena: EmployeeDto = {
  id: "1",
  fullName: "Lena Fischer",
  email: "lena@acme.example",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "DE",
  currency: "EUR",
  salary: 72000,
  hireDate: "2021-03-15",
  status: "ACTIVE",
};
const old: EmployeeDto = { ...lena, id: "2", fullName: "Old Timer", email: "old@acme.example", status: "INACTIVE", country: "JP", currency: "JPY", salary: 6200000 };

const setup = (overrides: Partial<React.ComponentProps<typeof EmployeeTable>> = {}) => {
  const onSort = jest.fn();
  const onToggleStatus = jest.fn();
  render(<EmployeeTable rows={[lena, old]} sortBy="fullName" sortOrder="asc" onSort={onSort} onToggleStatus={onToggleStatus} {...overrides} />);
  return { onSort, onToggleStatus };
};

describe("EmployeeTable", () => {
  it("shows name, email, country name and salary in the local currency", () => {
    setup();
    const row = screen.getByText("Lena Fischer").closest('[role="row"]') as HTMLElement;
    expect(within(row).getByText("lena@acme.example")).toBeInTheDocument();
    expect(within(row).getByText("Germany")).toBeInTheDocument();
    expect(within(row).getByText("EUR 72,000")).toBeInTheDocument();
    expect(screen.getByText("JPY 6,200,000")).toBeInTheDocument();
  });

  it("offers Deactivate for active people and Reactivate for inactive ones", () => {
    setup();
    expect(screen.getByRole("button", { name: "Deactivate Lena Fischer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reactivate Old Timer" })).toBeInTheDocument();
  });

  it("passes the clicked employee to the status handler", async () => {
    const { onToggleStatus } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Deactivate Lena Fischer" }));
    expect(onToggleStatus).toHaveBeenCalledWith(lena);
  });

  it("links to the edit page", () => {
    setup();
    expect(screen.getByRole("link", { name: "Edit Lena Fischer" })).toHaveAttribute("href", "/employees/1/edit");
  });

  it("marks the sorted column and reports sort clicks", async () => {
    const { onSort } = setup({ sortBy: "salary", sortOrder: "desc" });
    expect(screen.getByRole("columnheader", { name: /salary/i })).toHaveAttribute("aria-sort", "descending");
    expect(screen.getByRole("columnheader", { name: /employee/i })).toHaveAttribute("aria-sort", "none");
    await userEvent.click(screen.getByRole("button", { name: /employee/i }));
    expect(onSort).toHaveBeenCalledWith("fullName");
  });
});
