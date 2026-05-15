import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_PORT === "465",
  name: "pulse-board.ygshjm.dev",
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASSWORD,
  },
});

const getFromEmail = () => process.env.SMTP_FROM_EMAIL || "no-reply@pulse-board.ygshjm.dev";

export const sendVerificationEmail = async (to: string, token: string) => {
  const verifyLink = `${process.env.CORS_CLIENT_URL}/verify-email/${token}`;

  await transporter.sendMail({
    from: `"PulseBoard" <${getFromEmail()}>`,
    to,
    subject: "Verify your email address - PulseBoard",
    html: `
      <h2>Welcome to PulseBoard!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyLink}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
    `,
  });
};

export const sendResetPasswordEmail = async (to: string, token: string) => {
  const resetLink = `${process.env.CORS_CLIENT_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from: `"PulseBoard" <${getFromEmail()}>`,
    to,
    subject: "Reset your password - PulseBoard",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background-color:#28a745;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
    `,
  });
};
