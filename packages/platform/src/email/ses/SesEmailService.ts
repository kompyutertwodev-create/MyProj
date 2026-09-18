import type { EmailMessage, EmailService } from '../EmailService.js';
export interface SesClient {
  send(command: { input: Record<string, unknown> }): Promise<{ MessageId?: string }>;
}
export class SesEmailService implements EmailService {
  constructor(
    private readonly from: string,
    private readonly client: SesClient
  ) {}
  async send(message: EmailMessage): Promise<{ id: string }> {
    const r = await this.client.send({
      input: {
        Source: message.from ?? this.from,
        Destination: {
          ToAddresses: Array.isArray(message.to) ? message.to : [message.to],
          CcAddresses: message.cc,
          BccAddresses: message.bcc,
        },
        Message: {
          Subject: { Data: message.subject },
          Body: {
            Html: message.html ? { Data: message.html } : undefined,
            Text: message.text ? { Data: message.text } : undefined,
          },
        },
        ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
      },
    });
    return { id: r.MessageId ?? '' };
  }
}
