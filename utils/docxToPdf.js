import { execFile } from "child_process";
import util from "util";
import path from "path";
import os from "os";

const execFileAsync = util.promisify(execFile);

function getLibreOfficeCommand() {
  const platform = os.platform();

  if (platform === "win32") {
    // Windows (local dev)
    return "soffice"; 
    // LibreOffice installer adds this to PATH automatically
  }

  // Linux (Ubuntu EC2) + macOS
  return "libreoffice";
}

export async function convertDocxToPdf(docxPath) {
  const outputDir = path.dirname(docxPath);
  const libreofficeCmd = getLibreOfficeCommand();

  await execFileAsync(libreofficeCmd, [
    "--headless",
    "--convert-to",
    "pdf",
    docxPath,
    "--outdir",
    outputDir,
  ]);

  return docxPath.replace(/\.docx$/i, ".pdf");
}
