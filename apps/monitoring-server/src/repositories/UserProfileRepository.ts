import { eq, and, ne } from "drizzle-orm";
import { db } from "../db/connection";
import { users, sessions, accounts } from "../db/schema";

export const UserProfileRepository = {
  findById: (id: string) =>
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
        emailVerified: users.emailVerified,
        plan: users.plan,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .then(rows => rows[0]),

  updateProfile: (id: string, data: { name?: string; image?: string }) =>
    db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      ,

  getSessions: (userId: string) =>
    db
      .select({
        id: sessions.id,
        token: sessions.token,
        expiresAt: sessions.expiresAt,
        ipAddress: sessions.ipAddress,
        userAgent: sessions.userAgent,
        createdAt: sessions.createdAt,
      })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      ,

  findSessionById: (sessionId: string) =>
    db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        token: sessions.token,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .then(rows => rows[0]),

  revokeSession: (sessionId: string) =>
    db.delete(sessions).where(eq(sessions.id, sessionId)),

  revokeAllSessions: (userId: string, excludeToken?: string) => {
    if (excludeToken) {
      return db
        .delete(sessions)
        .where(and(eq(sessions.userId, userId), ne(sessions.token, excludeToken)))
        ;
    }
    return db.delete(sessions).where(eq(sessions.userId, userId));
  },

  getCredentialAccount: (userId: string) =>
    db
      .select({
        id: accounts.id,
        password: accounts.password,
        providerId: accounts.providerId,
      })
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
      .then(rows => rows[0]),
};
