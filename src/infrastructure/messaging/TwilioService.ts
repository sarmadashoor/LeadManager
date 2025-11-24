import twilio from 'twilio';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string; // Changed from messagingServiceSid
}

export interface SendSmsParams {
  to: string;
  body: string;
}

export class TwilioService {
  private client: twilio.Twilio;
  private phoneNumber: string;

  constructor(config: TwilioConfig) {
    this.client = twilio(config.accountSid, config.authToken);
    this.phoneNumber = config.phoneNumber;
  }

  async sendSms(params: SendSmsParams): Promise<{ success: boolean; messageSid?: string; error?: string }> {
    try {
      const message = await this.client.messages.create({
        to: params.to,
        from: this.phoneNumber, // Changed from messagingServiceSid
        body: params.body
      });

      console.log(`[TwilioService] SMS sent to ${params.to}, SID: ${message.sid}`);
      
      return {
        success: true,
        messageSid: message.sid
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[TwilioService] Failed to send SMS to ${params.to}:`, errorMsg);
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }
}