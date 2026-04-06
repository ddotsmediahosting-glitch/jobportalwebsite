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

// ─── SMTP health check (cached per process) ────────────────────────────────
let _smtpAvailable: boolean | null = null;

/**
 * Returns true only if SMTP credentials are set AND the connection succeeds.
 * Result is cached for the lifetime of the process — tested once at startup.
 *
 * Common failure: Gmail requires an App Password, not the account password.
 * Plain Gmail passwords have been rejected since May 2022.
 * Get one at: myaccount.google.com/apppasswords
 */
export async function checkSmtpAvailable(): Promise<boolean> {
  if (_smtpAvailable !== null) return _smtpAvailable;

  const { user, pass } = config.email;
  if (!user || !pass || user.includes('your_') || pass.includes('your_')) {
    _smtpAvailable = false;
    console.log('[Email] SMTP not configured — email verification disabled');
    return false;
  }

  try {
    await transporter.verify();
    _smtpAvailable = true;
    console.log('[Email] ✅ SMTP connection verified');
  } catch (err) {
    _smtpAvailable = false;
    console.warn(
      '[Email] ⚠️  SMTP connection failed — email verification disabled.',
      '\n         Error:', (err as Error).message,
      '\n         If using Gmail, use an App Password (not your account password).',
      '\n         Get one at: myaccount.google.com/apppasswords'
    );
  }

  return _smtpAvailable;
}

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
    body { font-family: Arial, sans-serif; background: #f0f9fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(58,169,176,0.08); }
    .header { background: linear-gradient(135deg, #3aa9b0 0%, #2e8c93 100%); color: #fff; padding: 24px 30px; border-radius: 12px 12px 0 0; text-align: center; margin: -40px -40px 30px; }
    .header h2 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
    .btn { display: inline-block; background: #3aa9b0; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .otp { letter-spacing: 8px; color: #3aa9b0; text-align: center; font-size: 36px; font-weight: 700; margin: 16px 0; }
    .status-badge { display: inline-block; background: #e6f7f8; color: #2e8c93; padding: 4px 12px; border-radius: 20px; font-weight: 600; }
    .footer { color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #e6f7f8; padding-top: 20px; text-align: center; }
    a { color: #3aa9b0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Ddotsmedia Jobs</h2>
      <p>Your career starts here</p>
    </div>
    ${content}
    <div class="footer">© ${new Date().getFullYear()} Ddotsmedia Jobs. All rights reserved.<br>This is an automated email — please do not reply.</div>
  </div>
</body>
</html>`;
}

export function emailVerificationTemplate(name: string, otp: string, verifyUrl: string): string {
  return baseTemplate(`
    <h3>Verify Your Email Address</h3>
    <p>Hi ${name},</p>
    <p>Click the button below to verify your email and activate your account:</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" class="btn" style="font-size:16px;padding:14px 36px;">✅ Verify My Email</a>
    </p>
    <p style="color:#666;font-size:13px;text-align:center;">Or enter this code manually on the verification page:</p>
    <div class="otp">${otp}</div>
    <p style="color:#888;font-size:12px;text-align:center;">This link expires in <strong>15 minutes</strong>.<br>If you didn't create an account, you can safely ignore this email.</p>
  `);
}

export function passwordResetTemplate(name: string, resetUrl: string): string {
  return baseTemplate(`
    <h3>Reset Your Password</h3>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new password:</p>
    <p style="text-align:center;margin:24px 0;"><a href="${resetUrl}" class="btn">Reset Password</a></p>
    <p style="color:#888;font-size:13px;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, no action is needed — your account is safe.</p>
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
    <p>New status: <span class="status-badge">${status}</span></p>
    <p>Log in to your account to view the full details and any messages from the employer.</p>
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
        `<li style="margin-bottom:12px;"><a href="${frontendUrl}/jobs/${j.slug}" style="color:#3aa9b0;font-weight:bold;">${j.title}</a> at ${j.company} – ${j.emirate}</li>`
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
