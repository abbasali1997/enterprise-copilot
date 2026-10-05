export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type AuthSession = {
  user: AuthenticatedUser;
  organizationId: string | null;
};
