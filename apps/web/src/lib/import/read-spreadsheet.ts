/**
 * Reads the first sheet of an .xlsx file, or a .csv file, as rows of cells.
 * Libraries are loaded on demand so they never slow down the rest of the app.
 */
export async function readSpreadsheet(file: File): Promise<unknown[][]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const Papa = (await import("papaparse")).default;
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(file, {
        skipEmptyLines: "greedy",
        complete: (result) => resolve(result.data),
        error: (error) => reject(new Error(error.message)),
      });
    });
  }

  if (name.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/universal");
    return (await readSheet(file)) as unknown[][];
  }

  if (name.endsWith(".xls")) {
    throw new Error("Old .xls files are not supported. Open the file in Excel and use Save As > Excel Workbook (.xlsx), or save it as CSV.");
  }
  throw new Error("Upload an Excel (.xlsx) or CSV (.csv) file.");
}
