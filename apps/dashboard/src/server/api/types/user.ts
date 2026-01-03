export type User = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean | null;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserSession = {
  id: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type Session = {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
  };
};

