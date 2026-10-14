"use client";

import type { FilterOptionsDto } from "@salary/shared";
import { COUNTRY_BY_CODE } from "@salary/shared";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { activeFilters, DEFAULT_LIST_STATE, type EmployeeListState, type StatusFilter } from "@/lib/employee-query-state";
import { countryName } from "@/lib/format";

interface Props {
  state: EmployeeListState;
  options: FilterOptionsDto | undefined;
  onChange: (patch: Partial<EmployeeListState>) => void;
  onClear: () => void;
}

export function EmployeeFilters({ state, options, onChange, onClear }: Props) {
  // Typing is debounced so each keystroke does not hit the API.
  const [searchText, setSearchText] = useState(state.search);
  useEffect(() => setSearchText(state.search), [state.search]);
  useEffect(() => {
    if (searchText === state.search) return;
    const timer = setTimeout(() => onChange({ search: searchText }), 300);
    return () => clearTimeout(timer);
  }, [searchText, state.search, onChange]);

  const currency = state.country ? COUNTRY_BY_CODE[state.country]?.currency : undefined;
  const chips = activeFilters(state, countryName);
  const hasAnything = chips.length > 0 || state.search !== "" || state.minSalary !== "" || state.maxSalary !== "";

  return (
    <Card className="flex flex-col gap-3.5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex min-w-[240px] flex-[1_1_280px] items-center">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 text-slate-500" />
          <Input
            aria-label="Search by name or email"
            placeholder="Search name or email"
            className="pl-10"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Select aria-label="Country" className="w-auto" value={state.country} onChange={(e) => onChange({ country: e.target.value })}>
          <option value="">Country: All</option>
          {options?.countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Department" className="w-auto" value={state.department} onChange={(e) => onChange({ department: e.target.value })}>
          <option value="">Department: All</option>
          {options?.departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select aria-label="Job title" className="w-auto" value={state.jobTitle} onChange={(e) => onChange({ jobTitle: e.target.value })}>
          <option value="">Job title: All</option>
          {options?.jobTitles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Status"
          className="w-auto"
          value={state.status}
          onChange={(e) => onChange({ status: e.target.value as StatusFilter })}
        >
          <option value="ACTIVE">Status: Active</option>
          <option value="INACTIVE">Status: Inactive</option>
          <option value="ALL">Status: All</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">{currency ? `Salary (${currency})` : "Salary (choose a country first)"}</span>
        <Input
          aria-label="Minimum salary"
          inputMode="numeric"
          placeholder="Min"
          className="w-32"
          disabled={!state.country}
          value={state.minSalary}
          onChange={(e) => onChange({ minSalary: e.target.value.replace(/\D/g, "") })}
        />
        <span className="text-muted">to</span>
        <Input
          aria-label="Maximum salary"
          inputMode="numeric"
          placeholder="Max"
          className="w-32"
          disabled={!state.country}
          value={state.maxSalary}
          onChange={(e) => onChange({ maxSalary: e.target.value.replace(/\D/g, "") })}
        />
        <div className="flex-1" />
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            aria-label={`Remove filter ${chip.label}`}
            onClick={() => onChange({ [chip.key]: DEFAULT_LIST_STATE[chip.key] } as Partial<EmployeeListState>)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-sm font-semibold text-accent-dark hover:bg-teal-100"
          >
            {chip.label} <span aria-hidden="true">&times;</span>
          </button>
        ))}
        {hasAnything && (
          <Button variant="ghost" onClick={onClear}>
            Clear all
          </Button>
        )}
      </div>
    </Card>
  );
}
