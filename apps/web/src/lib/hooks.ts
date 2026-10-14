"use client";

import type { CreateEmployeeInput, EmployeeStatus } from "@salary/shared";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export function useEmployees(query: Record<string, string>) {
  return useQuery({
    queryKey: ["employees", "list", query],
    queryFn: () => api.listEmployees(query),
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string) {
  return useQuery({ queryKey: ["employees", "detail", id], queryFn: () => api.getEmployee(id) });
}

export function useFilterOptions() {
  return useQuery({ queryKey: ["meta", "filters"], queryFn: api.getFilterOptions, staleTime: 5 * 60_000 });
}

export function useOverview() {
  return useQuery({ queryKey: ["insights", "overview"], queryFn: api.getOverview });
}

export function useSalaryStats(groupBy: string, country?: string) {
  return useQuery({
    queryKey: ["insights", "stats", groupBy, country ?? null],
    queryFn: () => api.getSalaryStats(groupBy, country),
    placeholderData: keepPreviousData,
  });
}

export function useDistribution(country: string, jobTitle?: string) {
  return useQuery({
    queryKey: ["insights", "distribution", country, jobTitle ?? null],
    queryFn: () => api.getDistribution(country, jobTitle),
    placeholderData: keepPreviousData,
  });
}

/** Any change to employees can change lists, insights and filter options. */
function useInvalidateAll() {
  const client = useQueryClient();
  return () => Promise.all([
    client.invalidateQueries({ queryKey: ["employees"] }),
    client.invalidateQueries({ queryKey: ["insights"] }),
    client.invalidateQueries({ queryKey: ["meta"] }),
  ]);
}

export function useCreateEmployee() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (input: CreateEmployeeInput) => api.createEmployee(input), onSuccess: invalidate });
}

export function useUpdateEmployee(id: string) {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (input: CreateEmployeeInput) => api.updateEmployee(id, input), onSuccess: invalidate });
}

export function useSetEmployeeStatus() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EmployeeStatus }) => api.setEmployeeStatus(id, status),
    onSuccess: invalidate,
  });
}
