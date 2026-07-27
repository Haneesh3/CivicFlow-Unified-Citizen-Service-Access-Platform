import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.logger.log(`SMTP configured. Initializing real email dispatcher via ${host}:${port}...`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.logger.warn('SMTP credentials not fully configured. Real emails will NOT be sent.');
      this.logger.warn('To send real emails to your Gmail/inbox, add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to apps/api/.env.');
    }
  }

  async sendPasswordResetEmail(email: string, otp: string, resetLink: string): Promise<boolean> {
    const subject = 'CivicFlow - Password Reset Verification Code';

    // HTML Email Template matching CivicFlow visual aesthetics
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F8FAFC;
      padding: 40px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #E2E8F0;
    }
    .header {
      background-color: #050A44;
      padding: 30px;
      text-align: center;
    }
    .logo-text {
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .gov-label {
      color: #F97316;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .content {
      padding: 40px 30px;
      color: #334155;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 20px;
    }
    p {
      font-size: 16px;
      line-height: 24px;
      margin-bottom: 24px;
      color: #475569;
    }
    .otp-container {
      background-color: #F0F7FF;
      border: 1px dashed #3B82F6;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #1E3A8A;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #050A44;
      margin: 0;
      font-family: monospace;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      background-color: #F97316;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      font-size: 16px;
      font-weight: 700;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2);
      transition: background-color 0.2s;
    }
    .btn:hover {
      background-color: #EA580C;
    }
    .footer {
      background-color: #F1F5F9;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #E2E8F0;
    }
    .footer-text {
      font-size: 12px;
      color: #64748B;
      line-height: 18px;
      margin: 0;
    }
    .warning-text {
      font-size: 13px;
      color: #EF4444;
      margin-top: 16px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">CivicFlow</div>
        <div class="gov-label">Government of India Citizen Portal</div>
      </div>
      <div class="content">
        <h1>Password Reset Request</h1>
        <p>Dear Citizen,</p>
        <p>We received a request to reset the password associated with your email address (<strong>${email}</strong>). Please use the secure 6-digit verification code below to complete the reset process directly in your mobile app:</p>
        
        <div class="otp-container">
          <div class="otp-label">Verification Code (OTP)</div>
          <div class="otp-code">${otp}</div>
        </div>

        <p>If you are resetting your password via our web portal, you can click the button below to set a new password directly:</p>
        
        <div class="btn-container">
          <a href="${resetLink}" target="_blank" class="btn">Reset Password Online</a>
        </div>

        <p class="warning-text">This code and link will expire in 15 minutes. If you did not request a password reset, please ignore this email or contact support if you have security concerns.</p>
      </div>
      <div class="footer">
        <p class="footer-text">© 2026 CivicFlow Platform. All rights reserved.<br>National Citizen Service & Unified Governance Division.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // 1. Generate local HTML file for instant dev preview
    let fileUrl = '';
    try {
      const tempDir = path.join(process.cwd(), 'temp-emails');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const fileName = `${email.replace(/[^a-zA-Z0-9]/g, '_')}_reset.html`;
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, htmlContent, 'utf8');

      const absolutePath = path.resolve(filePath);
      fileUrl = `file:///${absolutePath.replace(/\\/g, '/')}`;
    } catch (e) {
      this.logger.error('Failed to write local email preview file', e);
    }

    // 2. Dispatch the real email if transporter is configured
    if (this.transporter) {
      try {
        const fromName = process.env.SMTP_FROM_NAME || 'CivicFlow Support';
        const fromAddress = process.env.SMTP_USER; // Must match authenticated user
        
        this.logger.log(`📬 Dispatching REAL email to: ${email}...`);
        await this.transporter.sendMail({
          from: `"${fromName}" <${fromAddress}>`,
          to: email,
          subject: subject,
          text: `CivicFlow Password Reset Code: ${otp}\n\nReset online: ${resetLink}`,
          html: htmlContent,
        });
        
        this.logger.log(`✅ Email successfully sent to ${email}!`);
        return true;
      } catch (err: any) {
        this.logger.error(`❌ Failed to send real SMTP email to ${email}: ${err.message}`, err.stack);
        this.logger.warn('Falling back to local logs and preview files...');
      }
    }

    // 3. Fallback: Log to server console in a very beautiful formatted box (Only in development/test)
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n' + '='.repeat(80));
      console.log('✉️  CIVICFLOW MAIL DISPATCH LOG (SMTP FALLBACK)');
      console.log('='.repeat(80));
      console.log(`To:      ${email}`);
      console.log(`Subject: ${subject}`);
      console.log('-'.repeat(80));
      console.log(`🔑 MOBILE OTP CODE:    ${otp}`);
      console.log(`🌐 WEB RESET LINK:     ${resetLink}`);
      console.log('-'.repeat(80));
      if (fileUrl) {
        console.log(`👉 Double-click to open preview in browser:\n   ${fileUrl}`);
      }
      console.log('='.repeat(80) + '\n');
    }

    return true;
  }
}
