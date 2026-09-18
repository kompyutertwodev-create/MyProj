export interface OAuthLoginResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
  isNewUser: boolean;
  user: {
    id: string;
    email: string | null;
    displayName: string;
    avatarUrl: string | null;
    roles: string[];
  };
}
