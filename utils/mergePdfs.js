import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

const mergePdfs = async (pdfPaths, outputPath) => {
  const mergedPdf = await PDFDocument.create();

  for (const pdfPath of pdfPaths) {
    if (!fs.existsSync(pdfPath)) continue;

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);

    const copiedPages = await mergedPdf.copyPages(
      pdf,
      pdf.getPageIndices()
    );

    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedBytes);

  return outputPath;
};

export default mergePdfs;
