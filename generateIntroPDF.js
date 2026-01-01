// generateIntroPDF.js
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { v4 as uuidv4 } from "uuid";
import { convertDocxToPdf } from "./utils/docxToPdf.js";

const generateIntroPDF = async ({ jobDir, name, org, grade, date }) => {

  const templatePath = path.resolve("intro_template.docx");
  const tempDocxPath = path.join(jobDir, "intro.docx");

  // 1️⃣ Read template
  const content = fs.readFileSync(templatePath, "binary");

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{", end: "}" },
    paragraphLoop: true,
    linebreaks: true,
  });


  // 2️⃣ Inject data
  doc.render({ name, org, grade, date });

  // 3️⃣ Save DOCX
  const buffer = doc.getZip().generate({ type: "nodebuffer" });

  fs.writeFileSync(tempDocxPath, buffer);

  const pdfPath = await convertDocxToPdf(tempDocxPath);

  // Optional but recommended: delete DOCX
  fs.unlinkSync(tempDocxPath);

  return {
    pdfPath,
  };
};
export default generateIntroPDF;
