import type { Department } from "@salary/shared";

/** Seed-only data: used to generate plausible salaries. Not shown to users. */

export interface CountrySeedProfile {
  code: string;
  currency: string;
  /** Share of headcount (percent, sums to 100). */
  weight: number;
  /** Local pay level relative to the US (1 = same purchasing level in USD). */
  payFactor: number;
  /** Local currency units per 1 USD (static, for seed realism only). */
  perUsd: number;
  /** Salaries are rounded to a multiple of this. */
  roundTo: number;
}

export const COUNTRY_PROFILES: readonly CountrySeedProfile[] = [
  { code: "US", currency: "USD", weight: 22, payFactor: 1.0, perUsd: 1, roundTo: 500 },
  { code: "GB", currency: "GBP", weight: 11, payFactor: 0.72, perUsd: 0.79, roundTo: 500 },
  { code: "DE", currency: "EUR", weight: 12, payFactor: 0.75, perUsd: 0.92, roundTo: 500 },
  { code: "IN", currency: "INR", weight: 20, payFactor: 0.22, perUsd: 83, roundTo: 10000 },
  { code: "EG", currency: "EGP", weight: 9, payFactor: 0.18, perUsd: 48, roundTo: 5000 },
  { code: "BR", currency: "BRL", weight: 8, payFactor: 0.3, perUsd: 5, roundTo: 1000 },
  { code: "JP", currency: "JPY", weight: 8, payFactor: 0.62, perUsd: 150, roundTo: 10000 },
  { code: "CA", currency: "CAD", weight: 10, payFactor: 0.85, perUsd: 1.36, roundTo: 500 },
];

export interface JobSeed {
  title: string;
  /** Typical US annual salary in USD. */
  baseUsd: number;
  /** Relative frequency within the department. */
  weight: number;
}

export const DEPARTMENT_WEIGHTS: Record<Department, number> = {
  Engineering: 30,
  Product: 8,
  Design: 5,
  Sales: 15,
  Marketing: 7,
  Finance: 7,
  People: 5,
  Operations: 10,
  "Customer Support": 13,
};

export const JOB_CATALOG: Record<Department, readonly JobSeed[]> = {
  Engineering: [
    { title: "Software Engineer", baseUsd: 110000, weight: 10 },
    { title: "Senior Software Engineer", baseUsd: 145000, weight: 6 },
    { title: "Staff Engineer", baseUsd: 185000, weight: 2 },
    { title: "Engineering Manager", baseUsd: 175000, weight: 2 },
    { title: "QA Engineer", baseUsd: 85000, weight: 3 },
    { title: "DevOps Engineer", baseUsd: 120000, weight: 3 },
    { title: "Data Engineer", baseUsd: 125000, weight: 3 },
  ],
  Product: [
    { title: "Product Manager", baseUsd: 130000, weight: 5 },
    { title: "Senior Product Manager", baseUsd: 160000, weight: 2 },
    { title: "Product Analyst", baseUsd: 90000, weight: 3 },
  ],
  Design: [
    { title: "Product Designer", baseUsd: 105000, weight: 5 },
    { title: "Senior Product Designer", baseUsd: 135000, weight: 2 },
    { title: "UX Researcher", baseUsd: 100000, weight: 2 },
  ],
  Sales: [
    { title: "Account Executive", baseUsd: 95000, weight: 6 },
    { title: "Sales Development Rep", baseUsd: 62000, weight: 6 },
    { title: "Sales Manager", baseUsd: 135000, weight: 2 },
  ],
  Marketing: [
    { title: "Marketing Specialist", baseUsd: 70000, weight: 5 },
    { title: "Content Strategist", baseUsd: 75000, weight: 3 },
    { title: "Growth Manager", baseUsd: 110000, weight: 2 },
  ],
  Finance: [
    { title: "Financial Analyst", baseUsd: 82000, weight: 5 },
    { title: "Accountant", baseUsd: 72000, weight: 4 },
    { title: "Finance Manager", baseUsd: 120000, weight: 2 },
  ],
  People: [
    { title: "HR Specialist", baseUsd: 68000, weight: 4 },
    { title: "Recruiter", baseUsd: 72000, weight: 4 },
    { title: "People Partner", baseUsd: 95000, weight: 2 },
  ],
  Operations: [
    { title: "Operations Analyst", baseUsd: 72000, weight: 4 },
    { title: "Operations Manager", baseUsd: 105000, weight: 2 },
    { title: "Logistics Coordinator", baseUsd: 58000, weight: 4 },
  ],
  "Customer Support": [
    { title: "Support Specialist", baseUsd: 52000, weight: 8 },
    { title: "Support Team Lead", baseUsd: 78000, weight: 2 },
    { title: "Customer Success Manager", baseUsd: 92000, weight: 3 },
  ],
};
