import "dotenv/config";
import nodemailer, { type Transporter } from "nodemailer";

interface SendOtpEmailParams {
  to: string;
  otp: string;
}

let transporter: Transporter | null = null;

function cleanEnvString(val?: string): string {
  if (!val) return "";
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned;
}

function getMailTransporter(): Transporter | null {
  const host = cleanEnvString(process.env.SMTP_HOST);
  const service = cleanEnvString(process.env.SMTP_SERVICE).toLowerCase();
  const user = cleanEnvString(process.env.SMTP_USER);
  const rawPass = cleanEnvString(process.env.SMTP_PASSWORD);
  // Strip whitespace and any extraneous quotes from passwords
  const pass = rawPass.replace(/["']/g, "").replace(/\s+/g, "");

  // If credentials are not provided, do not initialize live SMTP
  if (!user || !pass) {
    return null;
  }

  // If user provided a Gmail address or service="gmail" or host contains gmail
  const isGmail =
    service === "gmail" ||
    host === "smtp.gmail.com" ||
    host.includes("gmail") ||
    (user && user.toLowerCase().endsWith("@gmail.com"));

  if (!host && !isGmail) {
    return null;
  }

  if (!transporter) {
    if (isGmail) {
      // Nodemailer's built-in "gmail" service with strict timeouts to prevent hanging on restricted hosts like Render
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      });
    } else {
      const rawPort = cleanEnvString(process.env.SMTP_PORT);
      const port = rawPort ? Number(rawPort) : 587;
      const secure = port === 465;

      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
  }

  return transporter;
}

/**
 * Sends email over HTTP REST API (HTTPS Port 443).
 * This completely bypasses Render Free Tier's outbound SMTP block on ports 25, 465, and 587.
 */
async function sendViaHttpApi({
  to,
  subject,
  textContent,
  htmlContent,
  fromEmail,
}: {
  to: string;
  subject: string;
  textContent: string;
  htmlContent: string;
  fromEmail?: string;
}): Promise<boolean> {
  const resendApiKey = cleanEnvString(process.env.RESEND_API_KEY);
  if (resendApiKey) {
    try {
      const resendFrom = cleanEnvString(process.env.RESEND_FROM) || "Placement OS <onboarding@resend.dev>";
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject,
          text: textContent,
          html: htmlContent,
        }),
      });
      if (resp.ok) {
        console.log(`[Email Service] Delivered via Resend HTTP API to ${maskEmail(to)}`);
        return true;
      }
      const errText = await resp.text();
      console.error(`[Email Service] Resend API error:`, errText);
    } catch (err: any) {
      console.error(`[Email Service] Resend request failed:`, err.message);
    }
  }

  const brevoApiKey = cleanEnvString(process.env.BREVO_API_KEY);
  if (brevoApiKey) {
    try {
      const senderEmail = fromEmail || cleanEnvString(process.env.SMTP_USER) || "noreply@placementos.com";
      const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Placement OS", email: senderEmail },
          to: [{ email: to }],
          subject,
          textContent,
          htmlContent,
        }),
      });
      if (resp.ok) {
        console.log(`[Email Service] Delivered via Brevo HTTP API to ${maskEmail(to)}`);
        return true;
      }
      const errText = await resp.text();
      console.error(`[Email Service] Brevo API error:`, errText);
    } catch (err: any) {
      console.error(`[Email Service] Brevo request failed:`, err.message);
    }
  }

  return false;
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const name = parts[0];
  const domain = parts[1];
  const maskedName =
    name.length <= 2
      ? name[0] + "*"
      : name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  return `${maskedName}@${domain}`;
}

export async function sendOtpEmail({ to, otp }: SendOtpEmailParams): Promise<boolean> {
  const mailTransporter = getMailTransporter();
  const smtpUser = cleanEnvString(process.env.SMTP_USER);
  const rawFrom = cleanEnvString(process.env.MAIL_FROM);
  // Display strictly as "Placement OS"
  const from = rawFrom || (smtpUser ? `"Placement OS" <${smtpUser}>` : "Placement OS <noreply@placementos.com>");
  const replyTo = smtpUser || from;

  const subject = "Verify Your Email - Placement OS Password Reset OTP";

  const textContent = `Placement OS Password Reset\n\nYour 6-digit verification code is: ${otp}\n\nThis OTP is valid for 5 minutes.\nIf you did not request a password reset, please ignore this email. Do not share this OTP with anyone.`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Placement OS Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
    <tr>
      <td style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px 28px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <!-- Logo / Title -->
        <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 24px;">
          Placement OS
        </div>

        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.3px;">
          Reset Your Password
        </h1>

        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 28px 0;">
          Here is your 6-digit verification code to reset your Placement OS account password:
        </p>

        <!-- OTP Box -->
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 28px 0;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1e3a8a; display: inline-block;">
            ${otp}
          </div>
          <div style="font-size: 13px; font-weight: 500; color: #64748b; margin-top: 10px;">
            This OTP is valid for 5 minutes
          </div>
        </div>

        <p style="font-size: 13.5px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0;">
          If you did not request a password reset, you can safely ignore this email. Do not share this OTP with anyone.
        </p>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px; font-size: 12.5px; color: #94a3b8; line-height: 1.5;">
          This is an automated security transmission. Placement OS administrators will never ask for your verification code.
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; 2026 Placement OS. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // 1. Try sending via HTTP Email API (Resend / Brevo) first if configured
  // HTTP APIs use HTTPS port 443 which is NEVER blocked by Render Free Tier
  if (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY) {
    const sentViaHttp = await sendViaHttpApi({
      to,
      subject,
      textContent,
      htmlContent,
      fromEmail: smtpUser,
    });
    if (sentViaHttp) return true;
  }

  // 2. Try SMTP
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from,
        to,
        replyTo,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[Email Service] Real SMTP email sent to ${maskEmail(to)}`);
      return true;
    } catch (err: any) {
      console.error(`[Email Service] Failed to send email to ${maskEmail(to)} via SMTP:`, err.message);
      transporter = null;
      if (err.message?.includes("Username and Password not accepted") || err.code === "EAUTH") {
        console.error("[Email Service Hint] Gmail authentication failed. Ensure you use a 16-character Google App Password (not your normal Gmail password) and that 2-Step Verification is active.");
      } else if (err.code === "ETIMEDOUT" || err.code === "ESOCKET" || err.message?.includes("timeout")) {
        console.error("[Email Service Hint] Connection timed out! Render Free Tier blocks outbound SMTP traffic on ports 25, 465, and 587. Recommendation: Add RESEND_API_KEY (from https://resend.com) to your Render Environment Variables to send over HTTPS port 443.");
      }
      return false;
    }
  } else {
    console.warn(
      `[Email Service] SMTP is not configured. Simulated OTP was securely generated for ${maskEmail(to)}.`
    );
    return true;
  }
}

export async function sendRegistrationOtpEmail({
  to,
  otp,
  studentName,
}: {
  to: string;
  otp: string;
  studentName?: string;
}): Promise<boolean> {
  const mailTransporter = getMailTransporter();
  const smtpUser = cleanEnvString(process.env.SMTP_USER);
  const rawFrom = cleanEnvString(process.env.MAIL_FROM);
  // Display strictly as "Placement OS"
  const from = rawFrom || (smtpUser ? `"Placement OS" <${smtpUser}>` : "Placement OS <noreply@placementos.com>");
  const replyTo = smtpUser || from;

  const displayName = studentName?.trim() || "Student";
  const subject = "Verify Your Email - Placement OS Student Registration OTP";

  const textContent = `Hello ${displayName},\n\nWelcome to Placement OS! Enter the 6-digit verification code below to verify your email address and activate your student account:\n\n${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you did not attempt to register on Placement OS, you can safely ignore this email. Do not share this OTP with anyone.`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Placement OS Student Registration OTP</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
    <tr>
      <td style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px 28px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <!-- Logo / Title -->
        <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 24px;">
          Placement OS
        </div>

        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.3px;">
          Verify Your Email Address
        </h1>

        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 28px 0;">
          Hello ${displayName}, Welcome to Placement OS! Enter the 6-digit verification code below to verify your email address and activate your student account:
        </p>

        <!-- OTP Box -->
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 28px 0;">
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #1e3a8a; display: inline-block;">
            ${otp}
          </div>
          <div style="font-size: 13px; font-weight: 500; color: #64748b; margin-top: 10px;">
            This OTP is valid for 5 minutes
          </div>
        </div>

        <p style="font-size: 13.5px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0;">
          If you did not attempt to register on Placement OS, you can safely ignore this email. Do not share this OTP with anyone.
        </p>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px; font-size: 12.5px; color: #94a3b8; line-height: 1.5;">
          This is an automated security transmission. Placement OS administrators will never ask for your verification code.
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; 2026 Placement OS. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // 1. Try sending via HTTP Email API (Resend / Brevo) first if configured
  // HTTP APIs use HTTPS port 443 which is NEVER blocked by Render Free Tier
  if (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY) {
    const sentViaHttp = await sendViaHttpApi({
      to,
      subject,
      textContent,
      htmlContent,
      fromEmail: smtpUser,
    });
    if (sentViaHttp) return true;
  }

  // 2. Try SMTP
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from,
        to,
        replyTo,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[Email Service] Real registration OTP sent to ${maskEmail(to)}`);
      return true;
    } catch (err: any) {
      console.error(`[Email Service] Failed to send registration email to ${maskEmail(to)} via SMTP:`, err.message);
      transporter = null;
      if (err.message?.includes("Username and Password not accepted") || err.code === "EAUTH") {
        console.error("[Email Service Hint] Gmail authentication failed. Ensure you use a 16-character Google App Password (not your normal Gmail password) and that 2-Step Verification is active.");
      } else if (err.code === "ETIMEDOUT" || err.code === "ESOCKET" || err.message?.includes("timeout")) {
        console.error("[Email Service Hint] Connection timed out! Render Free Tier blocks outbound SMTP traffic on ports 25, 465, and 587. Recommendation: Add RESEND_API_KEY (from https://resend.com) to your Render Environment Variables to send over HTTPS port 443.");
      }
      return false;
    }
  } else {
    console.warn(
      `[Email Service] Simulated registration OTP stored for ${maskEmail(to)}.`
    );
    return true;
  }
}
