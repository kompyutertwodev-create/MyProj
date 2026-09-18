export interface EmailMessage {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  headers?: Record<string, string>;
}
export interface EmailService {
  send(message: EmailMessage): Promise<{ id: string }>;
}
