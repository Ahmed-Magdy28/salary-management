import { listEmployeesQuerySchema } from "@salary/shared";
import { buildEmployeeOrderBy, buildEmployeeWhere } from "./employee-query";

const parse = (raw: Record<string, string>) => listEmployeesQuerySchema.parse(raw);

describe("buildEmployeeWhere", () => {
  it("returns an empty filter when nothing is selected", () => {
    expect(buildEmployeeWhere(parse({}))).toEqual({});
  });

  it("searches name and email case-insensitively", () => {
    expect(buildEmployeeWhere(parse({ search: "lena" }))).toEqual({
      OR: [
        { fullName: { contains: "lena", mode: "insensitive" } },
        { email: { contains: "lena", mode: "insensitive" } },
      ],
    });
  });

  it("combines attribute filters", () => {
    const where = buildEmployeeWhere(parse({ country: "DE", department: "Engineering", status: "ACTIVE", jobTitle: "QA Engineer" }));
    expect(where).toEqual({ country: "DE", department: "Engineering", status: "ACTIVE", jobTitle: "QA Engineer" });
  });

  it("builds a salary range with both bounds", () => {
    expect(buildEmployeeWhere(parse({ country: "DE", minSalary: "50000", maxSalary: "90000" })).salary).toEqual({
      gte: 50000,
      lte: 90000,
    });
  });

  it("supports a single salary bound and keeps zero as a real bound", () => {
    expect(buildEmployeeWhere(parse({ country: "DE", minSalary: "0" })).salary).toEqual({ gte: 0 });
    expect(buildEmployeeWhere(parse({ country: "DE", maxSalary: "70000" })).salary).toEqual({ lte: 70000 });
  });
});

describe("buildEmployeeOrderBy", () => {
  it("sorts by the chosen field with an id tiebreaker", () => {
    expect(buildEmployeeOrderBy(parse({ sortBy: "salary", sortOrder: "desc" }))).toEqual([{ salary: "desc" }, { id: "asc" }]);
  });

  it("defaults to name ascending", () => {
    expect(buildEmployeeOrderBy(parse({}))).toEqual([{ fullName: "asc" }, { id: "asc" }]);
  });
});
