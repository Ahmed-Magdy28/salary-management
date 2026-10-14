import type {
  ApiErrorBody,
  CreateEmployeeInput,
  DistributionDto,
  EmployeeDto,
  EmployeeStatus,
  FilterOptionsDto,
  ImportRequest,
  ImportResultDto,
  OverviewDto,
  Paginated,
  SalaryStatsRow,
  UpdateEmployeeInput,
} from "@salary/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    const fieldErrors = Object.fromEntries((body?.errors ?? []).map((e) => [e.path, e.message]));
    throw new ApiError(body?.message ?? `Request failed (${response.status})`, response.status, fieldErrors);
  }
  return (await response.json()) as T;
}

function toQueryString(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const api = {
  listEmployees: (query: Record<string, string>) => request<Paginated<EmployeeDto>>(`/employees${toQueryString(query)}`),
  getEmployee: (id: string) => request<EmployeeDto>(`/employees/${encodeURIComponent(id)}`),
  createEmployee: (input: CreateEmployeeInput) =>
    request<EmployeeDto>("/employees", { method: "POST", body: JSON.stringify(input) }),
  updateEmployee: (id: string, input: UpdateEmployeeInput) =>
    request<EmployeeDto>(`/employees/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  setEmployeeStatus: (id: string, status: EmployeeStatus) =>
    request<EmployeeDto>(`/employees/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  importEmployees: (rows: ImportRequest["rows"]) =>
    request<ImportResultDto>("/employees/import", { method: "POST", body: JSON.stringify({ rows }) }),
  getOverview: () => request<OverviewDto>("/insights/overview"),
  getSalaryStats: (groupBy: string, country?: string) =>
    request<SalaryStatsRow[]>(`/insights/salary-stats${toQueryString({ groupBy, country })}`),
  getDistribution: (country: string, jobTitle?: string) =>
    request<DistributionDto>(`/insights/distribution${toQueryString({ country, jobTitle })}`),
  getFilterOptions: () => request<FilterOptionsDto>("/meta/filters"),
};
