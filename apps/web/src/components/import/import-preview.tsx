"use client";

import { MAX_IMPORT_ROWS, partitionImportRows, type ImportResultDto } from "@salary/shared";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useImportEmployees } from "@/lib/hooks";
import { FIELD_LABELS, type MappedImport } from "@/lib/import/map-rows";
import { formatNumber } from "@/lib/format";
import { ProblemRows } from "./problem-rows";

interface Props {
  fileName: string;
  mapped: MappedImport;
  onReset: () => void;
  onDone: (result: ImportResultDto) => void;
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "text-green-800" : tone === "warn" && value > 0 ? "text-amber-800" : "text-ink";
  return (
    <Card className="min-w-[180px] flex-1 px-5 py-4">
      <div className="text-sm font-medium text-muted">{label}</div>
      <div className={`tabular mt-1 text-[32px] font-bold leading-10 ${color}`}>{formatNumber(value)}</div>
    </Card>
  );
}

export function ImportPreview({ fileName, mapped, onReset, onDone }: Props) {
  const importer = useImportEmployees();
  const { valid, failed } = useMemo(() => partitionImportRows(mapped.rows), [mapped.rows]);

  const missing = mapped.missing.map((f) => FIELD_LABELS[f]);
  const tooMany = mapped.rows.length > MAX_IMPORT_ROWS;
  const blocked = missing.length > 0 || tooMany || valid.length === 0;

  const runImport = () =>
    importer.mutate(valid.map((v) => ({ row: v.row, data: v.data })), {
      onSuccess: (result) => {
        toast.success(`${formatNumber(result.created)} employees imported`);
        onDone(result);
      },
      onError: (error) => toast.error(error.message),
    });

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] text-muted">
        File: <span className="font-semibold text-ink">{fileName}</span>
      </p>

      {missing.length > 0 && (
        <div role="alert" className="rounded-[14px] border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-semibold">These required columns were not found: {missing.join(", ")}</p>
          <p className="mt-1 text-sm">Check the header names in the first row of your sheet, or download the template and copy your data into it.</p>
        </div>
      )}
      {tooMany && (
        <div role="alert" className="rounded-[14px] border border-red-200 bg-red-50 p-5 text-red-800">
          This file has {formatNumber(mapped.rows.length)} rows. Import up to {formatNumber(MAX_IMPORT_ROWS)} at a time by splitting the file.
        </div>
      )}
      {mapped.unknownColumns.length > 0 && (
        <p className="text-sm text-muted">Ignored columns: {mapped.unknownColumns.join(", ")}.</p>
      )}

      <div className="flex flex-wrap gap-4">
        <Stat label="Rows in file" value={mapped.rows.length} />
        <Stat label="Ready to import" value={valid.length} tone="good" />
        <Stat label="Need attention" value={failed.length} tone="warn" />
      </div>

      {failed.length > 0 && (
        <section aria-label="Rows that need attention" className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Rows that will be skipped</h2>
          <p className="text-sm text-muted">
            Fix these in your spreadsheet and upload it again. People who are already imported are skipped automatically, so uploading the same file twice is safe.
          </p>
          <ProblemRows failures={failed} />
        </section>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
        <Button onClick={onReset} disabled={importer.isPending}>
          Choose another file
        </Button>
        <Button variant="primary" onClick={runImport} disabled={blocked || importer.isPending}>
          {importer.isPending ? "Importing..." : `Import ${formatNumber(valid.length)} employees`}
        </Button>
      </div>
    </div>
  );
}
