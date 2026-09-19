import { Entity } from '@workspace/kernel';
import { SessionId } from './SessionId.js';

export interface SessionProps {
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  userAgent: string;
  /**
   * SHA-256 hash of the refresh token. The plaintext token never touches
   * persistence вЂ” a leaked dump cannot be used to hijack sessions.
   */
  refreshTokenHash: string;
  expiresAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
}

export class Session extends Entity<SessionId> {
  private _userId: string;
  private _deviceId: string;
  private _deviceName: string;
  private _deviceType: string;
  private _ipAddress: string;
  private _userAgent: string;
  private _refreshTokenHash: string;
  private _expiresAt: Date;
  private _lastActiveAt: Date;
  private _createdAt: Date;
  private _revoked = false;

  private constructor(id: SessionId, props: SessionProps) {
    super(id);
    this._userId = props.userId;
    this._deviceId = props.deviceId;
    this._deviceName = props.deviceName;
    this._deviceType = props.deviceType;
    this._ipAddress = props.ipAddress;
    this._userAgent = props.userAgent;
    this._refreshTokenHash = props.refreshTokenHash;
    this._expiresAt = props.expiresAt;
    this._lastActiveAt = props.lastActiveAt;
    this._createdAt = props.createdAt;
  }

  get userId(): string {
    return this._userId;
  }
  get deviceId(): string {
    return this._deviceId;
  }
  get deviceName(): string {
    return this._deviceName;
  }
  get deviceType(): string {
    return this._deviceType;
  }
  get ipAddress(): string {
    return this._ipAddress;
  }
  get userAgent(): string {
    return this._userAgent;
  }
  get refreshTokenHash(): string {
    return this._refreshTokenHash;
  }
  get expiresAt(): Date {
    return this._expiresAt;
  }
  get lastActiveAt(): Date {
    return this._lastActiveAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get revoked(): boolean {
    return this._revoked;
  }

  refresh(nextHash: string, newExpiry: Date): void {
    this._refreshTokenHash = nextHash;
    this._expiresAt = newExpiry;
    this._lastActiveAt = new Date();
  }

  isExpired(): boolean {
    return this._revoked || new Date() > this._expiresAt;
  }

  revoke(): void {
    this._revoked = true;
  }

  static create(id: SessionId, props: SessionProps): Session {
    return new Session(id, props);
  }
}