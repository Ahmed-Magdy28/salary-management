import type { Employee } from "@salary/db";
import { toEmployeeDto } from "./employee.mapper";

describe("toEmployeeDto", () => {
  it("formats the hire date as a plain date and keeps other fields", () => {
    const row = {
      id: "1",
      fullName: "Lena Fischer",
      email: "lena@acme.example",
      jobTitle: "Software Engineer",
      department: "Engineering",
      country: "DE",
      currency: "EUR",
      salary: 72000,
      hireDate: new Date("2021-03-15T00:00:00Z"),
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Employee;

    expect(toEmployeeDto(row)).toEqual({
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
    });
  });
});
