import type { ImportFailure } from "@salary/shared";
import { FIELD_LABELS, type ImportField } from "@/lib/import/map-rows";

const SHOWN = 100;

const fieldLabel = (path: string): string => FIELD_LABELS[path as ImportField] ?? path;

export function ProblemRows({ failures }: { failures: ImportFailure[] }) {
  if (failures.length === 0) return null;
  return (
    <div>
      <div className="overflow-x-auto rounded-[10px] border border-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-[13px] uppercase tracking-wide text-muted">
            <tr>
              <th className="w-20 px-4 py-2.5 font-semibold">Row</th>
              <th className="w-64 px-4 py-2.5 font-semibold">Email</th>
              <th className="px-4 py-2.5 font-semibold">What to fix</th>
            </tr>
          </thead>
          <tbody>
            {failures.slice(0, SHOWN).map((f) => (
              <tr key={f.row} className="border-t border-slate-100 align-top">
                <td className="tabular px-4 py-2.5 font-semibold">{f.row}</td>
                <td className="px-4 py-2.5 text-muted">{f.email ?? "(blank)"}</td>
                <td className="px-4 py-2.5">
                  <ul className="space-y-0.5">
                    {f.errors.map((e, i) => (
                      <li key={i}>
                        <span className="font-semibold">{fieldLabel(e.path)}:</span> {e.message}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {failures.length > SHOWN && <p className="mt-2 text-sm text-muted">Showing the first {SHOWN} of {failures.length.toLocaleString("en-US")} rows with problems.</p>}
    </div>
  );
}
