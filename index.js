import express from "express";
import dotenv from "dotenv";
import cloudinary from "./cloudinary.js";
import { generateExcelReport } from "./excelService.js";
import { convertExcelToPDF } from "./pdfService.js";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import generateIntroPDF from "./generateIntroPDF.js";
import generateSummaryPDF from "./generateSummaryPDF.js";
import mergePdfs from "./utils/mergePdfs.js";

dotenv.config();
const app = express();

app.use(express.json({ limit: "2mb" }));

app.post("/generate-report", async (req, res) => {
  const jobId = uuidv4();
  const jobDir = path.resolve(`./uploads/job_${jobId}`);
  const finalPdfPath = path.join(jobDir, "final_report.pdf");
  fs.mkdirSync(jobDir, { recursive: true });

  try {
    const { answers, name, org, grade, date } = req.body;

    // 1️⃣ Excel
    const { excelPath, mbtiType, dominantRiasec, topCareers, bottomCareers } = await generateExcelReport({ jobDir, name, org, grade, date, answers });

    // 2️⃣ Excel → PDF
    const reportPdf = await convertExcelToPDF(excelPath);

    // 3️⃣ Intro
    const intro = await generateIntroPDF({ jobDir, name, org, grade, date, mbtiType, dominantRiasec, topCareers, bottomCareers });

    // 3️⃣ summary
    const summary = await generateSummaryPDF({ jobDir, mbtiType, dominantRiasec, topCareers, bottomCareers });

    await mergePdfs([intro.pdfPath, reportPdf, summary.pdfPath], finalPdfPath);

    res.json({
      success: true,
      jobId,
      files: {
        excel: excelPath,
        finalPdfPath
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
