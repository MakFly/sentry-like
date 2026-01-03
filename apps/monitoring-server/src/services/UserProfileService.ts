import { UserProfileRepository } from "../repositories/UserProfileRepository";

export const UserProfileService = {
  getProfile: async (userId: string) => {
    const profile = await UserProfileRepository.findById(userId);
    if (!profile) {
      throw new Error("User not found");
    }
    return profile;
  },

  updateProfile: async (userId: string, data: { name?: string; image?: string }) => {
    const user = await UserProfileRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Filter out undefined values
    const updateData: { name?: string; image?: string } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.image !== undefined) updateData.image = data.image;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update");
    }

    await UserProfileRepository.updateProfile(userId, updateData);
    return { success: true };
  },

  getSessions: async (userId: string) => {
    const sessions = await UserProfileRepository.getSessions(userId);
    return sessions.map((session) => ({
      id: session.id,
      // Mask the token for security (show only last 8 chars)
      tokenPreview: session.token ? `...${session.token.slice(-8)}` : null,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
    }));
  },

  revokeSession: async (userId: string, sessionId: string) => {
    const session = await UserProfileRepository.findSessionById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Security check: ensure the session belongs to the requesting user
    if (session.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await UserProfileRepository.revokeSession(sessionId);
    return { success: true };
  },

  revokeAllSessions: async (userId: string, excludeCurrentToken?: string) => {
    await UserProfileRepository.revokeAllSessions(userId, excludeCurrentToken);
    return { success: true };
  },

  canChangePassword: async (userId: string) => {
    const account = await UserProfileRepository.getCredentialAccount(userId);
    // User can change password only if they have a credential account (not OAuth-only)
    return {
      canChange: !!account,
      hasPassword: !!(account?.password),
    };
  },
};
