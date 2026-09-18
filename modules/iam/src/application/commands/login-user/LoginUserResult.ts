export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  roles: string[];
}

export interface LoginUserResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: UserDto;
}
