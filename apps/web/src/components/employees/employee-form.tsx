"use client";

import { COUNTRIES, DEPARTMENTS, type CreateEmployeeInput } from "@salary/shared";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { EMPTY_FORM, validateEmployeeForm, withCountry, type EmployeeFormValues } from "@/lib/employee-form";
import { cn } from "@/lib/utils";

interface Props {
  initial?: EmployeeFormValues;
  submitLabel: string;
  onSubmit: (data: CreateEmployeeInput) => Promise<unknown>;
}

export function EmployeeForm({ initial = EMPTY_FORM, submitLabel, onSubmit }: Props) {
  const [values, setValues] = useState<EmployeeFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field: keyof EmployeeFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    const result = validateEmployeeForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(result.data);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) setErrors(error.fieldErrors);
      else setFormError(error instanceof Error ? error.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const invalid = (field: string) => (errors[field] ? true : undefined);
  const describedBy = (field: string) => (errors[field] ? `${field}-error` : undefined);
  const common = (field: keyof EmployeeFormValues) => ({
    id: field,
    value: values[field],
    onChange: set(field),
    "aria-invalid": invalid(field),
    "aria-describedby": describedBy(field),
  });

  return (
    <div className="flex flex-wrap items-start gap-6">
      <Card className="max-w-[760px] flex-[1_1_520px]">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5 p-7">
          <h2 className="text-lg font-bold">Personal and role</h2>
          <div className="flex flex-wrap gap-5">
            <Field label="Full name" htmlFor="fullName" required error={errors.fullName}>
              <Input {...common("fullName")} placeholder="Full name" autoComplete="off" />
            </Field>
            <Field label="Email" htmlFor="email" required error={errors.email}>
              <Input {...common("email")} type="email" placeholder="name@company.com" autoComplete="off" />
            </Field>
            <Field label="Job title" htmlFor="jobTitle" required error={errors.jobTitle}>
              <Input {...common("jobTitle")} placeholder="Job title" />
            </Field>
            <Field label="Department" htmlFor="department" required error={errors.department}>
              <Select {...common("department")}>
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <hr className="border-line" />
          <h2 className="text-lg font-bold">Pay and location</h2>
          <div className="flex flex-wrap gap-5">
            <Field label="Country" htmlFor="country" required error={errors.country}>
              <Select
                {...common("country")}
                onChange={(e) => {
                  setValues((v) => withCountry(v, e.target.value));
                  setErrors(({ country: _c, currency: _u, ...rest }) => rest);
                }}
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Currency" htmlFor="currency" required error={errors.currency}>
              <Select {...common("currency")} disabled>
                <option value="">Set from country</option>
                {values.currency && <option value={values.currency}>{values.currency}</option>}
              </Select>
            </Field>
            <Field label={values.currency ? `Annual salary (${values.currency})` : "Annual salary"} htmlFor="salary" required error={errors.salary}>
              <Input {...common("salary")} inputMode="numeric" placeholder="e.g. 72000" />
            </Field>
            <Field label="Hire date" htmlFor="hireDate" required error={errors.hireDate}>
              <Input {...common("hireDate")} placeholder="YYYY-MM-DD" />
            </Field>
            <Field label="Status" htmlFor="status" error={errors.status}>
              <Select {...common("status")}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </Field>
          </div>

          {formError && (
            <p role="alert" className="rounded-[10px] bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
            <Link href="/employees" className={cn(buttonVariants({ variant: "secondary" }))}>
              Cancel
            </Link>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </Card>

      <aside className="flex max-w-[340px] flex-[1_1_260px] flex-col gap-4 text-sm leading-[22px]">
        <Card className="p-5 text-slate-700">
          <h3 className="mb-2 text-base font-bold text-ink">Good to know</h3>
          Fields marked * are required. Errors show under the field and nothing is saved until every check passes. Currency follows the selected country. Each
          email can be used once.
        </Card>
        <div className="rounded-[14px] bg-accent-soft p-5 text-accent-dark">
          <h3 className="mb-2 text-base font-bold">After saving</h3>
          You return to the list with a confirmation, and the change shows up in search and insights.
        </div>
      </aside>
    </div>
  );
}
