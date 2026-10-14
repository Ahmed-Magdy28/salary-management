import type { ImportResultDto } from "@salary/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import { mapSpreadsheetRows } from "@/lib/import/map-rows";
import { ImportPreview } from "./import-preview";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/api", () => ({ api: { importEmployees: jest.fn() } }));

const header = ["Full name", "Email", "Job title", "Department", "Country", "Annual salary", "Hire date"];
const good = (n: number) => [`Person ${n}`, `p${n}@acme.example`, "Developer", "Engineering", "Germany", 60000 + n, "2021-03-15"];

function setup(table: unknown[][], onDone = jest.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const onReset = jest.fn();
  render(
    <QueryClientProvider client={client}>
      <ImportPreview fileName="staff.xlsx" mapped={mapSpreadsheetRows(table)} onReset={onReset} onDone={onDone} />
    </QueryClientProvider>,
  );
  return { onDone, onReset };
}

beforeEach(() => jest.clearAllMocks());

describe("ImportPreview", () => {
  it("summarises ready rows and lists problem rows with plain-language reasons", () => {
    setup([header, good(1), good(2), ["Bad", "nope", "Developer", "Engineering", "Narnia", 0, "15/03/2021"]]);

    expect(screen.getByText("Rows in file").nextSibling).toHaveTextContent("3");
    expect(screen.getByText("Ready to import").nextSibling).toHaveTextContent("2");
    expect(screen.getByText("Need attention").nextSibling).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: "Import 2 employees" })).toBeEnabled();

    const problems = screen.getByRole("region", { name: "Rows that need attention" });
    expect(problems).toHaveTextContent("Row");
    expect(problems).toHaveTextContent("Enter a valid email address");
    expect(problems).toHaveTextContent("Salary must be greater than 0");
  });

  it("blocks the import and names the missing required columns", () => {
    setup([["Name", "Email"], ["Only Two", "x@y.co"]]);
    expect(screen.getByRole("alert")).toHaveTextContent("Job title, Department, Country, Annual salary, Hire date");
    expect(screen.getByRole("button", { name: /^Import/ })).toBeDisabled();
  });

  it("blocks the import when no row is valid", () => {
    setup([header, ["Bad", "nope", "Developer", "Engineering", "Narnia", 0, "x"]]);
    expect(screen.getByRole("button", { name: "Import 0 employees" })).toBeDisabled();
  });

  it("sends only the valid rows, with their file row numbers, and reports the result", async () => {
    const result: ImportResultDto = { total: 2, created: 2, failed: [] };
    (api.importEmployees as jest.Mock).mockResolvedValue(result);
    const { onDone } = setup([header, good(1), ["Bad", "nope", "Developer", "Engineering", "Germany", 1, "2021-03-15"], good(3)]);

    await userEvent.click(screen.getByRole("button", { name: "Import 2 employees" }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith(result));
    const sent = (api.importEmployees as jest.Mock).mock.calls[0][0];
    expect(sent.map((r: { row: number }) => r.row)).toEqual([2, 4]);
    expect(sent[0].data).toMatchObject({ email: "p1@acme.example", country: "DE", currency: "EUR", status: "ACTIVE" });
  });

  it("keeps the preview and shows nothing as done when the server fails", async () => {
    (api.importEmployees as jest.Mock).mockRejectedValue(new Error("Cannot reach the server."));
    const { onDone } = setup([header, good(1)]);
    await userEvent.click(screen.getByRole("button", { name: "Import 1 employees" }));
    await waitFor(() => expect(api.importEmployees).toHaveBeenCalled());
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Import 1 employees" })).toBeEnabled();
  });

  it("lets the user pick another file", async () => {
    const { onReset } = setup([header, good(1)]);
    await userEvent.click(screen.getByRole("button", { name: "Choose another file" }));
    expect(onReset).toHaveBeenCalled();
  });
});
