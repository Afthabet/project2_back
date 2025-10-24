// controllers/inquiry.controller.js
const nodemailer = require('nodemailer');

// UPDATED: Replaced the Gmail-specific transporter with a generic SMTP one
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,      // The server address from your provider
//   port: process.env.SMTP_PORT,      // The port (465 for secure)
//   secure: process.env.SMTP_PORT == 465, // Use true for port 465
//   auth: {
//     user: process.env.EMAIL_USER, // Your email address: enquiries@charteredusedcar.ae
//     pass: process.env.EMAIL_PASS, // The password for that email account
//   },
// });

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use the built-in Gmail service settings
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your 16-character App Password
  },
});
exports.sendInquiry = async (req, res) => {
  const { name, email, phone, message, recipientEmail } = req.body;

  if (!name || !email || !phone || !message || !recipientEmail) {
    return res.status(400).send({ message: 'All fields are required.' });
  }

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    replyTo: email,
    to: recipientEmail,
    subject: `New Service Inquiry from ${name}`,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Inquiry sent successfully.' });
  } catch (error) {
    console.error('Error sending inquiry email:', error);
    res.status(500).send({ message: 'Failed to send inquiry.' });
  }
};