import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { convertDocxToPdf } from "./utils/docxToPdf.js";

const generateSummaryPDF = async ({
  jobDir,
  dominantRiasec,
  mbtiType,
  topCareers,
  bottomCareers,
}) => {
  const templatePath = path.resolve("summary.docx");
  const tempDocxPath = path.join(jobDir, "summary_temp.docx");

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{", end: "}" },
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    dominantriasecname: dominantRiasec?.name || "",
    dominantriasecdescription: dominantRiasec?.description || "",
    mbtitype: mbtiType || "",
    top1: topCareers?.[0] || "",
    top2: topCareers?.[1] || "",
    bottom1: bottomCareers?.[0] || "",
    bottom2: bottomCareers?.[1] || "",
  });

  const buffer = doc.getZip().generate({ type: "nodebuffer" });
  fs.writeFileSync(tempDocxPath, buffer);
  // Convert → PDF
  const pdfPath = await convertDocxToPdf(tempDocxPath);

  // Optional but recommended: delete DOCX
  fs.unlinkSync(tempDocxPath);

  return {
    pdfPath,
  };
};

export default generateSummaryPDF;