// Email Service - Handles magic link email sending using Resend
import { Resend } from 'resend';

class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured - email functionality will be disabled');
      this.resend = null as any;
    } else {
      this.resend = new Resend(apiKey);
    }

    this.fromEmail = process.env.FROM_EMAIL || 'CSR26 <noreply@csr26.it>';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  /**
   * Send magic link email for passwordless authentication
   */
  async sendMagicLink(email: string, token: string, userName?: string): Promise<void> {
    if (!this.resend) {
      console.log('📧 Email disabled - Magic link would be sent to:', email);
      console.log('🔗 Magic link URL:', `${this.frontendUrl}/auth/verify?token=${token}`);
      return;
    }

    const magicLink = `${this.frontendUrl}/auth/verify?token=${token}`;
    const greeting = userName ? `Hello ${userName}` : 'Hello';

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Access Your CSR26 Dashboard',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Access Your Dashboard</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">CSR26</h1>
                    <p style="margin: 8px 0 0; color: #d1fae5; font-size: 14px;">Environmental Impact Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">${greeting},</h2>
                    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Click the button below to securely access your environmental impact dashboard.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 12px 0;">
                          <a href="${magicLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                            Access My Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      <strong>Security note:</strong> This link will expire in 15 minutes and can only be used once.
                    </p>
                    <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      If you didn't request this link, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.5;">
                      CSR26 Impact Processor<br>
                      Certified plastic removal tracking<br>
                      <a href="${this.frontendUrl}" style="color: #10b981; text-decoration: none;">csr26.it</a>
                    </p>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('❌ Failed to send magic link email:', error);
        // Don't throw error - just log it and continue
        // This allows login to work even when email service is unavailable
        console.log('⚠️ Email service unavailable - magic link created but not sent');
        console.log('🔗 Magic link URL (not sent):', magicLink);
        return;
      }

      console.log('✅ Magic link email sent successfully to:', email, '- ID:', data?.id);
    } catch (error: any) {
      console.error('❌ Email service error:', error);
      // Don't throw error - just log it and continue
      console.log('⚠️ Email service unavailable - magic link created but not sent');
      console.log('🔗 Magic link token:', token);
    }
  }

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(
    email: string,
    userId: string,
    userName?: string
  ): Promise<void> {
    if (!this.resend) {
      console.log('📧 Email disabled - Registration confirmation would be sent to:', email);
      return;
    }

    const dashboardLink = `${this.frontendUrl}/dashboard/${userId}`;
    const greeting = userName ? `Welcome ${userName}` : 'Welcome';

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Welcome to CSR26 - Your Environmental Impact Journey Starts Now',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🌍 ${greeting}!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px;">
                      Thank you for joining CSR26. Your journey to making a real environmental impact begins now.
                    </p>
                    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px;">
                      Access your dashboard anytime to track your plastic removal impact:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${dashboardLink}" style="display: inline-block; padding: 16px 32px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                            View My Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px;">
                      Bookmark this link for quick access to your impact dashboard.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      console.log('✅ Registration confirmation sent to:', email);
    } catch (error) {
      console.error('❌ Failed to send registration confirmation:', error);
      // Don't throw - registration should succeed even if email fails
    }
  }
}

export default new EmailService();
