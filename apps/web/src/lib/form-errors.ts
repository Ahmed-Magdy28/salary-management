export interface IssueLike {
  path: (string | number)[];
  message: string;
  code: string;
}

/** Turns schema issues into one friendly message per field (first issue wins). */
export function issuesToFieldErrors(issues: IssueLike[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    if (errors[field]) continue;
    if (issue.code === "invalid_enum_value") errors[field] = "Select an option";
    else if (issue.message === "Required") errors[field] = "This field is required";
    else errors[field] = issue.message;
  }
  return errors;
}
