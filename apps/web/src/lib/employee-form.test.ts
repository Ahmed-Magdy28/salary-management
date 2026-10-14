import { EMPTY_FORM, validateEmployeeForm, withCountry, type EmployeeFormValues } from "./employee-form";

const valid: EmployeeFormValues = {
  fullName: "Lena Fischer",
  email: "lena@acme.example",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "DE",
  currency: "EUR",
  salary: "72,000",
  hireDate: "2021-03-15",
  status: "ACTIVE",
};

describe("validateEmployeeForm", () => {
  it("accepts valid values and converts the salary to a number", () => {
    const result = validateEmployeeForm(valid);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.salary).toBe(72000);
  });

  it("returns friendly messages for an empty form", () => {
    const result = validateEmployeeForm(EMPTY_FORM);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.fullName).toBe("Full name is required");
      expect(result.errors.department).toBe("Select an option");
      expect(result.errors.country).toBe("Select an option");
      expect(result.errors.salary).toBe("This field is required");
    }
  });

  it("flags a zero salary and a bad email", () => {
    const result = validateEmployeeForm({ ...valid, salary: "0", email: "lena@acme" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.salary).toBe("Salary must be greater than 0");
      expect(result.errors.email).toBe("Enter a valid email address");
    }
  });

  it("flags text in the salary field", () => {
    const result = validateEmployeeForm({ ...valid, salary: "lots" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.salary).toBeDefined();
  });
});

describe("withCountry", () => {
  it("sets the currency that belongs to the country", () => {
    expect(withCountry(EMPTY_FORM, "JP")).toMatchObject({ country: "JP", currency: "JPY" });
  });
  it("clears the currency when the country is cleared", () => {
    expect(withCountry({ ...valid }, "")).toMatchObject({ country: "", currency: "" });
  });
});
