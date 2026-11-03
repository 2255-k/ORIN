import nodemailer from "nodemailer";
import { env, hasSmtp } from "../config/env.js";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!hasSmtp) {
    console.log(`[ORIN] Password reset for ${to}: ${resetUrl}`);
    return { sent: false, reason: "SMTP is not configured. Reset link logged on the server." };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "Reset your ORIN password",
    text: `Reset your password: ${resetUrl}\nThis link expires in 1 hour.`,
    html: `<p>Reset your ORIN password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
  });

  return { sent: true };
}
