import type { Department, EmployeeStatus } from "./constants";

export interface EmployeeDto {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: Department;
  country: string;
  currency: string;
  salary: number;
  hireDate: string;
  status: EmployeeStatus;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SalarySummary {
  count: number;
  min: number;
  p25: number;
  median: number;
  mean: number;
  p75: number;
  max: number;
}

export interface SalaryStatsRow extends SalarySummary {
  group: string;
  /** Currency of the figures; null only if a group spans several currencies (never mixed). */
  currency: string;
  lowSample: boolean;
}

export interface OverviewDto {
  employees: number;
  countries: number;
  departments: number;
  jobTitles: number;
}

export interface DistributionBand {
  from: number;
  to: number;
  count: number;
}

export interface DistributionDto {
  country: string;
  currency: string;
  jobTitle: string | null;
  summary: SalarySummary | null;
  bands: DistributionBand[];
}

export interface FilterOptionsDto {
  countries: { code: string; name: string; currency: string }[];
  departments: string[];
  jobTitles: string[];
}

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  errors?: { path: string; message: string }[];
}
