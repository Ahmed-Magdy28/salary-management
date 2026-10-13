import { Faker, en } from "@faker-js/faker";
import { DEPARTMENTS, type CreateEmployeeInput, type Department } from "@salary/shared";
import { COUNTRY_PROFILES, DEPARTMENT_WEIGHTS, JOB_CATALOG, type CountrySeedProfile } from "./catalog";

export const DEFAULT_SEED = 20261014;
export const DEFAULT_COUNT = 10_000;

/** Fixed window so generated data never depends on today's date. */
const HIRE_FROM = new Date("2012-01-01T00:00:00Z");
const HIRE_TO = new Date("2026-09-30T00:00:00Z");
const INACTIVE_PERCENT = 3;

export type SeedEmployee = CreateEmployeeInput;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function roundTo(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

function yearsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (365.25 * 24 * 3600 * 1000);
}

/**
 * Generates deterministic, realistic employees: same `seed` and `count` always
 * produce the same list. Salaries are in each employee's local currency.
 */
export function generateEmployees(count: number = DEFAULT_COUNT, seed: number = DEFAULT_SEED): SeedEmployee[] {
  const faker = new Faker({ locale: [en] });
  faker.seed(seed);

  const countryOptions = COUNTRY_PROFILES.map((p) => ({ value: p, weight: p.weight }));
  const departmentOptions = DEPARTMENTS.map((d) => ({ value: d, weight: DEPARTMENT_WEIGHTS[d] }));
  const statusOptions = [
    { value: "ACTIVE" as const, weight: 100 - INACTIVE_PERCENT },
    { value: "INACTIVE" as const, weight: INACTIVE_PERCENT },
  ];

  const employees: SeedEmployee[] = [];
  for (let i = 0; i < count; i++) {
    const country: CountrySeedProfile = faker.helpers.weightedArrayElement(countryOptions);
    const department: Department = faker.helpers.weightedArrayElement(departmentOptions);
    const job = faker.helpers.weightedArrayElement(
      JOB_CATALOG[department].map((j) => ({ value: j, weight: j.weight })),
    );

    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const hired = faker.date.between({ from: HIRE_FROM, to: HIRE_TO });

    // Bell-shaped noise (sum of two uniforms) plus a small tenure uplift.
    const noise = 1 + faker.number.float({ min: -0.1, max: 0.1 }) + faker.number.float({ min: -0.1, max: 0.1 });
    const tenure = 1 + Math.min(yearsBetween(hired, HIRE_TO), 10) * 0.015;
    const local = job.baseUsd * country.payFactor * country.perUsd * noise * tenure;

    employees.push({
      fullName: `${first} ${last}`,
      email: `${slugify(`${first} ${last}`)}.${i + 1}@acme.example`,
      jobTitle: job.title,
      department,
      country: country.code,
      currency: country.currency,
      salary: roundTo(local, country.roundTo),
      hireDate: hired.toISOString().slice(0, 10),
      status: faker.helpers.weightedArrayElement(statusOptions),
    });
  }
  return employees;
}
