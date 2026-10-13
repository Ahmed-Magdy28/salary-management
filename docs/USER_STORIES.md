# User Stories: Salary Management Tool

**Persona:** HR Manager at ACME, responsible for salary data of 10,000 employees across multiple countries.
**Source:** `docs/REQUIREMENTS.md` (feature numbers F1 to F7 refer to its Scope & Features list).
**Priority:** P0 = must ship, P1 = should ship, P2 = stretch.

---

## Epic 1: Manage Employee Records (F1, F5)

### US-1.1 Add an employee (P0)
**As an** HR Manager, **I want to** add a new employee with their salary details, **so that** the system replaces Excel as the source of truth.

**Acceptance criteria**
- Fields: full name, email, job title, department, country, currency, salary, hire date, status.
- All fields except status are required; status defaults to active.
- Salary must be a positive number; email must be valid and unique.
- Country and currency come from a fixed list; currency defaults from the selected country.
- On success the employee appears in the list and I see a confirmation.
- On failure I see field-level errors and nothing is saved.

### US-1.2 View an employee (P0)
**As an** HR Manager, **I want to** open an employee's full record, **so that** I can check their current details.

**Acceptance criteria**
- All fields are shown, with salary formatted in the employee's currency.
- An unknown employee ID shows a clear "not found" state.

### US-1.3 Edit an employee (P0)
**As an** HR Manager, **I want to** update an employee's details, especially salary, **so that** records reflect raises and role changes.

**Acceptance criteria**
- The same validation rules as creation apply.
- Using an email that belongs to another employee is rejected.
- The list and insights reflect the change after saving.

### US-1.4 Deactivate an employee (P1)
**As an** HR Manager, **I want to** mark an employee as inactive when they leave, **so that** insights are not distorted by stale data.

**Acceptance criteria**
- I must confirm before the action completes.
- Inactive employees are excluded from insights and shown only when I filter by status.
- I can reactivate an employee.

---

## Epic 2: Find Employees Quickly (F2)

### US-2.1 Browse a paginated list (P0)
**As an** HR Manager, **I want to** browse employees page by page, **so that** the screen stays fast with 10,000 records.

**Acceptance criteria**
- Pagination is server-side with a selectable page size (25 / 50 / 100).
- Total count and current page position are shown.
- A page loads in under 300 ms (p95) at 10,000 records.

### US-2.2 Search by name or email (P0)
**As an** HR Manager, **I want to** type part of a name or email, **so that** I can find one person in seconds.

**Acceptance criteria**
- Search is case-insensitive and matches partial text.
- Results update after a short input pause (debounced).
- No matches shows a "no employees match" state.

### US-2.3 Filter by attributes (P0)
**As an** HR Manager, **I want to** filter by country, department, job title, status, and salary range, **so that** I can focus on a specific group.

**Acceptance criteria**
- Filters combine with each other and with search.
- The salary range filter applies within one currency, so the UI requires a country (or shows the currency) when it is used.
- Active filters are visible and can be cleared individually or all at once.
- Changing a filter resets to page 1.

### US-2.4 Sort the list (P1)
**As an** HR Manager, **I want to** sort by name, salary, or hire date, **so that** I can spot the highest and lowest paid.

**Acceptance criteria**
- Ascending and descending sort on name, salary, and hire date.
- Sort order is stable across pages.

---

## Epic 3: Understand How We Pay People (F3, F4)

### US-3.1 Headline metrics (P0)
**As an** HR Manager, **I want to** see total headcount and the number of countries, departments, and job titles on the dashboard, **so that** I get an immediate overview.

**Acceptance criteria**
- Figures match the data and update after edits.
- Inactive employees are excluded.

### US-3.2 Salary summary by country (P0)
**As an** HR Manager, **I want to** see headcount and min / median / mean / max salary per country, **so that** I can compare pay across locations.

**Acceptance criteria**
- Each row shows its local currency; currencies are never mixed.
- Median is correct for odd and even headcounts.

### US-3.3 Salary summary by job title (P0)
**As an** HR Manager, **I want to** see the same statistics per job title within a country, **so that** I can check that equivalent roles are paid consistently.

**Acceptance criteria**
- I pick a country to scope the view, since titles are only comparable within one currency.
- Each row shows headcount, min, median, mean, and max.
- Titles with very few employees are flagged as low-sample.

### US-3.4 Salary summary by department (P1)
**As an** HR Manager, **I want to** see the same statistics per department, **so that** I understand pay levels by function.

**Acceptance criteria**
- Same statistics as US-3.2, with an optional country scope.

### US-3.5 Percentile bands (P1)
**As an** HR Manager, **I want to** see P25 and P75 next to the median, **so that** I can tell the typical range from outliers.

**Acceptance criteria**
- P25, median, and P75 appear in every grouped summary.
- The percentile method is documented and covered by tests with known data.

### US-3.6 Salary distribution (P1)
**As an** HR Manager, **I want to** see a histogram of salaries for a country and optional job title, **so that** I can spot outliers and clustering.

**Acceptance criteria**
- Country is required; job title is optional.
- Salaries are grouped into evenly sized bands with employee counts.
- An empty selection shows a clear empty state.

### US-3.7 Cross-country comparison in USD (P2, stretch)
**As an** HR Manager, **I want to** compare countries on a common currency, **so that** I can answer org-wide pay questions.

**Acceptance criteria**
- Values use a static, configurable rate table.
- The view is labeled with the conversion basis; local currency remains the default.

---

## Epic 4: Data Quality & Setup (F5, F6)

### US-4.1 Consistent validation (P0)
**As an** HR Manager, **I want** invalid data to be rejected, **so that** the system does not become as messy as the spreadsheets.

**Acceptance criteria**
- The API enforces the rules regardless of the client.
- The UI uses the same shared schema, so the rules cannot drift.
- Errors name the field and what is wrong.

### US-4.2 Seed realistic data (P0)
**As a** developer or reviewer, **I want to** run one command that loads 10,000 realistic employees, **so that** I can demo and test with representative data.

**Acceptance criteria**
- 10,000 employees across about 8 countries, several departments and job titles.
- Salaries follow plausible per-country, per-role ranges in local currency.
- Reproducible through a fixed random seed.
- Completes in under 30 seconds; safe to re-run (resets cleanly, no duplicate emails).

---

## Epic 5: Quality & Delivery (Cross-cutting)

### US-5.1 Fast responses (P0)
**As an** HR Manager, **I want** every screen to respond quickly, **so that** the tool beats Excel in daily use.

**Acceptance criteria**
- List and insights endpoints meet the 300 ms p95 target at 10,000 records.
- Aggregates run in the database, not in the browser.

### US-5.2 Clear UI states (P1)
**As an** HR Manager, **I want to** see loading, empty, and error states, **so that** I always know what the app is doing.

**Acceptance criteria**
- Every data view has a loading indicator, an empty state, and a retryable error state.

### US-5.3 Easy to run and verify (P0)
**As a** reviewer, **I want to** run the app and tests with minimal setup, **so that** I can evaluate the work quickly.

**Acceptance criteria**
- README documents: `docker compose up -d`, install, migrate, seed, dev, test.
- Tests are fast and deterministic; most need no database. They cover validation, stats math, filter building, and the seed generator.
- A deployed instance and a demo video are linked.

---

## Build Order

| Milestone | Stories |
|-----------|---------|
| 1. Foundation | Monorepo scaffold, shared schemas, Prisma schema, US-4.2, US-4.1 |
| 2. Employee API | US-1.1 to US-1.4, US-2.1 to US-2.4 |
| 3. Insights API | US-3.1 to US-3.6 |
| 4. UI | Employee list and form, then dashboard (US-5.2 throughout) |
| 5. Release | US-5.1, US-5.3, deployment, demo; US-3.7 only if time remains |

## Out of Scope
Authentication, CSV import, payroll and tax, bonuses and equity, live FX rates, approval workflows, audit and salary history, HRIS integrations. Reasons are in `docs/REQUIREMENTS.md`.
