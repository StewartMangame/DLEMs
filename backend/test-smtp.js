const nodemailer = require('nodemailer');
const { existsSync, readFileSync } = require('fs');
const { resolve } = require('path');

function loadEnv() {
  for (const file of [resolve(__dirname, '.env'), resolve(process.cwd(), 'backend/.env')]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;
      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed
        .slice(equalsIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      process.env[key] = process.env[key] || value;
    }
  }
}

loadEnv();

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
  },
});

async function main() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER and SMTP_PASS must be set in backend/.env');
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"DLEM" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_TEST_TO || process.env.SMTP_USER,
      subject: 'Test Email',
      text: 'This is a test email.',
    });
    console.log('Success:', info.messageId);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
