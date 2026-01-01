import { execFile } from "child_process";

export function convertExcelToPDF(excelPath) {
  return new Promise((resolve, reject) => {
    execFile(
      "python",
      ["export_report_pdf.py", excelPath, "Report"], // ← sheet name
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(excelPath.replace(".xlsx", ".pdf"));
        }
      }
    );
  });
}
  