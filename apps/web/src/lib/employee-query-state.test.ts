import { activeFilters, applyChange, DEFAULT_LIST_STATE, parseListState, toApiQuery, toSearchParams } from "./employee-query-state";

const parse = (qs: string) => parseListState(new URLSearchParams(qs));

describe("parseListState", () => {
  it("returns defaults for an empty query string", () => {
    expect(parse("")).toEqual(DEFAULT_LIST_STATE);
  });

  it("reads filters, sort and paging", () => {
    expect(parse("country=DE&status=ALL&sortBy=salary&sortOrder=desc&page=3&pageSize=25")).toMatchObject({
      country: "DE",
      status: "ALL",
      sortBy: "salary",
      sortOrder: "desc",
      page: 3,
      pageSize: 25,
    });
  });

  it("ignores invalid values instead of passing them on", () => {
    expect(parse("status=bogus&sortBy=password&page=-2&pageSize=abc")).toMatchObject({
      status: "ACTIVE",
      sortBy: "fullName",
      page: 1,
      pageSize: 50,
    });
  });
});

describe("toSearchParams", () => {
  it("omits defaults so URLs stay short", () => {
    expect(toSearchParams(DEFAULT_LIST_STATE).toString()).toBe("");
    expect(toSearchParams({ ...DEFAULT_LIST_STATE, country: "DE", page: 2 }).toString()).toBe("country=DE&page=2");
  });

  it("round-trips through parseListState", () => {
    const state = { ...DEFAULT_LIST_STATE, search: "lena", country: "DE", minSalary: "50000", sortBy: "salary" as const };
    expect(parseListState(toSearchParams(state))).toEqual(state);
  });
});

describe("toApiQuery", () => {
  it("always sends sort and paging, and only filters that are set", () => {
    expect(toApiQuery(DEFAULT_LIST_STATE)).toEqual({
      sortBy: "fullName",
      sortOrder: "asc",
      page: "1",
      pageSize: "50",
      status: "ACTIVE",
    });
  });

  it("does not send a status filter for ALL and trims the search", () => {
    const query = toApiQuery({ ...DEFAULT_LIST_STATE, status: "ALL", search: "  lena " });
    expect(query.status).toBeUndefined();
    expect(query.search).toBe("lena");
  });
});

describe("applyChange", () => {
  it("goes back to page 1 when a filter changes", () => {
    expect(applyChange({ ...DEFAULT_LIST_STATE, page: 4 }, { department: "Finance" }).page).toBe(1);
  });

  it("keeps the page when only the page changes", () => {
    expect(applyChange(DEFAULT_LIST_STATE, { page: 4 }).page).toBe(4);
  });

  it("clears salary bounds when the country is cleared", () => {
    const state = { ...DEFAULT_LIST_STATE, country: "DE", minSalary: "1", maxSalary: "9" };
    expect(applyChange(state, { country: "" })).toMatchObject({ minSalary: "", maxSalary: "" });
  });
});

describe("activeFilters", () => {
  it("lists the filters that are applied", () => {
    const filters = activeFilters({ ...DEFAULT_LIST_STATE, country: "DE", department: "Finance", status: "INACTIVE" }, () => "Germany");
    expect(filters.map((f) => f.label)).toEqual(["Germany", "Finance", "Inactive"]);
  });
  it("lists nothing for defaults", () => {
    expect(activeFilters(DEFAULT_LIST_STATE, (c) => c)).toEqual([]);
  });
});
