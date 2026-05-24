const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'mangamestewart8@gmail.com',
    pass: 'ktwubtzszxpogaon',
  },
});

async function main() {
  try {
    const info = await transporter.sendMail({
      from: '"DLEM" <mangamestewart8@gmail.com>',
      to: 'mangamestewart8@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email.',
    });
    console.log('Success:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
