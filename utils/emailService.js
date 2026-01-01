import nodemailer from "nodemailer";

const sendEmail = async (subject, message, send_to, sent_from, reply_to, filename, filepath) => {
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
    attachments: [
      {
        filename: filename,
        path: filepath,
      },
    ],
  };

  // Send Email
  return transporter.sendMail(options);
};

export default sendEmail;