import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import util from "util";
import { riasecDescriptions } from "./utils/riasecDescriptions.js";
import { careerClusterNames } from "./utils/careerClusterNames.js";

const execFileAsync = util.promisify(execFile);

export async function generateExcelReport({ jobDir, name, org, grade, date, answers }) {
  if (!Array.isArray(answers) || answers.length !== 279) {
    throw new Error("Answers must be 279 values");
  }

  const templatePath = path.resolve("./psychometric.xlsx");
  const outputPath = path.join(jobDir, "report.xlsx");

  // 1️⃣ Clone template
  fs.copyFileSync(templatePath, outputPath);

  // 2️⃣ Call Python ASYNC
  const { stdout } = await execFileAsync("python", [
    "fill_excel.py",
    outputPath,
    JSON.stringify({ name, org, grade, date, answers }),
  ]);

  const extracted = JSON.parse(stdout);

  const rawText = extracted.personalityAnalyzer;
  const match = rawText.match(/Dominant Type:\s+([A-Z]{4})/);
  // 1. Extract MBTI
  const mbtiType = match ? match[1] : null;
  const riasecScores = extracted.riasec;
  // 2. Extract Dominant RIASEC
  const dominantKey = Object.keys(riasecScores).reduce((a, b) => riasecScores[a] > riasecScores[b] ? a : b);
  const dominantRiasec = riasecDescriptions[dominantKey];
  // 3. Map Career Clusters (Top 2 and Bottom 2)
  const topCareers = extracted.sece.top2.map(key => careerClusterNames[key.toUpperCase()]);
  const bottomCareers = extracted.sece.bottom2.map(key => careerClusterNames[key.toUpperCase()]);

  // console.log('-----------------------');
  // console.log('Personality:', mbtiType);
  // console.log('RIASEC Dominant:', dominantRiasec.name);
  // console.log('Top Career Clusters:', topCareers.join(', '));
  // console.log('Bottom Career Clusters:', bottomCareers.join(', '));
  // console.log('-----------------------');

  return {
    excelPath: outputPath,
    mbtiType,
    dominantRiasec,
    topCareers,
    bottomCareers
  };
}
