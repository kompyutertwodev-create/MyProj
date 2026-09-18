export interface UserView {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}
