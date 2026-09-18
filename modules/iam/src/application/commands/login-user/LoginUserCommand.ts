export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  userAgent: string;
}

export interface LoginUserCommand {
  email: string;
  password: string;
  deviceInfo: DeviceInfo;
}
