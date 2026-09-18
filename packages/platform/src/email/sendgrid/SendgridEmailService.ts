import type { EmailMessage, EmailService } from '../EmailService.js';
export interface SendgridClient {
  send(data: Record<string, unknown>): Promise<unknown>;
}
export class SendgridEmailService implements EmailService {
  constructor(
    private readonly client: SendgridClient,
    private readonly from: string
  ) {}
  async send(message: EmailMessage): Promise<{ id: string }> {
    await this.client.send({
      to: message.to,
      from: message.from ?? this.from,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      cc: message.cc,
      bcc: message.bcc,
      headers: message.headers,
    });
    return { id: `sendgrid-${Date.now()}` };
  }
}
