import express from "express";
import dotenv from "dotenv";
import cloudinary from "./cloudinary.js";
import { generateExcelReport } from "./excelService.js";
import { convertExcelToPDF } from "./pdfService.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import generateIntroPDF from "./generateIntroPDF.js";
import generateSummaryPDF from "./generateSummaryPDF.js";
import mergePdfs from "./utils/mergePdfs.js";
import { careerPdfMap } from "./utils/careerPdfMap.js";
import { riasecPdfMap } from "./utils/riasecPdfMap.js";
import sendEmail from "./sendEmail.js";
import fs from "fs"; // Change this to use promises
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
dotenv.config();
const app = express();

app.use(express.json({ limit: "2mb" }));

const getTimestamp = () => new Date().getTime();

async function addPagination(pdfPath) {
  try {
    // Read the file using the promise-based fs
    const pdfBytes = await fs.promises.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Loop through pages
    pages.forEach((page, index) => {
      // 1st page is index 0, last page is index totalPages - 1
      // Logic: Skip first and last
      if (index === 0 || index === totalPages - 1) return;

      const { width } = page.getSize();
      const pageNumber = index + 1; // Human readable (starts at 2 for the second page)
      const text = `Page ${pageNumber} of ${totalPages}`;

      // Calculate width of text to align right precisely
      const fontSize = 10;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      page.drawText(text, {
        x: width - textWidth - 40, // 40 units margin from right
        y: 30,                     // 30 units margin from bottom
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });

    const updatedPdfBytes = await pdfDoc.save();
    await fs.promises.writeFile(pdfPath, updatedPdfBytes);
    console.log("✅ Pagination added successfully (skipping first/last)");
  } catch (error) {
    console.error("❌ Error in addPagination:", error);
    throw error;
  }
}


app.post("/generate-report", async (req, res) => {
  const jobId = uuidv4();
  const jobDir = path.resolve(`./uploads/job_${jobId}`);
  const secondPDFDir = path.resolve(`./template/2.pdf`);
  const lastPDFDir = path.resolve(`./template/last.pdf`);
  const finalPdfPath = path.join(jobDir, "final_report.pdf");
  fs.mkdirSync(jobDir, { recursive: true });

  try {
    const { answers, name, org, grade, date } = req.body;

    // 1️⃣ Excel
    const { excelPath, mbtiType, dominantRiasec, topCareers, bottomCareers, topCodes, bottomCode, dominantKey } = await generateExcelReport({ jobDir, name, org, grade, date, answers });

    // 2️⃣ Excel → PDF
    const reportPdf = await convertExcelToPDF(excelPath);

    // 3️⃣ Intro
    const intro = await generateIntroPDF({ jobDir, name, org, grade, date });

    // 3️⃣ summary
    const summary = await generateSummaryPDF({ jobDir, mbtiType, dominantRiasec, topCareers, bottomCareers });

    const vocational_finderFolderPath = path.resolve(`./template/vocational_finder/${riasecPdfMap[dominantKey]}`);
    const personality_analyzerFolderPath = path.resolve(`./template/personality_analyzer/5. ${mbtiType}.pdf`);
    const career_funnel_1AFolderPath = path.resolve(`./template/career_funnel_1/${careerPdfMap[topCodes?.[0]?.toUpperCase()]?.funnel1}`);
    const career_funnel_1BFolderPath = path.resolve(`./template/career_funnel_2/${careerPdfMap[topCodes?.[1]?.toUpperCase()]?.funnel2}`);
    const career_funnel_2AFolderPath = path.resolve(`./template/career_funnel_least_1/${careerPdfMap[bottomCode?.[0]?.toUpperCase()]?.funnelLeast1}`);
    const career_funnel_2BFolderPath = path.resolve(`./template/career_funnel_least_2/${careerPdfMap[bottomCode?.[1]?.toUpperCase()]?.funnelLeast2}`);

    await mergePdfs([intro.pdfPath, secondPDFDir, reportPdf, vocational_finderFolderPath, personality_analyzerFolderPath, career_funnel_1AFolderPath, career_funnel_1BFolderPath, summary.pdfPath, career_funnel_2AFolderPath, career_funnel_2BFolderPath, lastPDFDir], finalPdfPath);

    await addPagination(finalPdfPath);

    //   const cloudinaryResponse = await cloudinary.uploader.upload(finalPdfPath, {
    //     folder: 'products/pdfs',
    //     public_id: `RIASEC_Report_${name.replace(/\s+/g, '_')}_${getTimestamp()}`,
    //     resource_type: 'raw',
    //   });

    //  let pdfUrl = cloudinaryResponse.secure_url;

    //   const sendEmailFunc = async (subject, message, email, filename, filepath) => {
    //     try {
    //       const send_to = email;
    //       const sent_from = "jibrandevr@gmail.com";
    //       const reply_to = "jibrandevr@gmail.com";
    //       console.log('Email details:', { subject, message, send_to, sent_from, reply_to, filename, filepath });
    //       await sendEmail(subject, message, send_to, sent_from, reply_to, filename, filepath);
    //       console.log('Email sent successfully!');
    //     } catch (error) {
    //       console.error('Error sending email:', error);
    //       throw error; // Rethrow to handle in generatePDF
    //     }
    //   };

    //   const emailSubject = `Your RIASEC Report for ${name}`;
    //   const emailMessage = `
    //         <h2>Hello ${name},</h2>
    //         <p>Thank you for using our service. Attached is your personalized RIASEC report.</p>
    //         <p>Best regards,</p>
    //         <p>My Career Buddy Team</p>
    //       `;
    //   await sendEmailFunc(emailSubject, emailMessage, email, filename, filePath)

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
