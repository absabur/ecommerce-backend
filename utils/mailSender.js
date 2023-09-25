const nodemailer = require("nodemailer");


const sendEmailWithNode = async (emailData) => {
  const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    });
  try {
    const mailOptions = {
      from: process.env.SMTP_USERNAME, // sender address
      to: emailData.email, // list of receivers
      subject: emailData.subject, // Subject line
      html: emailData.html, // html body
    };
    const info = await transporter.sendMail(mailOptions)
    console.log(info.response)
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = sendEmailWithNode;