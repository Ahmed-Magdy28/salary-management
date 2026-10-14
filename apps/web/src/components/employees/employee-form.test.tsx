import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { EmployeeForm } from "./employee-form";

jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText(/full name/i), "Lena Fischer");
  await userEvent.type(screen.getByLabelText(/^email/i), "lena@acme.example");
  await userEvent.type(screen.getByLabelText(/job title/i), "Software Engineer");
  await userEvent.selectOptions(screen.getByLabelText(/department/i), "Engineering");
  await userEvent.selectOptions(screen.getByLabelText(/^country/i), "DE");
  await userEvent.type(screen.getByLabelText(/annual salary/i), "72000");
  await userEvent.type(screen.getByLabelText(/hire date/i), "2021-03-15");
}

describe("EmployeeForm", () => {
  it("shows an error under every missing required field and does not submit", async () => {
    const onSubmit = jest.fn();
    render(<EmployeeForm submitLabel="Save employee" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: "Save employee" }));

    expect(screen.getByText("Full name is required")).toBeInTheDocument();
    expect(screen.getAllByText("Select an option")).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("sets the currency from the chosen country", async () => {
    render(<EmployeeForm submitLabel="Save employee" onSubmit={jest.fn()} />);
    await userEvent.selectOptions(screen.getByLabelText(/^country/i), "JP");
    expect(screen.getByLabelText(/^currency/i)).toHaveValue("JPY");
    expect(screen.getByLabelText(/annual salary \(JPY\)/i)).toBeInTheDocument();
  });

  it("submits validated data with the salary as a number", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<EmployeeForm submitLabel="Save employee" onSubmit={onSubmit} />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Save employee" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ fullName: "Lena Fischer", country: "DE", currency: "EUR", salary: 72000, status: "ACTIVE" });
  });

  it("shows server-side field errors such as a duplicate email", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new ApiError("Email already in use", 409, { email: "This email is already in use" }));
    render(<EmployeeForm submitLabel="Save employee" onSubmit={onSubmit} />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Save employee" }));

    expect(await screen.findByText("This email is already in use")).toBeInTheDocument();
  });

  it("shows a general message when the server cannot be reached", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new ApiError("Cannot reach the server. Check your connection and try again.", 0));
    render(<EmployeeForm submitLabel="Save employee" onSubmit={onSubmit} />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Save employee" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot reach the server");
  });

  it("clears a field's error once the user edits it", async () => {
    render(<EmployeeForm submitLabel="Save employee" onSubmit={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Save employee" }));
    expect(screen.getByText("Full name is required")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/full name/i), "L");
    expect(screen.queryByText("Full name is required")).not.toBeInTheDocument();
  });
});
