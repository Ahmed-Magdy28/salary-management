import { DEFAULT_PAGE_SIZE } from "@salary/shared";

export type StatusFilter = "ACTIVE" | "INACTIVE" | "ALL";
export type SortField = "fullName" | "salary" | "hireDate";

export interface EmployeeListState {
  search: string;
  country: string;
  department: string;
  jobTitle: string;
  status: StatusFilter;
  minSalary: string;
  maxSalary: string;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

export const DEFAULT_LIST_STATE: EmployeeListState = {
  search: "",
  country: "",
  department: "",
  jobTitle: "",
  status: "ACTIVE",
  minSalary: "",
  maxSalary: "",
  sortBy: "fullName",
  sortOrder: "asc",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

const SORT_FIELDS: SortField[] = ["fullName", "salary", "hireDate"];
const STATUSES: StatusFilter[] = ["ACTIVE", "INACTIVE", "ALL"];

function positiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
}

export function parseListState(params: URLSearchParams): EmployeeListState {
  const d = DEFAULT_LIST_STATE;
  const status = params.get("status") as StatusFilter | null;
  const sortBy = params.get("sortBy") as SortField | null;
  return {
    search: params.get("search") ?? d.search,
    country: params.get("country") ?? d.country,
    department: params.get("department") ?? d.department,
    jobTitle: params.get("jobTitle") ?? d.jobTitle,
    status: status && STATUSES.includes(status) ? status : d.status,
    minSalary: params.get("minSalary") ?? d.minSalary,
    maxSalary: params.get("maxSalary") ?? d.maxSalary,
    sortBy: sortBy && SORT_FIELDS.includes(sortBy) ? sortBy : d.sortBy,
    sortOrder: params.get("sortOrder") === "desc" ? "desc" : "asc",
    page: positiveInt(params.get("page"), d.page),
    pageSize: positiveInt(params.get("pageSize"), d.pageSize),
  };
}

/** Only non-default values go in the URL, so links stay short. */
export function toSearchParams(state: EmployeeListState): URLSearchParams {
  const params = new URLSearchParams();
  (Object.keys(DEFAULT_LIST_STATE) as (keyof EmployeeListState)[]).forEach((key) => {
    const value = state[key];
    if (value !== DEFAULT_LIST_STATE[key] && value !== "") params.set(key, String(value));
  });
  return params;
}

/** Query string for the API: drops empty values and the "ALL" status. */
export function toApiQuery(state: EmployeeListState): Record<string, string> {
  const query: Record<string, string> = {
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    page: String(state.page),
    pageSize: String(state.pageSize),
  };
  const optional: [string, string][] = [
    ["search", state.search.trim()],
    ["country", state.country],
    ["department", state.department],
    ["jobTitle", state.jobTitle],
    ["status", state.status === "ALL" ? "" : state.status],
    ["minSalary", state.minSalary],
    ["maxSalary", state.maxSalary],
  ];
  for (const [key, value] of optional) if (value) query[key] = value;
  return query;
}

/**
 * Applies a filter change. Any change other than paging goes back to page 1,
 * and salary bounds are dropped when the country is cleared (they need one).
 */
export function applyChange(state: EmployeeListState, patch: Partial<EmployeeListState>): EmployeeListState {
  const next = { ...state, ...patch };
  if (!("page" in patch)) next.page = 1;
  if (!next.country) {
    next.minSalary = "";
    next.maxSalary = "";
  }
  return next;
}

export interface ActiveFilter {
  key: keyof EmployeeListState;
  label: string;
}

export function activeFilters(state: EmployeeListState, countryLabel: (code: string) => string): ActiveFilter[] {
  const filters: ActiveFilter[] = [];
  if (state.country) filters.push({ key: "country", label: countryLabel(state.country) });
  if (state.department) filters.push({ key: "department", label: state.department });
  if (state.jobTitle) filters.push({ key: "jobTitle", label: state.jobTitle });
  if (state.status !== DEFAULT_LIST_STATE.status) filters.push({ key: "status", label: state.status === "ALL" ? "All statuses" : "Inactive" });
  return filters;
}
