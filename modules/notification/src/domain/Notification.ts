import { AggregateRoot, DomainError, Result, err, ok } from '@workspace/kernel';
import { NotificationId } from './NotificationId.js';
import { RecipientId } from './RecipientId.js';
import { RecipientContact } from './RecipientContact.js';
import { NotificationChannel } from './NotificationChannel.js';
import { NotificationStatus } from './NotificationStatus.js';
import { NotificationSentEvent } from './events/NotificationSentEvent.js';
import { NotificationFailedEvent } from './events/NotificationFailedEvent.js';

export interface NotificationCreateProps {
  recipientId: string;
  contact: RecipientContact;
  subject: string;
  body: string;
  templateKey?: string | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationReconstructProps {
  id: string;
  recipientId: string;
  contact: RecipientContact;
  channel: NotificationChannel;
  status: NotificationStatus;
  subject: string;
  body: string;
  templateKey: string | null;
  metadata: Record<string, unknown>;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root: a single outbound notification.
 */
export class Notification extends AggregateRoot<NotificationId> {
  private _recipientId: RecipientId;
  private _contact: RecipientContact;
  private _status: NotificationStatus;
  private _subject: string;
  private _body: string;
  private _templateKey: string | null;
  private _metadata: Record<string, unknown>;
  private _errorMessage: string | null;
  private _sentAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: NotificationId,
    recipientId: RecipientId,
    contact: RecipientContact,
    status: NotificationStatus,
    subject: string,
    body: string,
    templateKey: string | null,
    metadata: Record<string, unknown>,
    errorMessage: string | null,
    sentAt: Date | null,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._recipientId = recipientId;
    this._contact = contact;
    this._status = status;
    this._subject = subject;
    this._body = body;
    this._templateKey = templateKey;
    this._metadata = metadata;
    this._errorMessage = errorMessage;
    this._sentAt = sentAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // --- Getters -------------------------------------------------------------

  get recipientId(): RecipientId {
    return this._recipientId;
  }

  get contact(): RecipientContact {
    return this._contact;
  }

  get channel(): NotificationChannel {
    return this._contact.channel;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get subject(): string {
    return this._subject;
  }

  get body(): string {
    return this._body;
  }

  get templateKey(): string | null {
    return this._templateKey;
  }

  get metadata(): Record<string, unknown> {
    return this._metadata;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get sentAt(): Date | null {
    return this._sentAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // --- Factory -------------------------------------------------------------

  static create(props: NotificationCreateProps): Result<Notification, DomainError> {
    const recipientResult = RecipientId.create(props.recipientId);
    if (recipientResult.isErr()) {
      return err(recipientResult.error);
    }

    const subject = props.subject?.trim();
    if (!subject) {
      return err(new DomainError('NOTIFICATION_SUBJECT_EMPTY', 'Subject cannot be empty'));
    }

    const body = props.body?.trim();
    if (!body) {
      return err(new DomainError('NOTIFICATION_BODY_EMPTY', 'Body cannot be empty'));
    }

    const now = new Date();
    return ok(
      new Notification(
        new NotificationId(),
        recipientResult.value,
        props.contact,
        NotificationStatus.Pending,
        subject,
        body,
        props.templateKey ?? null,
        props.metadata ?? {},
        null,
        null,
        now,
        now
      )
    );
  }

  static reconstruct(props: NotificationReconstructProps): Notification {
    return new Notification(
      new NotificationId(props.id),
      RecipientId.create(props.recipientId).getOrThrow(),
      props.contact,
      props.status,
      props.subject,
      props.body,
      props.templateKey,
      props.metadata,
      props.errorMessage,
      props.sentAt,
      props.createdAt,
      props.updatedAt
    );
  }

  // --- Business methods ----------------------------------------------------

  markAsSent(): Result<void, DomainError> {
    if (this._status === NotificationStatus.Sent) {
      return err(new DomainError('NOTIFICATION_ALREADY_SENT', 'Notification is already sent'));
    }
    this._status = NotificationStatus.Sent;
    this._sentAt = new Date();
    this._updatedAt = new Date();
    this._errorMessage = null;
    this.apply(
      new NotificationSentEvent(this.id.value, this.id.value, this._contact.channel, this._recipientId.value)
    );
    return ok(undefined);
  }

  markAsFailed(reason: string): Result<void, DomainError> {
    if (this._status === NotificationStatus.Sent) {
      return err(new DomainError('NOTIFICATION_ALREADY_SENT', 'Cannot fail a sent notification'));
    }
    this._status = NotificationStatus.Failed;
    this._errorMessage = reason;
    this._updatedAt = new Date();
    this.apply(
      new NotificationFailedEvent(this.id.value, this.id.value, this._contact.channel, reason)
    );
    return ok(undefined);
  }
}
