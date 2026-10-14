"use client";

import type { ImportResultDto } from "@salary/shared";
import { FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ImportPreview } from "@/components/import/import-preview";
import { ProblemRows } from "@/components/import/problem-rows";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { IMPORT_TEMPLATE_CSV, mapSpreadsheetRows, type MappedImport } from "@/lib/import/map-rows";
import { readSpreadsheet } from "@/lib/import/read-spreadsheet";
import { cn } from "@/lib/utils";

type Stage =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "error"; message: string }
  | { kind: "preview"; fileName: string; mapped: MappedImport }
  | { kind: "done"; result: ImportResultDto };

const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(IMPORT_TEMPLATE_CSV)}`;

export default function ImportPage() {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setStage({ kind: "reading" });
    try {
      const table = await readSpreadsheet(file);
      setStage({ kind: "preview", fileName: file.name, mapped: mapSpreadsheetRows(table) });
    } catch (error) {
      setStage({ kind: "error", message: error instanceof Error ? error.message : "Could not read this file." });
    }
  };

  return (
    <>
      <div>
        <p className="text-sm text-muted">
          <Link href="/employees" className="text-accent hover:underline">
            Employees
          </Link>{" "}
          / Import
        </p>
        <h1 className="mt-1.5 text-3xl font-bold leading-9">Import from Excel</h1>
        <p className="mt-1 text-[15px] text-muted">Move your spreadsheet into the system. You will see exactly what will happen before anything is saved.</p>
      </div>

      {(stage.kind === "idle" || stage.kind === "reading" || stage.kind === "error") && (
        <div className="flex max-w-[760px] flex-col gap-5">
          <label
            htmlFor="import-file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed bg-white p-8 text-center transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
              dragging ? "border-accent bg-accent-soft" : "border-slate-300 hover:border-accent",
            )}
          >
            <input id="import-file" type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => void handleFile(e.target.files?.[0])} />
            <FileSpreadsheet size={36} aria-hidden="true" className="text-accent" />
            <span className="text-lg font-semibold">{stage.kind === "reading" ? "Reading your file..." : "Choose a file or drop it here"}</span>
            <span className="text-sm text-muted">Excel (.xlsx) or CSV, up to 10,000 rows. The first sheet is used.</span>
          </label>

          {stage.kind === "error" && (
            <p role="alert" className="rounded-[10px] bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {stage.message}
            </p>
          )}

          <Card className="p-5 text-sm leading-[22px] text-slate-700">
            <h2 className="mb-2 text-base font-bold text-ink">What your file needs</h2>
            One row per person with a header row. Required columns: Full name, Email, Job title, Department, Country, Annual salary, Hire date. Optional: Currency (follows the country),
            Status (defaults to Active). Countries can be names like Germany. Dates should look like 2021-03-15, or be real Excel dates.
            <div className="mt-3">
              <a href={TEMPLATE_HREF} download="employee-import-template.csv" className={cn(buttonVariants({ variant: "secondary" }))}>
                Download template
              </a>
            </div>
          </Card>
        </div>
      )}

      {stage.kind === "preview" && (
        <ImportPreview
          fileName={stage.fileName}
          mapped={stage.mapped}
          onReset={() => setStage({ kind: "idle" })}
          onDone={(result) => setStage({ kind: "done", result })}
        />
      )}

      {stage.kind === "done" && (
        <div className="flex max-w-[960px] flex-col gap-5">
          <Card className="p-6">
            <p className="text-sm font-medium text-muted">Import finished</p>
            <p className="tabular mt-1 text-[34px] font-bold leading-[42px] text-green-800">{formatNumber(stage.result.created)} employees imported</p>
            {stage.result.failed.length > 0 && (
              <p className="mt-1 text-[15px] text-amber-800">{formatNumber(stage.result.failed.length)} rows were skipped.</p>
            )}
          </Card>
          {stage.result.failed.length > 0 && <ProblemRows failures={stage.result.failed} />}
          <div className="flex flex-wrap gap-3">
            <Link href="/employees" className={cn(buttonVariants({ variant: "primary" }))}>
              View employees
            </Link>
            <button type="button" onClick={() => setStage({ kind: "idle" })} className={cn(buttonVariants({ variant: "secondary" }))}>
              Import another file
            </button>
          </div>
        </div>
      )}
    </>
  );
}
