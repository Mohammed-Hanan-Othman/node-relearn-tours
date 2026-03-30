require("dotenv").config();
const nodemailer = require("nodemailer");

// const options = {
//     from : "Test-mail@myapp.com",
//     to: "Test-receipient@random.com",
//     subject: "Testing email sending",
//     text: `This is a very simple test email as part of my coding life.
//     Please feel free to ignore.`
//   };
exports.sendEmail = async (options) => {
  // setup transporter parameters
  const EMAIL_HOST = process.env.EMAIL_HOST;
  const EMAIL_PORT = process.env.EMAIL_PORT;
  const EMAIL_USERNAME = process.env.EMAIL_USERNAME;
  const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

  // Setup transporter
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD,
    },
  });

  //   var transport = nodemailer.createTransport({
  //   host: "sandbox.smtp.mailtrap.io",
  //   port: 2525,
  //   auth: {
  //     user: "a038a4c3c0e5f2",
  //     pass: "****e268"
  //   }
  // });
  // Setup mail options
  /** from, to, subject, text */
  const mailOptions = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};
