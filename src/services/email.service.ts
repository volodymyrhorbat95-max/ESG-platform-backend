// Email Service - Handles magic link email sending using Resend
import { Resend } from 'resend';
import { env } from '../config/env.js';

class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;

  constructor() {
    const apiKey = env.email.resendApiKey;
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY not configured - email functionality will be disabled');
      this.resend = null as any;
    } else {
      this.resend = new Resend(apiKey);
    }

    this.fromEmail = env.email.fromEmail;
    this.frontendUrl = env.frontend.url;
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
        subject: 'Your CSR26 Login Link',
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
                    <p style="margin: 12px 0 0; color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.5;">
                      <a href="${this.frontendUrl}/privacy-policy" style="color: #10b981; text-decoration: none;">Privacy Policy</a> |
                      <a href="${this.frontendUrl}/terms-and-conditions" style="color: #10b981; text-decoration: none;">Terms & Conditions</a>
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

  /**
   * Send transaction confirmation email
   * Section 15.2: Sent after every completed transaction
   * Section 20.4: Includes impact URL for e-commerce flow (Point B)
   */
  async sendTransactionConfirmation(
    email: string,
    userName: string,
    transaction: {
      id: string;
      impactGrams: number;
      impactKg: string;
      date: string;
      sku: { code: string; name: string };
      amount: number;
    },
    userId: string,
    certificateUrl?: string,
    impactUrl?: string // Section 20.4: Tokenized URL for e-commerce landing page
  ): Promise<void> {
    if (!this.resend) {
      console.log('📧 Email disabled - Transaction confirmation would be sent to:', email);
      return;
    }

    const dashboardLink = `${this.frontendUrl}/dashboard/${userId}`;
    const greeting = userName !== 'Guest' ? userName : 'Valued Customer';
    const impactDisplay = transaction.impactGrams >= 1000
      ? `${transaction.impactKg} kg`
      : `${transaction.impactGrams} grams`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your Environmental Impact Confirmed',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Environmental Impact Confirmed</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">✅ Impact Confirmed</h1>
                    <p style="margin: 8px 0 0; color: #d1fae5; font-size: 14px;">CSR26 Environmental Impact Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 22px; font-weight: 600;">Thank you, ${greeting}!</h2>
                    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Your environmental contribution has been confirmed and verified through the CPRS protocol.
                    </p>

                    <!-- Impact Amount -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px; background-color: #f0fdf4; border-radius: 8px; border: 2px solid #10b981;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <p style="margin: 0 0 8px; color: #047857; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Plastic Removed</p>
                          <p style="margin: 0; color: #047857; font-size: 36px; font-weight: 700;">${impactDisplay}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Transaction Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px;">
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                          <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Details</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Date:</td>
                              <td align="right" style="padding: 4px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${transaction.date}</td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">SKU:</td>
                              <td align="right" style="padding: 4px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${transaction.sku.code}</td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Product:</td>
                              <td align="right" style="padding: 4px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${transaction.sku.name}</td>
                            </tr>
                            ${transaction.amount > 0 ? `
                            <tr>
                              <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Amount:</td>
                              <td align="right" style="padding: 4px 0; color: #1f2937; font-size: 14px; font-weight: 500;">€${transaction.amount.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Transaction ID:</td>
                              <td align="right" style="padding: 4px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${transaction.id.substring(0, 8)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Impact URL (Section 20.4: E-commerce Point B) -->
                    ${impactUrl ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px; background-color: #ecfdf5; border-radius: 8px; border: 1px solid #10b981;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0 0 12px; color: #047857; font-size: 14px; font-weight: 600;">🌊 View Your Environmental Impact</p>
                          <p style="margin: 0 0 16px; color: #065f46; font-size: 13px; line-height: 1.5;">
                            Click below to see the real impact your purchase has made on plastic removal.
                          </p>
                          <a href="${impactUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                            View My Impact
                          </a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- Dashboard Link -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                      <tr>
                        <td align="center" style="padding: 12px 0;">
                          <a href="${dashboardLink}" style="display: inline-block; padding: 16px 32px; background: ${impactUrl ? '#6b7280' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                            ${impactUrl ? 'View Full Dashboard' : 'View Your Dashboard'}
                          </a>
                        </td>
                      </tr>
                    </table>

                    ${certificateUrl ? `
                    <!-- Certificate Download -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0 0 12px; color: #92400e; font-size: 14px; font-weight: 600;">🎉 Certified Environmental Asset</p>
                          <p style="margin: 0 0 16px; color: #78350f; font-size: 13px; line-height: 1.5;">
                            Your transaction qualifies as a certified asset. Download your official certificate below.
                          </p>
                          <a href="${certificateUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            Download Certificate (PDF)
                          </a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Your contribution is verified through the CPRS protocol and complies with EU sustainability reporting directives.
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
                    <p style="margin: 12px 0 0; color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.5;">
                      <a href="${this.frontendUrl}/privacy-policy" style="color: #10b981; text-decoration: none;">Privacy Policy</a> |
                      <a href="${this.frontendUrl}/terms-and-conditions" style="color: #10b981; text-decoration: none;">Terms & Conditions</a>
                    </p>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      console.log('✅ Transaction confirmation email sent to:', email, '- Transaction ID:', transaction.id.substring(0, 8));
    } catch (error: any) {
      console.error('❌ Failed to send transaction confirmation email:', error);
      // Don't throw - transaction should complete even if email fails
    }
  }

  /**
   * Send threshold achievement email
   * Section 15.3: Sent when user crosses €10 threshold and unlocks certified assets
   */
  async sendThresholdAchievement(
    email: string,
    userName: string,
    totalImpactKg: number,
    totalAmountSpent: number,
    userId: string,
    certificateUrl?: string
  ): Promise<void> {
    if (!this.resend) {
      console.log('📧 Email disabled - Threshold achievement would be sent to:', email);
      return;
    }

    const dashboardLink = `${this.frontendUrl}/dashboard/${userId}`;
    const greeting = userName !== 'Guest' ? userName : 'Valued Customer';

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Congratulations! You\'ve Unlocked Certified Environmental Assets',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Threshold Achievement</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">🎉 Congratulations!</h1>
                    <p style="margin: 8px 0 0; color: #fef3c7; font-size: 16px; font-weight: 500;">Certified Environmental Assets Unlocked</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">Great news, ${greeting}!</h2>
                    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      You've reached a major milestone! Your total contribution has crossed the €10 threshold, unlocking certified environmental assets backed by the CPRS protocol.
                    </p>

                    <!-- Achievement Stats -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px;">
                      <tr>
                        <td style="padding: 24px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; border: 2px solid #f59e0b;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 8px 0; text-align: center;">
                                <p style="margin: 0 0 4px; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Impact Reached</p>
                                <p style="margin: 0; color: #92400e; font-size: 32px; font-weight: 700;">${totalImpactKg.toFixed(2)} kg</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; text-align: center; border-top: 1px solid #fbbf24;">
                                <p style="margin: 0 0 4px; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Contribution</p>
                                <p style="margin: 0; color: #92400e; font-size: 24px; font-weight: 700;">€${totalAmountSpent.toFixed(2)}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- What This Means -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px;">
                      <tr>
                        <td style="padding: 0 0 16px;">
                          <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">What This Means for You</h3>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 12px 0;">
                                <p style="margin: 0; color: #047857; font-size: 15px; font-weight: 600;">✓ Corsair Connect Account Created</p>
                                <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">Your certified assets are now registered in the official CPRS system</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0;">
                                <p style="margin: 0; color: #047857; font-size: 15px; font-weight: 600;">✓ Auditable & Bankable Assets</p>
                                <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">Your environmental contributions are verified and ESG-compliant</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 12px 0;">
                                <p style="margin: 0; color: #047857; font-size: 15px; font-weight: 600;">✓ Official Certification</p>
                                <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">Download your verified certificate for records and reporting</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Next Steps -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #10b981;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="margin: 0 0 12px; color: #047857; font-size: 16px; font-weight: 600;">Next Steps</p>
                          <ol style="margin: 0; padding-left: 20px; color: #1f2937; font-size: 14px; line-height: 1.8;">
                            <li>Access your dashboard to view your certified assets</li>
                            <li>Download your official certificate for your records</li>
                            <li>Continue building your environmental portfolio</li>
                            <li>Share your impact with others</li>
                          </ol>
                        </td>
                      </tr>
                    </table>

                    <!-- Action Buttons -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                      <tr>
                        <td align="center" style="padding: 12px 0;">
                          <a href="${dashboardLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                            Access Full Features
                          </a>
                        </td>
                      </tr>
                      ${certificateUrl ? `
                      <tr>
                        <td align="center" style="padding: 12px 0;">
                          <a href="${certificateUrl}" style="display: inline-block; padding: 14px 28px; background: #ffffff; color: #047857; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; border: 2px solid #10b981;">
                            Download Certificate (PDF)
                          </a>
                        </td>
                      </tr>
                      ` : ''}
                    </table>

                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                      Your assets are verified by Control Union and comply with EU CSRD directives.<br>
                      They are auditable, bankable, and valid for ESG rating improvements.
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
                    <p style="margin: 12px 0 0; color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.5;">
                      <a href="${this.frontendUrl}/privacy-policy" style="color: #10b981; text-decoration: none;">Privacy Policy</a> |
                      <a href="${this.frontendUrl}/terms-and-conditions" style="color: #10b981; text-decoration: none;">Terms & Conditions</a>
                    </p>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      console.log('✅ Threshold achievement email sent to:', email, '- Total impact:', totalImpactKg.toFixed(2), 'kg');
    } catch (error: any) {
      console.error('❌ Failed to send threshold achievement email:', error);
      // Don't throw - threshold update should complete even if email fails
    }
  }
}

export default new EmailService();
