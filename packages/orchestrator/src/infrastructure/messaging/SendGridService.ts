import sgMail from '@sendgrid/mail';

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class SendGridService {
  private fromEmail: string;
  private fromName: string;

  constructor(config: SendGridConfig) {
    sgMail.setApiKey(config.apiKey);
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName || 'Tint World';
  }

  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const [response] = await sgMail.send({
        to: params.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: params.subject,
        text: params.text,
        html: params.html || params.text
      });

      console.log(`[SendGridService] Email sent to ${params.to}, ID: ${response.headers['x-message-id']}`);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'] as string
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[SendGridService] Failed to send email to ${params.to}:`, errorMsg);
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }
}