// Dynamic import to avoid compile errors if nodemailer isn't installed yet
let transporter: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
} catch {
  console.log('[Email] nodemailer not installed — email notifications disabled');
}

const FROM_ADDRESS = process.env.SMTP_FROM || 'IMS System <noreply@ppt-ims.com>';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Skip if SMTP is not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured, skipping:', options.subject, '→', options.to);
    return false;
  }

  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });
    console.log('[Email] Sent:', options.subject, '→', options.to);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send:', err);
    return false;
  }
}

// ─── Pre-built notification emails ───────────────────────────────────────────

export async function sendTaskAssignedEmail(userEmail: string, userName: string, taskTitle: string, projectName: string) {
  return sendEmail({
    to: userEmail,
    subject: `[IMS] New task assigned: ${taskTitle}`,
    text: `Hello ${userName},\n\nYou have been assigned a new task:\n\n📋 Task: ${taskTitle}\n📁 Project: ${projectName}\n\nPlease log in to IMS to view the details.\n\nBest regards,\nIMS System`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #4f46e5;">New Task Assigned</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>You have been assigned a new task:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>📋 Task:</strong> ${taskTitle}</p>
          <p style="margin: 4px 0;"><strong>📁 Project:</strong> ${projectName}</p>
        </div>
        <p>Please log in to IMS to view the details.</p>
        <p style="color: #6b7280; font-size: 12px;">— IMS System</p>
      </div>
    `,
  });
}

export async function sendRecordingAssignedEmail(userEmail: string, userName: string, recordingTitle: string) {
  return sendEmail({
    to: userEmail,
    subject: `[IMS] Recording assigned: ${recordingTitle}`,
    text: `Hello ${userName},\n\nA recording has been assigned to you:\n\n🎬 ${recordingTitle}\n\nPlease log in to IMS to start working on it.\n\nBest regards,\nIMS System`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #4f46e5;">Recording Assigned</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>A recording has been assigned to you:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>🎬 Recording:</strong> ${recordingTitle}</p>
        </div>
        <p>Please log in to IMS to start working on it.</p>
        <p style="color: #6b7280; font-size: 12px;">— IMS System</p>
      </div>
    `,
  });
}

export async function sendMediaRequestAcceptedEmail(userEmail: string, userName: string, sermonTitle: string, assigneeName: string) {
  return sendEmail({
    to: userEmail,
    subject: `[IMS] Media request accepted: ${sermonTitle}`,
    text: `Hello ${userName},\n\nYour media coverage request for "${sermonTitle}" has been accepted.\n\nAssigned to: ${assigneeName}\n\nBest regards,\nIMS System`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #16a34a;">✅ Media Request Accepted</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Your media coverage request has been accepted:</p>
        <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>📖 Sermon:</strong> ${sermonTitle}</p>
          <p style="margin: 4px 0;"><strong>👤 Assigned to:</strong> ${assigneeName}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">— IMS System</p>
      </div>
    `,
  });
}

export async function sendNewMessageEmail(userEmail: string, userName: string, senderName: string, messagePreview: string) {
  return sendEmail({
    to: userEmail,
    subject: `[IMS] New message from ${senderName}`,
    text: `Hello ${userName},\n\n${senderName} sent you a message:\n\n"${messagePreview.slice(0, 100)}"\n\nLog in to IMS to reply.\n\nBest regards,\nIMS System`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #4f46e5;">New Message</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p><strong>${senderName}</strong> sent you a message:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 0; font-style: italic;">"${messagePreview.slice(0, 200)}"</p>
        </div>
        <p>Log in to IMS to reply.</p>
        <p style="color: #6b7280; font-size: 12px;">— IMS System</p>
      </div>
    `,
  });
}
