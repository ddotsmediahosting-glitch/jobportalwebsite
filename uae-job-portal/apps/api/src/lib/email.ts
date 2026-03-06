import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: config.email.user
    ? { user: config.email.user, pass: config.email.pass }
    : undefined,
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (config.env === 'test') return; // skip in test env

  await transporter.sendMail({
    from: config.email.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

// ─── Template helpers ──────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; padding: 40px; }
    .header { background: #1d4ed8; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; margin: -40px -40px 30px; }
    .btn { display: inline-block; background: #1d4ed8; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; }
    .footer { color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2>UAE Jobs Portal</h2></div>
    ${content}
    <div class="footer">© ${new Date().getFullYear()} UAE Jobs Portal. All rights reserved.</div>
  </div>
</body>
</html>`;
}

export function emailVerificationTemplate(name: string, otp: string): string {
  return baseTemplate(`
    <h3>Verify Your Email Address</h3>
    <p>Hi ${name},</p>
    <p>Your email verification code is:</p>
    <h1 style="letter-spacing:8px; color:#1d4ed8; text-align:center;">${otp}</h1>
    <p>This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
  `);
}

export function passwordResetTemplate(name: string, resetUrl: string): string {
  return baseTemplate(`
    <h3>Reset Your Password</h3>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below:</p>
    <p style="text-align:center;"><a href="${resetUrl}" class="btn">Reset Password</a></p>
    <p>This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.</p>
  `);
}

export function applicationStatusTemplate(
  seekerName: string,
  jobTitle: string,
  company: string,
  status: string
): string {
  return baseTemplate(`
    <h3>Application Status Update</h3>
    <p>Hi ${seekerName},</p>
    <p>Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been updated.</p>
    <p>New status: <strong style="color:#1d4ed8;">${status}</strong></p>
    <p>Log in to your account to view the full details.</p>
  `);
}

export function jobAlertTemplate(
  name: string,
  jobs: Array<{ title: string; company: string; slug: string; emirate: string }>,
  frontendUrl: string
): string {
  const jobItems = jobs
    .map(
      (j) =>
        `<li style="margin-bottom:12px;"><a href="${frontendUrl}/jobs/${j.slug}" style="color:#1d4ed8;font-weight:bold;">${j.title}</a> at ${j.company} – ${j.emirate}</li>`
    )
    .join('');

  return baseTemplate(`
    <h3>New Jobs Matching Your Alert</h3>
    <p>Hi ${name},</p>
    <p>Here are the latest jobs matching your saved search:</p>
    <ul>${jobItems}</ul>
    <p><a href="${frontendUrl}/jobs" class="btn">View All Jobs</a></p>
  `);
}
