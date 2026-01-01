import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendEmail = async (
  subject,
  message,
  send_to,
  sent_from,
  reply_to,
  filename,
  filepath
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "jibrandevr@gmail.com",
      pass: "lulaknwovtpgpiuk", // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const options = {
    from: sent_from,
    to: send_to,
    replyTo: reply_to,
    subject: subject,
    html: message,
    attachments: filename && filepath ? [
      {
        filename: filename,
        path: filepath,
        contentType: "application/pdf",
      },
    ] : [],
  };

  // Send Email with Promise to handle async/await
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        reject(err);
      } else {
        console.log('Email sent:', info.response);
        resolve(info);
      }
    });
  });
};

export default sendEmail;