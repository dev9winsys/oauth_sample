import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>("SMTP_HOST");
    const port = Number(this.configService.get<string>("SMTP_PORT") || 587);
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASSWORD");
    const secure = this.configService.get<string>("SMTP_SECURE") === "true";

    if (!host || !user || !pass) {
      this.logger.warn(
        "SMTP configuration is incomplete. Email sending may fail. Please ensure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are all set.",
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Send email with common function
   * @param to - Recipient email address
   * @param template - Email template with subject, text, and html
   * @returns Promise that resolves when email is sent
   */
  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    const emailFrom =
      this.configService.get<string>("EMAIL_FROM") || "noreply@example.com";

    const mailOptions = {
      from: emailFrom,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  /**
   * Get email template for verification
   * @param serviceName - Name of the service
   * @param verificationUrl - URL for email verification
   * @returns Email template with subject, text, and html
   */
  private getVerificationEmailTemplate(
    serviceName: string,
    verificationUrl: string,
  ): EmailTemplate {
    return {
      subject: this.getVerificationEmailSubject(),
      text: this.getVerificationEmailText(serviceName, verificationUrl),
      html: this.getVerificationEmailHtml(serviceName, verificationUrl),
    };
  }

  /**
   * Send verification email to user
   * @param email - User email address
   * @param token - Verification token
   * @returns Promise that resolves when email is sent
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    // Validate input parameters
    if (!email || email.trim() === "") {
      throw new BadRequestException("Email address is required");
    }
    if (!token || token.trim() === "") {
      throw new BadRequestException("Verification token is required");
    }

    const serviceName =
      this.configService.get<string>("SERVICE_NAME") || "AuthJwt";
    const serviceUrl =
      this.configService.get<string>("SERVICE_URL") || "http://localhost:4000";
    const verificationUrl = `${serviceUrl}/users/verify-email?token=${encodeURIComponent(token)}`;

    const template = this.getVerificationEmailTemplate(
      serviceName,
      verificationUrl,
    );
    await this.sendEmail(email, template);
  }

  /**
   * Get email subject for verification email
   * @returns Email subject
   */
  private getVerificationEmailSubject(): string {
    return "【仮登録のお知らせ】";
  }

  /**
   * HTML escape a string to prevent HTML injection
   * @param text - Text to escape
   * @returns HTML-escaped text
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Generate plain text version of verification email
   * Note: Template text is intentionally hardcoded in Japanese per issue requirements
   * @param serviceName - Name of the service
   * @param verificationUrl - URL for email verification
   * @returns Plain text email content
   */
  private getVerificationEmailText(
    serviceName: string,
    verificationUrl: string,
  ): string {
    return `${serviceName}仮登録を行いました。

続いて以下のワンタイムURLより本登録のお手続きが可能です。
ワンタイムURLの有効期限はお客様が、サイトにてお手続きしたタイミングから24時間です。

${verificationUrl}

（このメールには返信できません。）`;
  }

  /**
   * Generate HTML version of verification email
   * Note: Template text is intentionally hardcoded in Japanese per issue requirements
   * @param serviceName - Name of the service
   * @param verificationUrl - URL for email verification
   * @returns HTML email content
   */
  private getVerificationEmailHtml(
    serviceName: string,
    verificationUrl: string,
  ): string {
    const escapedServiceName = this.escapeHtml(serviceName);
    const escapedUrl = this.escapeHtml(verificationUrl);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>仮登録のお知らせ</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <p>${escapedServiceName}仮登録を行いました。</p>
    
    <p>続いて以下のワンタイムURLより本登録のお手続きが可能です。<br>
    ワンタイムURLの有効期限はお客様が、サイトにてお手続きしたタイミングから24時間です。</p>
    
    <p style="margin: 30px 0;">
      <a href="${escapedUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px;">本登録手続きへ</a>
    </p>
    
    <p style="font-size: 12px; color: #666;">
      URLをクリックできない場合は、以下のURLをコピーしてブラウザのアドレスバーに貼り付けてください：<br>
      ${escapedUrl}
    </p>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
    
    <p style="font-size: 12px; color: #999;">（このメールには返信できません。）</p>
  </div>
</body>
</html>
`;
  }

  /**
   * Send password reset email to user
   * @param email - User email address
   * @param token - Password reset token
   * @returns Promise that resolves when email is sent
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!email || email.trim() === "") {
      throw new BadRequestException("Email address is required");
    }
    if (!token || token.trim() === "") {
      throw new BadRequestException("Password reset token is required");
    }

    const serviceName =
      this.configService.get<string>("SERVICE_NAME") || "AuthJwt";
    const serviceUrl =
      this.configService.get<string>("SERVICE_URL") || "http://localhost:4000";
    const resetUrl = `${serviceUrl}/auth/password-reset/resetPassword?token=${encodeURIComponent(token)}`;

    const template = this.getPasswordResetEmailTemplate(serviceName, resetUrl);
    await this.sendEmail(email, template);
  }

  /**
   * Get email template for password reset
   * @param serviceName - Name of the service
   * @param resetUrl - URL for password reset
   * @returns Email template with subject, text, and html
   */
  private getPasswordResetEmailTemplate(
    serviceName: string,
    resetUrl: string,
  ): EmailTemplate {
    return {
      subject: "【パスワードリセットのお知らせ】",
      text: this.getPasswordResetEmailText(serviceName, resetUrl),
      html: this.getPasswordResetEmailHtml(serviceName, resetUrl),
    };
  }

  /**
   * Generate plain text version of password reset email
   * @param serviceName - Name of the service
   * @param resetUrl - URL for password reset
   * @returns Plain text email content
   */
  private getPasswordResetEmailText(
    serviceName: string,
    resetUrl: string,
  ): string {
    return `${serviceName}のパスワードリセットのリクエストを受け付けました。

以下のワンタイムURLよりパスワードの変更が可能です。
ワンタイムURLの有効期限は24時間です。

${resetUrl}

このメールに心当たりのない場合は、本メールを破棄してください。

（このメールには返信できません。）`;
  }

  /**
   * Generate HTML version of password reset email
   * @param serviceName - Name of the service
   * @param resetUrl - URL for password reset
   * @returns HTML email content
   */
  private getPasswordResetEmailHtml(
    serviceName: string,
    resetUrl: string,
  ): string {
    const escapedServiceName = this.escapeHtml(serviceName);
    const escapedUrl = this.escapeHtml(resetUrl);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>パスワードリセットのお知らせ</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <p>${escapedServiceName}のパスワードリセットのリクエストを受け付けました。</p>

    <p>以下のワンタイムURLよりパスワードの変更が可能です。<br>
    ワンタイムURLの有効期限は24時間です。</p>

    <p style="margin: 30px 0;">
      <a href="${escapedUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px;">パスワードを変更する</a>
    </p>

    <p style="font-size: 12px; color: #666;">
      URLをクリックできない場合は、以下のURLをコピーしてブラウザのアドレスバーに貼り付けてください：<br>
      ${escapedUrl}
    </p>

    <p>このメールに心当たりのない場合は、本メールを破棄してください。</p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

    <p style="font-size: 12px; color: #999;">（このメールには返信できません。）</p>
  </div>
</body>
</html>
`;
  }
}
